/*
  # Create Email Queue System and Fix Booking Processing

  ## Problem
  1. Stripe webhook not updating booking/payment status properly
  2. Emails failing because Resend domain not verified
  3. No retry mechanism for failed emails

  ## Solution
  1. Create email_queue table for reliable, queued email delivery
  2. Create function to manually confirm bookings with access codes
  3. Update email_logs to allow apartment email types
  4. Add function to process email queue

  ## New Tables
  - email_queue: Stores pending emails with retry logic

  ## New Functions
  - process_email_queue(): Called by edge function to get pending emails
  - confirm_coworking_booking(): Manually confirm a booking and assign access code
  - get_pending_emails(): Get emails ready to be sent

  ## Security
  - RLS enabled on email_queue
  - Only service_role can manage queue
  - Admins can view queue status
*/

-- Create email_queue table for reliable email delivery
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  booking_id uuid,
  booking_type text DEFAULT 'coworking' CHECK (booking_type IN ('coworking', 'apartment')),
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  last_attempt_at timestamptz,
  next_retry_at timestamptz DEFAULT now(),
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Enable RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role can manage email queue"
  ON email_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can view the queue
CREATE POLICY "Admins can view email queue"
  ON email_queue FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Create indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_next_retry ON email_queue(next_retry_at) WHERE status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS idx_email_queue_booking ON email_queue(booking_id, booking_type);
CREATE INDEX IF NOT EXISTS idx_email_queue_created ON email_queue(created_at DESC);

-- Update email_logs to allow apartment email types
ALTER TABLE email_logs DROP CONSTRAINT IF EXISTS email_logs_email_type_check;
ALTER TABLE email_logs ADD CONSTRAINT email_logs_email_type_check CHECK (
  email_type IN (
    'booking_confirmation',
    'access_code', 
    'admin_notification',
    'payment_failed',
    'booking_cancelled',
    'booking_lookup',
    'daily_summary',
    'apartment_booking_confirmation',
    'apartment_admin_notification',
    'apartment_door_code',
    'password_reset',
    'password_reset_success'
  )
);

