/*
  # Create apartment availability calendar system

  1. New Tables
    - `apartment_availability`
      - `id` (uuid, primary key)
      - `apartment_id` (uuid, foreign key to apartments)
      - `date` (date)
      - `status` (text: 'available', 'booked', 'blocked')
      - `booking_reference` (text, optional)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `apartment_ical_feeds`
      - `id` (uuid, primary key)
      - `apartment_id` (uuid, foreign key to apartments)
      - `feed_name` (text)
      - `ical_url` (text)
      - `last_sync` (timestamp)
      - `is_active` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage availability
    - Add policies for public to read availability (for booking checks)

  3. Functions
    - Function to sync iCal feeds
    - Function to check availability for date ranges
*/

-- Create apartment_availability table
CREATE TABLE IF NOT EXISTS apartment_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  booking_reference text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(apartment_id, date)
);

-- Create apartment_ical_feeds table
CREATE TABLE IF NOT EXISTS apartment_ical_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  feed_name text NOT NULL,
  ical_url text NOT NULL,
  last_sync timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE apartment_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_ical_feeds ENABLE ROW LEVEL SECURITY;

-- Policies for apartment_availability
CREATE POLICY "Authenticated users can manage availability"
  ON apartment_availability
  FOR ALL
  TO authenticated
  USING ((uid() IS NOT NULL) OR (EXISTS ( 
    SELECT 1 FROM admin_users 
    WHERE ((admin_users.email = (jwt() ->> 'email'::text)) AND (admin_users.is_active = true))
  )))
  WITH CHECK ((uid() IS NOT NULL) OR (EXISTS ( 
    SELECT 1 FROM admin_users 
    WHERE ((admin_users.email = (jwt() ->> 'email'::text)) AND (admin_users.is_active = true))
  )));

CREATE POLICY "Public can read availability"
  ON apartment_availability
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policies for apartment_ical_feeds
CREATE POLICY "Authenticated users can manage ical feeds"
  ON apartment_ical_feeds
  FOR ALL
  TO authenticated
  USING ((uid() IS NOT NULL) OR (EXISTS ( 
    SELECT 1 FROM admin_users 
    WHERE ((admin_users.email = (jwt() ->> 'email'::text)) AND (admin_users.is_active = true))
  )))
  WITH CHECK ((uid() IS NOT NULL) OR (EXISTS ( 
    SELECT 1 FROM admin_users 
    WHERE ((admin_users.email = (jwt() ->> 'email'::text)) AND (admin_users.is_active = true))
  )));

-- Function to check apartment availability for a date range
CREATE OR REPLACE FUNCTION check_apartment_availability(
  apartment_uuid uuid,
  start_date date,
  end_date date
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if any dates in the range are booked or blocked
  RETURN NOT EXISTS (
    SELECT 1 
    FROM apartment_availability 
    WHERE apartment_id = apartment_uuid 
      AND date >= start_date 
      AND date <= end_date 
      AND status IN ('booked', 'blocked')
  );
END;
$$;

-- Function to get availability calendar for an apartment
CREATE OR REPLACE FUNCTION get_apartment_calendar(
  apartment_uuid uuid,
  start_date date DEFAULT CURRENT_DATE,
  end_date date DEFAULT (CURRENT_DATE + INTERVAL '1 year')
)
RETURNS TABLE (
  date date,
  status text,
  booking_reference text,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(start_date, end_date, '1 day'::interval)::date AS date
  )
  SELECT 
    ds.date,
    COALESCE(aa.status, 'available') AS status,
    aa.booking_reference,
    aa.notes
  FROM date_series ds
  LEFT JOIN apartment_availability aa ON aa.apartment_id = apartment_uuid AND aa.date = ds.date
  ORDER BY ds.date;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_apartment_availability_apartment_date 
  ON apartment_availability(apartment_id, date);

CREATE INDEX IF NOT EXISTS idx_apartment_availability_status 
  ON apartment_availability(apartment_id, status, date);

CREATE INDEX IF NOT EXISTS idx_apartment_ical_feeds_apartment 
  ON apartment_ical_feeds(apartment_id, is_active);

-- Update trigger for apartment_availability
CREATE OR REPLACE FUNCTION update_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_apartment_availability_updated_at
  BEFORE UPDATE ON apartment_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_availability_updated_at();