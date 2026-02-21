/*
  # Fix Email Queue: Recover Stuck Processing Emails

  ## Problem
  Emails queued by the Stripe webhook were never processed because:
  1. The process-email-queue call from the webhook sometimes fails silently
  2. Emails in 'processing' state (stuck mid-run) are never retried
  3. No mechanism to recover emails that got stuck

  ## Changes
  1. Update get_pending_emails() to also return 'processing' emails older than 10 minutes
     (these are stuck from a crashed previous run)
  2. Reset current stuck 'processing' emails back to 'pending' so they get retried
  3. Update mark_email_processing to also handle 'processing' state (for retries)
*/

-- Fix get_pending_emails to recover stuck 'processing' emails (older than 10 minutes)
CREATE OR REPLACE FUNCTION get_pending_emails(p_limit integer DEFAULT 10)
RETURNS TABLE(
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
  WHERE (
    -- Normal pending/failed emails ready to retry
    (eq.status IN ('pending', 'failed')
      AND eq.attempts < eq.max_attempts
      AND eq.next_retry_at <= now())
    OR
    -- Stuck 'processing' emails (crashed mid-run, older than 10 minutes)
    (eq.status = 'processing'
      AND eq.last_attempt_at < now() - interval '10 minutes'
      AND eq.attempts < eq.max_attempts)
  )
  ORDER BY eq.priority DESC, eq.created_at ASC
  LIMIT p_limit;
END;
$$;

-- Fix mark_email_processing to also handle 'processing' state (stuck retries)
CREATE OR REPLACE FUNCTION mark_email_processing(p_email_id uuid)
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
  AND status IN ('pending', 'failed', 'processing');

  RETURN FOUND;
END;
$$;

-- Reset any currently stuck 'processing' emails (older than 10 minutes) back to pending
-- so the next queue run picks them up cleanly
UPDATE email_queue
SET status = 'pending', next_retry_at = now()
WHERE status = 'processing'
  AND last_attempt_at < now() - interval '10 minutes';
