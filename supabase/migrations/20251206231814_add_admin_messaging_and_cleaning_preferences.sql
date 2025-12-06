/*
  # Admin Messaging and Cleaning Preferences

  ## Overview
  This migration adds support for guest-to-admin messaging and bi-weekly cleaning preferences
  for overnight guests.

  ## 1. New Tables

  ### `admin_support_tickets`
  - Support ticket/conversation system for guest-to-admin communication
  - Each ticket represents a conversation thread
  - Tracks status, priority, and assignment
  - Linked to guest users
  
  ### `admin_support_messages`
  - Individual messages within support tickets
  - Supports both guest and admin messages
  - Tracks sender type and read status
  
  ### `cleaning_preferences`
  - Stores guest preferences for bi-weekly cleaning schedule
  - Linked to guest users (overnight only)
  - Tracks preferred day of week and next scheduled cleaning

  ## 2. Security
  - Enable RLS on all new tables
  - Guests can view/create their own tickets and messages
  - Admins have full access to all tickets and messages
  - Guests can manage their own cleaning preferences
  - Admins can view all cleaning preferences

  ## 3. Updates to Existing Tables
  - Add DELETE policies for guest_users and guest_invitations
  - Allow admins to delete guest records and invitations
*/

-- Admin Support Tickets Table (Guest-to-Admin Messaging)
CREATE TABLE IF NOT EXISTS admin_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_user_id uuid REFERENCES guest_users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'maintenance', 'billing', 'amenities', 'other')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message_at timestamptz DEFAULT now(),
  last_message_preview text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin Support Messages Table
CREATE TABLE IF NOT EXISTS admin_support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES admin_support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('guest', 'admin')),
  sender_id uuid NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Cleaning Preferences Table
CREATE TABLE IF NOT EXISTS cleaning_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_user_id uuid REFERENCES guest_users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  preferred_day_of_week integer NOT NULL CHECK (preferred_day_of_week BETWEEN 0 AND 6),
  cleaning_frequency_weeks integer DEFAULT 2,
  next_cleaning_date date NOT NULL,
  last_cleaning_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_guest_user ON admin_support_tickets(guest_user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON admin_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON admin_support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON admin_support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender ON admin_support_messages(sender_id, sender_type);
CREATE INDEX IF NOT EXISTS idx_cleaning_preferences_guest_user ON cleaning_preferences(guest_user_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_preferences_next_date ON cleaning_preferences(next_cleaning_date);

-- Enable Row Level Security
ALTER TABLE admin_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_support_tickets

CREATE POLICY "Guests can view own support tickets"
  ON admin_support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = admin_support_tickets.guest_user_id
      AND guest_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Guests can create support tickets"
  ON admin_support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = admin_support_tickets.guest_user_id
      AND guest_users.user_id = auth.uid()
      AND guest_users.status = 'active'
    )
  );

CREATE POLICY "Guests can update own support tickets"
  ON admin_support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = admin_support_tickets.guest_user_id
      AND guest_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = admin_support_tickets.guest_user_id
      AND guest_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to support tickets"
  ON admin_support_tickets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for admin_support_messages

CREATE POLICY "Guests can view messages in own tickets"
  ON admin_support_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_support_tickets t
      JOIN guest_users gu ON t.guest_user_id = gu.id
      WHERE t.id = admin_support_messages.ticket_id
      AND gu.user_id = auth.uid()
    )
  );

CREATE POLICY "Guests can send messages in own tickets"
  ON admin_support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_support_tickets t
      JOIN guest_users gu ON t.guest_user_id = gu.id
      WHERE t.id = admin_support_messages.ticket_id
      AND gu.user_id = auth.uid()
      AND gu.id::text = admin_support_messages.sender_id::text
      AND admin_support_messages.sender_type = 'guest'
    )
  );

CREATE POLICY "Admins have full access to support messages"
  ON admin_support_messages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for cleaning_preferences

CREATE POLICY "Overnight guests can view own cleaning preferences"
  ON cleaning_preferences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = cleaning_preferences.guest_user_id
      AND guest_users.user_id = auth.uid()
      AND guest_users.user_type = 'overnight'
    )
  );

