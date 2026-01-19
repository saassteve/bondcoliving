/*
  # Add Payment Tracking and Admin Notification System

  ## Overview
  This migration adds comprehensive payment tracking, admin notifications, and webhook monitoring
  to support a payment-first booking flow and real-time admin alerts.

  ## 1. Booking Status Updates
  - Add 'pending_payment' status to bookings table status constraint
  - Add booking_expires_at field (30 minutes from creation for unpaid bookings)
  - Add payment_required boolean flag
  - Update status constraint to include new pending_payment status

  ## 2. Admin Notifications Table
  - Create admin_notifications table for in-app notification system
  - Track new bookings, payment confirmations, and other admin alerts
  - Support read/unread status tracking
  - Link to specific bookings and admin users

  ## 3. Webhook Monitoring
  - Create webhook_logs table to track all incoming Stripe webhook events
  - Log event type, processing status, errors, and response details
  - Enable debugging and health monitoring of webhook processing

  ## 4. Email Queue Enhancement
  - Add admin notification emails to email_queue
  - Track notification email delivery status

  ## 5. Security & RLS
  - Enable RLS on all new tables
  - Admins can manage notifications and view webhook logs
  - Public cannot access webhook logs or notifications

  ## 6. Triggers
  - Auto-create admin notification when booking status changes to 'confirmed' and payment_status is 'paid'
  - Auto-set booking_expires_at when booking is created with pending_payment status

  ## 7. Indexes
  - Index notification status and timestamps for fast queries
  - Index webhook event types and processing status
  - Index booking status and payment_status for filtering
*/

-- ============================================================================
-- 1. Update bookings table - Add payment tracking fields
-- ============================================================================

-- Add new status value to existing constraint
DO $$
BEGIN
  -- Drop the old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bookings_status_valid' AND table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_status_valid;
  END IF;

  -- Add new constraint with pending_payment status
  ALTER TABLE bookings ADD CONSTRAINT bookings_status_valid
    CHECK (status IN ('pending_payment', 'confirmed', 'checked_in', 'checked_out', 'cancelled'));
END $$;

-- Add booking_expires_at field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'booking_expires_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN booking_expires_at timestamptz;
  END IF;
END $$;

-- Add payment_required field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_required'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_required boolean DEFAULT true;
  END IF;
END $$;

-- Add index for payment status queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_status_payment ON bookings(status, payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_expires_at ON bookings(booking_expires_at) WHERE booking_expires_at IS NOT NULL;

-- ============================================================================
-- 2. Create admin_notifications table
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES admin_users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN (
    'new_booking',
    'payment_received',
    'booking_cancelled',
    'booking_modified',
    'check_in',
    'check_out',
    'payment_failed',
    'system_alert'
  )),
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),

  -- Ensure valid notification type
  CONSTRAINT valid_notification_type CHECK (char_length(title) > 0 AND char_length(message) > 0)
);

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only authenticated admin users can view notifications
CREATE POLICY "Admins can view their notifications"
  ON admin_notifications
  FOR SELECT
  TO authenticated
  USING (
    admin_user_id IS NULL OR -- System-wide notifications
    admin_user_id = (
      SELECT id FROM admin_users
      WHERE email = (auth.jwt() ->> 'email')
      AND is_active = true
      LIMIT 1
    )
  );

-- RLS Policy: Admins can mark their own notifications as read
CREATE POLICY "Admins can update their notifications"
  ON admin_notifications
  FOR UPDATE
  TO authenticated
  USING (
    admin_user_id IS NULL OR
    admin_user_id = (
      SELECT id FROM admin_users
      WHERE email = (auth.jwt() ->> 'email')
      AND is_active = true
      LIMIT 1
    )
  )
  WITH CHECK (
    admin_user_id IS NULL OR
    admin_user_id = (
      SELECT id FROM admin_users
      WHERE email = (auth.jwt() ->> 'email')
      AND is_active = true
      LIMIT 1
    )
  );

-- RLS Policy: System can insert notifications
CREATE POLICY "System can create notifications"
  ON admin_notifications
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_admin_user ON admin_notifications(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_booking ON admin_notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON admin_notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON admin_notifications(notification_type);

-- ============================================================================
-- 3. Create webhook_logs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text, -- Stripe event ID
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processing_status text NOT NULL DEFAULT 'received' CHECK (processing_status IN (
    'received',
    'processing',
    'success',
    'failed',
    'retrying'
  )),
  error_message text,
  response_data jsonb,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),

  -- Unique constraint on event_id to prevent duplicate processing
  CONSTRAINT webhook_logs_event_id_unique UNIQUE (event_id)
);

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only authenticated admins can view webhook logs
CREATE POLICY "Admins can view webhook logs"
  ON webhook_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = (auth.jwt() ->> 'email')
      AND is_active = true
    )
  );

