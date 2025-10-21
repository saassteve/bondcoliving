/*
  # Create Raw iCal Events Storage

  1. New Tables
    - `apartment_ical_events`
      - Stores raw VEVENT data without any timezone conversion
      - One row per event from iCal feeds
      - Tracks raw start/end values, timezone identifiers, and event status
      - Unique constraint on (apartment_id, feed_name, uid) to prevent duplicates
  
  2. Purpose
    - Eliminate timezone bugs by storing raw iCal data
    - Let Postgres handle all timezone conversions using AT TIME ZONE
    - Enable atomic day-bucketing with generate_series
    - Provide audit trail of what was actually in the iCal feed
  
  3. Security
    - Enable RLS on new table
    - Allow public read access for availability checking
    - Restrict writes to admins only
*/

-- Create raw events table
CREATE TABLE IF NOT EXISTS apartment_ical_events (
  id bigserial PRIMARY KEY,
  apartment_id uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  feed_name text NOT NULL,
  uid text NOT NULL,
  summary text,
  status text,
  sequence int,
  dtstart_raw text NOT NULL,
  dtstart_is_date boolean NOT NULL DEFAULT false,
  dtstart_tzid text,
  dtend_raw text NOT NULL,
  dtend_is_date boolean NOT NULL DEFAULT false,
  dtend_tzid text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(apartment_id, feed_name, uid)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ical_events_apartment_feed 
  ON apartment_ical_events(apartment_id, feed_name);

CREATE INDEX IF NOT EXISTS idx_ical_events_status 
  ON apartment_ical_events(apartment_id, feed_name, status);

-- Enable RLS
ALTER TABLE apartment_ical_events ENABLE ROW LEVEL SECURITY;

-- Public can read events for availability checking
CREATE POLICY "Public can read ical events"
  ON apartment_ical_events
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admins can manage events
CREATE POLICY "Admins can manage ical events"
  ON apartment_ical_events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  );