CREATE POLICY "Overnight guests can create cleaning preferences"
  ON cleaning_preferences FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = cleaning_preferences.guest_user_id
      AND guest_users.user_id = auth.uid()
      AND guest_users.user_type = 'overnight'
      AND guest_users.status = 'active'
    )
  );

CREATE POLICY "Overnight guests can update own cleaning preferences"
  ON cleaning_preferences FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = cleaning_preferences.guest_user_id
      AND guest_users.user_id = auth.uid()
      AND guest_users.user_type = 'overnight'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = cleaning_preferences.guest_user_id
      AND guest_users.user_id = auth.uid()
      AND guest_users.user_type = 'overnight'
    )
  );

CREATE POLICY "Admins can view all cleaning preferences"
  ON cleaning_preferences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage cleaning preferences"
  ON cleaning_preferences FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Add DELETE policies for guest_users (admins can delete)
CREATE POLICY "Admins can delete guest users"
  ON guest_users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Add DELETE policies for guest_invitations (admins can delete)
CREATE POLICY "Admins can delete guest invitations"
  ON guest_invitations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Function to calculate next cleaning date based on bi-weekly schedule
CREATE OR REPLACE FUNCTION calculate_next_cleaning_date(
  p_last_cleaning_date date,
  p_preferred_day_of_week integer,
  p_frequency_weeks integer
)
RETURNS date
LANGUAGE plpgsql
AS $$
DECLARE
  next_date date;
  days_until_preferred integer;
BEGIN
  -- Start from last cleaning date or today
  next_date := COALESCE(p_last_cleaning_date, CURRENT_DATE);
  
  -- Add the frequency in weeks
  next_date := next_date + (p_frequency_weeks || ' weeks')::interval;
  
  -- Adjust to the preferred day of week
  days_until_preferred := (p_preferred_day_of_week - EXTRACT(DOW FROM next_date)::integer + 7) % 7;
  next_date := next_date + (days_until_preferred || ' days')::interval;
  
  RETURN next_date;
END;
$$;

-- Function to get available cleaning days for a guest (bi-weekly schedule)
CREATE OR REPLACE FUNCTION get_available_cleaning_days(
  p_guest_user_id uuid
)
RETURNS TABLE (
  day_of_week integer,
  day_name text,
  next_available_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  check_in_date date;
  current_date_val date := CURRENT_DATE;
BEGIN
  -- Get the check-in date from the booking
  SELECT b.check_in_date INTO check_in_date
  FROM guest_users gu
  JOIN bookings b ON gu.booking_id = b.id
  WHERE gu.id = p_guest_user_id;
  
  -- If no check-in date, use current date
  check_in_date := COALESCE(check_in_date, current_date_val);
  
  -- Return all days of the week with their next available bi-weekly dates
  RETURN QUERY
  SELECT 
    dow.day_num,
    dow.day_name,
    (check_in_date + ((dow.day_num - EXTRACT(DOW FROM check_in_date)::integer + 7) % 7 || ' days')::interval)::date as next_date
  FROM (
    VALUES 
      (0, 'Sunday'),
      (1, 'Monday'),
      (2, 'Tuesday'),
      (3, 'Wednesday'),
      (4, 'Thursday'),
      (5, 'Friday'),
      (6, 'Saturday')
  ) AS dow(day_num, day_name)
  WHERE (check_in_date + ((dow.day_num - EXTRACT(DOW FROM check_in_date)::integer + 7) % 7 || ' days')::interval)::date >= current_date_val;
END;
$$;

-- Function to update ticket last message info
CREATE OR REPLACE FUNCTION update_ticket_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE admin_support_tickets
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.message, 100),
    updated_at = NEW.created_at
  WHERE id = NEW.ticket_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update ticket when message is added
CREATE TRIGGER update_ticket_on_message
  AFTER INSERT ON admin_support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_last_message();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_next_cleaning_date TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_cleaning_days TO authenticated;