-- RLS Policy: System can insert webhook logs
CREATE POLICY "System can create webhook logs"
  ON webhook_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- RLS Policy: System can update webhook logs
CREATE POLICY "System can update webhook logs"
  ON webhook_logs
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(processing_status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_logs(event_id);

-- ============================================================================
-- 4. Create trigger function to auto-create admin notifications
-- ============================================================================

CREATE OR REPLACE FUNCTION create_admin_notification_on_booking_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create notification when status becomes 'confirmed' and payment is 'paid'
  IF NEW.status = 'confirmed' AND NEW.payment_status = 'paid'
     AND (OLD.status IS NULL OR OLD.status != 'confirmed' OR OLD.payment_status != 'paid') THEN

    -- Insert notification for all active admins
    INSERT INTO admin_notifications (
      admin_user_id,
      booking_id,
      notification_type,
      title,
      message,
      metadata
    )
    SELECT
      id,
      NEW.id,
      'payment_received',
      'New Paid Booking Confirmed',
      'Booking for ' || NEW.guest_name || ' from ' ||
        to_char(NEW.check_in_date, 'Mon DD') || ' to ' ||
        to_char(NEW.check_out_date, 'Mon DD') || ' - €' ||
        COALESCE(NEW.total_amount::text, '0'),
      jsonb_build_object(
        'booking_reference', NEW.booking_reference,
        'guest_email', NEW.guest_email,
        'amount', NEW.total_amount
      )
    FROM admin_users
    WHERE is_active = true;

  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS trigger_create_admin_notification ON bookings;
CREATE TRIGGER trigger_create_admin_notification
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_admin_notification_on_booking_confirmed();

-- ============================================================================
-- 5. Create function to set booking expiration time
-- ============================================================================

CREATE OR REPLACE FUNCTION set_booking_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If new booking is created with pending_payment status, set expiration to 30 minutes
  IF NEW.status = 'pending_payment' AND NEW.booking_expires_at IS NULL THEN
    NEW.booking_expires_at := NOW() + INTERVAL '30 minutes';
  END IF;

  -- If status changes from pending_payment to confirmed, clear expiration
  IF NEW.status != 'pending_payment' AND OLD.status = 'pending_payment' THEN
    NEW.booking_expires_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS trigger_set_booking_expiration ON bookings;
CREATE TRIGGER trigger_set_booking_expiration
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_expiration();

-- ============================================================================
-- 6. Create helper functions for admin queries
-- ============================================================================

-- Function to get unread notification count for an admin user
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_admin_email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_user_id uuid;
  v_count integer;
BEGIN
  -- Get admin user ID
  SELECT id INTO v_admin_user_id
  FROM admin_users
  WHERE email = p_admin_email AND is_active = true
  LIMIT 1;

  IF v_admin_user_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Count unread notifications
  SELECT COUNT(*)::integer
  INTO v_count
  FROM admin_notifications
  WHERE (admin_user_id = v_admin_user_id OR admin_user_id IS NULL)
    AND read_at IS NULL;

  RETURN COALESCE(v_count, 0);
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_notifications
  SET read_at = NOW()
  WHERE id = p_notification_id
    AND read_at IS NULL;

  RETURN FOUND;
END;
$$;

-- Function to mark all notifications as read for an admin
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_admin_email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_user_id uuid;
  v_count integer;
BEGIN
  -- Get admin user ID
  SELECT id INTO v_admin_user_id
  FROM admin_users
  WHERE email = p_admin_email AND is_active = true
  LIMIT 1;

  IF v_admin_user_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Mark all unread notifications as read
  UPDATE admin_notifications
  SET read_at = NOW()
  WHERE (admin_user_id = v_admin_user_id OR admin_user_id IS NULL)
    AND read_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================================
-- 7. Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON admin_notifications TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON webhook_logs TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;

-- ============================================================================
-- 8. Add helpful comments
-- ============================================================================

COMMENT ON TABLE admin_notifications IS 'Stores in-app notifications for admin users about bookings and system events';
COMMENT ON TABLE webhook_logs IS 'Logs all incoming Stripe webhook events for debugging and monitoring';
COMMENT ON COLUMN bookings.booking_expires_at IS 'Expiration time for pending_payment bookings (30 minutes from creation)';
COMMENT ON COLUMN bookings.payment_required IS 'Whether this booking requires payment before confirmation';
COMMENT ON FUNCTION create_admin_notification_on_booking_confirmed() IS 'Automatically creates admin notifications when bookings are confirmed with payment';
COMMENT ON FUNCTION set_booking_expiration() IS 'Automatically sets expiration time for pending_payment bookings';