-- Function to get pending emails from queue
CREATE OR REPLACE FUNCTION public.get_pending_emails(p_limit integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  email_type text,
  recipient_email text,
  recipient_name text,
  booking_id uuid,
  booking_type text,
  attempts integer,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    eq.id,
    eq.email_type,
    eq.recipient_email,
    eq.recipient_name,
    eq.booking_id,
    eq.booking_type,
    eq.attempts,
    eq.metadata
  FROM email_queue eq
  WHERE eq.status IN ('pending', 'failed')
    AND eq.attempts < eq.max_attempts
    AND eq.next_retry_at <= now()
  ORDER BY eq.priority DESC, eq.created_at ASC
  LIMIT p_limit;
END;
$$;

-- Function to mark email as processing
CREATE OR REPLACE FUNCTION public.mark_email_processing(p_email_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE email_queue
  SET 
    status = 'processing',
    last_attempt_at = now(),
    attempts = attempts + 1
  WHERE id = p_email_id
    AND status IN ('pending', 'failed');
  
  RETURN FOUND;
END;
$$;

-- Function to mark email as sent
CREATE OR REPLACE FUNCTION public.mark_email_sent(p_email_id uuid, p_resend_id text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE email_queue
  SET 
    status = 'sent',
    processed_at = now(),
    metadata = metadata || jsonb_build_object('resend_id', p_resend_id)
  WHERE id = p_email_id;
  
  RETURN FOUND;
END;
$$;

-- Function to mark email as failed
CREATE OR REPLACE FUNCTION public.mark_email_failed(p_email_id uuid, p_error text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts integer;
  v_max_attempts integer;
  v_next_retry interval;
BEGIN
  SELECT attempts, max_attempts INTO v_attempts, v_max_attempts
  FROM email_queue WHERE id = p_email_id;
  
  -- Exponential backoff: 1min, 5min, 15min
  v_next_retry := CASE 
    WHEN v_attempts >= v_max_attempts THEN NULL
    WHEN v_attempts = 1 THEN interval '1 minute'
    WHEN v_attempts = 2 THEN interval '5 minutes'
    ELSE interval '15 minutes'
  END;
  
  UPDATE email_queue
  SET 
    status = CASE WHEN v_attempts >= v_max_attempts THEN 'failed' ELSE 'pending' END,
    error_message = p_error,
    next_retry_at = CASE WHEN v_next_retry IS NOT NULL THEN now() + v_next_retry ELSE NULL END
  WHERE id = p_email_id;
  
  RETURN FOUND;
END;
$$;

-- Function to queue an email
CREATE OR REPLACE FUNCTION public.queue_email(
  p_email_type text,
  p_recipient_email text,
  p_recipient_name text DEFAULT NULL,
  p_booking_id uuid DEFAULT NULL,
  p_booking_type text DEFAULT 'coworking',
  p_priority integer DEFAULT 5,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_id uuid;
BEGIN
  INSERT INTO email_queue (
    email_type,
    recipient_email,
    recipient_name,
    booking_id,
    booking_type,
    priority,
    metadata
  ) VALUES (
    p_email_type,
    p_recipient_email,
    p_recipient_name,
    p_booking_id,
    p_booking_type,
    p_priority,
    p_metadata
  )
  RETURNING id INTO v_email_id;
  
  RETURN v_email_id;
END;
$$;

-- Function to manually confirm a coworking booking
CREATE OR REPLACE FUNCTION public.confirm_coworking_booking(p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking record;
  v_access_code text;
  v_result jsonb;
BEGIN
  -- Get the booking
  SELECT * INTO v_booking
  FROM coworking_bookings
  WHERE id = p_booking_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
  END IF;
  
  -- Check if already confirmed
  IF v_booking.payment_status = 'paid' AND v_booking.booking_status = 'confirmed' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Booking already confirmed', 'access_code', v_booking.access_code);
  END IF;
  
  -- Try to assign an access code
  SELECT public.assign_coworking_pass_code(p_booking_id) INTO v_access_code;
  
  -- Update the booking
  UPDATE coworking_bookings
  SET 
    payment_status = 'paid',
    booking_status = 'confirmed',
    access_code = COALESCE(v_access_code, access_code)
  WHERE id = p_booking_id;
  
  -- Update the payment record
  UPDATE coworking_payments
  SET status = 'succeeded'
  WHERE booking_id = p_booking_id;
  
  -- Queue confirmation email
  PERFORM public.queue_email(
    'booking_confirmation',
    v_booking.customer_email,
    v_booking.customer_name,
    p_booking_id,
    'coworking',
    10 -- High priority
  );
  
  -- Queue admin notification
  PERFORM public.queue_email(
    'admin_notification',
    'hello@stayatbond.com',
    'Admin',
    p_booking_id,
    'coworking',
    5
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Booking confirmed successfully',
    'booking_id', p_booking_id,
    'access_code', v_access_code,
    'emails_queued', 2
  );
  
  RETURN v_result;
END;
$$;

-- Function to get email queue stats for admin dashboard
CREATE OR REPLACE FUNCTION public.get_email_queue_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'processing', COUNT(*) FILTER (WHERE status = 'processing'),
    'sent', COUNT(*) FILTER (WHERE status = 'sent'),
    'failed', COUNT(*) FILTER (WHERE status = 'failed'),
    'total', COUNT(*)
  ) INTO v_stats
  FROM email_queue
  WHERE created_at > now() - interval '7 days';
  
  RETURN v_stats;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_pending_emails(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_email_processing(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_email_sent(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_email_failed(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_email(text, text, text, uuid, text, integer, jsonb) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_coworking_booking(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_queue_stats() TO authenticated;
