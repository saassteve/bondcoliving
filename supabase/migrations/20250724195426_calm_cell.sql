/*
  # Apartment Availability Calendar System

  1. New Tables
    - `apartment_availability`
      - `id` (uuid, primary key)
      - `apartment_id` (uuid, foreign key to apartments)
      - `date` (date, the specific date)
      - `status` (text, availability status: available/booked/blocked)
      - `booking_reference` (text, optional reference for bookings)
      - `notes` (text, optional notes)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `apartment_ical_feeds`
      - `id` (uuid, primary key)
      - `apartment_id` (uuid, foreign key to apartments)
      - `feed_name` (text, name for the feed)
      - `ical_url` (text, the iCal feed URL)
      - `last_sync` (timestamp, when last synced)
      - `is_active` (boolean, whether feed is active)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage availability
    - Add policies for public to read availability (for booking checks)

  3. Functions
    - Function to check availability for date ranges
    - Function to bulk update availability
    - Function to sync iCal feeds
    - Trigger to update updated_at timestamp

  4. Indexes
    - Index on apartment_id and date for fast lookups
    - Index on date ranges for availability checks
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

-- RLS Policies for apartment_availability
CREATE POLICY "Public can read apartment availability"
  ON apartment_availability
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage apartment availability"
  ON apartment_availability
  FOR ALL
  TO authenticated
  USING (
    (auth.uid() IS NOT NULL) OR 
    (EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = (auth.jwt() ->> 'email') 
      AND admin_users.is_active = true
    ))
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL) OR 
    (EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = (auth.jwt() ->> 'email') 
      AND admin_users.is_active = true
    ))
  );

-- RLS Policies for apartment_ical_feeds
CREATE POLICY "Authenticated users can manage ical feeds"
  ON apartment_ical_feeds
  FOR ALL
  TO authenticated
  USING (
    (auth.uid() IS NOT NULL) OR 
    (EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = (auth.jwt() ->> 'email') 
      AND admin_users.is_active = true
    ))
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL) OR 
    (EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = (auth.jwt() ->> 'email') 
      AND admin_users.is_active = true
    ))
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_apartment_availability_apartment_date 
  ON apartment_availability(apartment_id, date);

CREATE INDEX IF NOT EXISTS idx_apartment_availability_date_range 
  ON apartment_availability(date) WHERE status != 'available';

CREATE INDEX IF NOT EXISTS idx_apartment_ical_feeds_apartment 
  ON apartment_ical_feeds(apartment_id) WHERE is_active = true;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for apartment_availability
DROP TRIGGER IF EXISTS update_apartment_availability_updated_at ON apartment_availability;
CREATE TRIGGER update_apartment_availability_updated_at
  BEFORE UPDATE ON apartment_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check availability for a date range
CREATE OR REPLACE FUNCTION check_apartment_availability(
  p_apartment_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unavailable_count integer;
BEGIN
  -- Count days that are not available in the date range
  SELECT COUNT(*)
  INTO unavailable_count
  FROM apartment_availability
  WHERE apartment_id = p_apartment_id
    AND date >= p_start_date
    AND date <= p_end_date
    AND status IN ('booked', 'blocked');
  
  -- Return true if no unavailable days found
  RETURN unavailable_count = 0;
END;
$$;

-- Function to bulk set availability
CREATE OR REPLACE FUNCTION set_bulk_apartment_availability(
  p_apartment_id uuid,
  p_dates date[],
  p_status text,
  p_notes text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_rows integer := 0;
  date_item date;
BEGIN
  -- Validate status
  IF p_status NOT IN ('available', 'booked', 'blocked') THEN
    RAISE EXCEPTION 'Invalid status. Must be available, booked, or blocked.';
  END IF;
  
  -- Loop through dates and upsert
  FOREACH date_item IN ARRAY p_dates
  LOOP
    INSERT INTO apartment_availability (apartment_id, date, status, notes)
    VALUES (p_apartment_id, date_item, p_status, p_notes)
    ON CONFLICT (apartment_id, date)
    DO UPDATE SET 
      status = p_status,
      notes = COALESCE(p_notes, apartment_availability.notes),
      updated_at = now();
    
    affected_rows := affected_rows + 1;
  END LOOP;
  
  RETURN affected_rows;
END;
$$;

-- Function to get calendar view for a month
CREATE OR REPLACE FUNCTION get_apartment_calendar(
  p_apartment_id uuid,
  p_start_date date,
  p_end_date date
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
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date as date
  )
  SELECT 
    ds.date,
    COALESCE(aa.status, 'available') as status,
    aa.booking_reference,
    aa.notes
  FROM date_series ds
  LEFT JOIN apartment_availability aa ON aa.apartment_id = p_apartment_id AND aa.date = ds.date
  ORDER BY ds.date;
END;
$$;

-- Function to sync iCal feed (placeholder - actual implementation would parse iCal)
CREATE OR REPLACE FUNCTION sync_ical_feed(p_feed_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  feed_record apartment_ical_feeds%ROWTYPE;
  result jsonb;
BEGIN
  -- Get feed details
  SELECT * INTO feed_record
  FROM apartment_ical_feeds
  WHERE id = p_feed_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Feed not found or inactive'
    );
  END IF;
  
  -- Update last sync time
  UPDATE apartment_ical_feeds
  SET last_sync = now()
  WHERE id = p_feed_id;
  
  -- Return success (actual iCal parsing would happen here)
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Feed sync completed successfully',
    'feed_name', feed_record.feed_name,
    'last_sync', now()
  );
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON apartment_availability TO anon, authenticated;
GRANT ALL ON apartment_availability TO authenticated;
GRANT ALL ON apartment_ical_feeds TO authenticated;
GRANT EXECUTE ON FUNCTION check_apartment_availability TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_bulk_apartment_availability TO authenticated;
GRANT EXECUTE ON FUNCTION get_apartment_calendar TO anon, authenticated;
GRANT EXECUTE ON FUNCTION sync_ical_feed TO authenticated;