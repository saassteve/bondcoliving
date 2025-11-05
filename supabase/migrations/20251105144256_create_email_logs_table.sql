/*
  # Create Email Logs Table

  ## Purpose
  Track all emails sent from the system for audit trail and debugging

  ## New Tables
  - `email_logs`
    - `id` (uuid, primary key) - Unique identifier
    - `email_type` (text) - Type of email (booking_confirmation, access_code, admin_notification, etc.)
    - `recipient_email` (text) - Email address of recipient
    - `recipient_name` (text, nullable) - Name of recipient
    - `subject` (text) - Email subject line
    - `booking_id` (uuid, nullable) - Related coworking booking ID
    - `status` (text) - Delivery status (sent, delivered, failed, bounced)
    - `resend_id` (text, nullable) - Resend email ID for tracking
    - `error_message` (text, nullable) - Error details if failed
    - `metadata` (jsonb, nullable) - Additional data
    - `sent_at` (timestamptz) - When email was sent
    - `delivered_at` (timestamptz, nullable) - When email was delivered
    - `created_at` (timestamptz) - Record creation time

  ## Changes to Existing Tables
  - `coworking_bookings`
    - Add `confirmation_email_sent` (boolean, default false) - Track if confirmation sent
    - Add `access_code_email_sent_at` (timestamptz, nullable) - Track when access code was sent

  ## Security
  - Enable RLS on email_logs table
  - Only authenticated admins can view email logs
  - Automatic tracking of email send time

  ## Indexes
  - Index on recipient_email for lookup
  - Index on booking_id for related queries
  - Index on email_type for filtering
  - Index on sent_at for time-based queries
*/

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type text NOT NULL CHECK (email_type IN (
    'booking_confirmation',
    'access_code',
    'admin_notification',
    'payment_failed',
    'booking_cancelled',
    'booking_lookup',
    'daily_summary'
  )),
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  booking_id uuid REFERENCES coworking_bookings(id) ON DELETE SET NULL,
  status text DEFAULT 'sent' CHECK (status IN (
    'sent',
    'delivered',
    'failed',
    'bounced',
    'complained'
  )),
  resend_id text,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add email tracking fields to coworking_bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coworking_bookings' AND column_name = 'confirmation_email_sent'
  ) THEN
    ALTER TABLE coworking_bookings ADD COLUMN confirmation_email_sent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coworking_bookings' AND column_name = 'access_code_email_sent_at'
  ) THEN
    ALTER TABLE coworking_bookings ADD COLUMN access_code_email_sent_at timestamptz;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_logs
CREATE POLICY "Admins can view all email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ));

CREATE POLICY "Admins can insert email logs"
  ON email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ));

CREATE POLICY "Service role can manage email logs"
  ON email_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_booking_id ON email_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id ON email_logs(resend_id) WHERE resend_id IS NOT NULL;
