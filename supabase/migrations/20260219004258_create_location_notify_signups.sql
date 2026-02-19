/*
  # Create location notification signups table

  1. New Tables
    - `location_notify_signups`
      - `id` (uuid, primary key)
      - `email` (text, not null)
      - `building_slug` (text, not null)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Allow public inserts (anyone can sign up)
    - Admins can read all signups
*/

CREATE TABLE IF NOT EXISTS location_notify_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  building_slug text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (email, building_slug)
);

ALTER TABLE location_notify_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can sign up for notifications"
  ON location_notify_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read notification signups"
  ON location_notify_signups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );
