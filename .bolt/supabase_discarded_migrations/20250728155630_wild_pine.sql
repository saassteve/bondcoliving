/*
  # Calendar and Guest Management System

  1. New Tables
    - `apartment_availability` - Track daily availability status for each apartment
    - `apartment_ical_feeds` - Store iCal feed URLs for external calendar sync
    - `guest_stays` - Complete guest information and booking details

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated admin access and public read access
    - Secure functions with proper permissions

  3. Functions
    - `check_apartment_availability` - Check if apartment is available for date range
    - `get_apartment_calendar` - Get calendar view with availability status
    - `create_guest_stay` - Add new guest stay and sync calendar
    - `update_guest_stay` - Update guest information
    - `get_upcoming_stays` - Get upcoming check-ins/check-outs
    - `get_calendar_with_guests` - Get calendar with guest information

  4. Indexes
    - Performance indexes for date range queries
    - Composite indexes for common lookup patterns
*/

-- Create apartment_availability table
CREATE TABLE IF NOT EXISTS apartment_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  booking_reference text,
  notes text,
  guest_stay_id uuid,
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

-- Create guest_stays table
CREATE TABLE IF NOT EXISTS guest_stays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  guest_email text,
  guest_phone text,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  booking_platform text DEFAULT 'direct',
  booking_reference text,
  door_code text,
  special_instructions text,
  guest_count integer DEFAULT 1,
  total_amount decimal(10,2),
  currency text DEFAULT 'EUR',
  status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'checked_in', 'checked_out', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE apartment_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_ical_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_stays ENABLE ROW LEVEL SECURITY;

-- Policies for apartment_availability
CREATE POLICY "Authenticated users can manage apartment availability"
  ON apartment_availability
  FOR ALL
  TO authenticated
  USING ((auth.uid() IS NOT NULL) OR (EXISTS ( 
    SELECT 1 FROM admin_users 
    WHERE ((admin_users.email = (auth.jwt() ->> 'email'::text)) AND (admin_users.is_active = true))
  )))
  WITH CHECK ((auth.uid() IS NOT NULL) OR (EXISTS ( 
    SELECT 1 FROM admin_users 
    WHERE ((admin_users.email = (auth.jwt() ->> 'email'::text)) AND (admin_users.is_active = true))
  )));

CREATE POLICY "Public can read apartment availability"
  ON apartment_availability
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policies for apartment_ical_feeds
CREATE POLICY "Authenticated users can manage ical feeds"
  ON apartment_ical_feeds
  FOR ALL
  TO authenticated
  USING ((auth.uid() IS NOT NULL) OR (EXISTS ( 
    SELECT 1 FROM admin_users 
    WHERE ((admin_users.email = (auth.jwt() ->> 'email'::text)) AND (admin_users.is_active = true))
  )))
  WITH CHECK ((auth.uid() IS NOT NULL) OR (EXISTS ( 
    SELECT 1 FROM admin_users 
    WHERE ((admin_users.email = (auth.jwt() ->> 'email'::text)) AND (admin_users.is_active = true))
  )));

-- Policies for guest_stays
CREATE POLICY "Authenticated users can manage guest stays"
  ON guest_stays
  FOR ALL
  TO authenticated
  USING ((auth.uid() IS NOT NULL) OR (EXISTS ( 
    SELECT 1 FROM admin_users 
    WHERE ((admin_users.email = (auth.jwt() ->> 'email'::text)) AND (admin_users.is_active = true))
  )))
  WITH CHECK ((auth.uid() IS NOT NULL) OR (EXISTS ( 
    SELECT 1 FROM admin_users 
    WHERE ((admin_users.email = (auth.jwt() ->> 'email'::text)) AND (admin_users.is_active = true))
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

-- Function to create guest stay and sync calendar
CREATE OR REPLACE FUNCTION create_guest_stay(
  p_apartment_id uuid,
  p_guest_name text,
  p_guest_email text DEFAULT NULL,
  p_guest_phone text DEFAULT NULL,
  p_check_in_date date,
  p_check_out_date date,
  p_booking_platform text DEFAULT 'direct',
  p_booking_reference text DEFAULT NULL,
  p_door_code text DEFAULT NULL,
  p_special_instructions text DEFAULT NULL,
  p_guest_count integer DEFAULT 1,
  p_total_amount decimal DEFAULT NULL,
  p_currency text DEFAULT 'EUR',
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  guest_stay_id uuid;
  current_date date;
BEGIN
  -- Insert guest stay
  INSERT INTO guest_stays (
    apartment_id, guest_name, guest_email, guest_phone,
    check_in_date, check_out_date, booking_platform, booking_reference,
    door_code, special_instructions, guest_count, total_amount, currency, notes
  ) VALUES (
    p_apartment_id, p_guest_name, p_guest_email, p_guest_phone,
    p_check_in_date, p_check_out_date, p_booking_platform, p_booking_reference,
    p_door_code, p_special_instructions, p_guest_count, p_total_amount, p_currency, p_notes
  ) RETURNING id INTO guest_stay_id;

  -- Update apartment availability for the stay period
  current_date := p_check_in_date;
  WHILE current_date <= p_check_out_date LOOP
    INSERT INTO apartment_availability (apartment_id, date, status, booking_reference, guest_stay_id)
    VALUES (p_apartment_id, current_date, 'booked', p_booking_reference, guest_stay_id)
    ON CONFLICT (apartment_id, date) 
    DO UPDATE SET 
      status = 'booked',
      booking_reference = p_booking_reference,
      guest_stay_id = guest_stay_id,
      updated_at = now();
    
    current_date := current_date + 1;
  END LOOP;

  RETURN guest_stay_id;
END;
$$;

-- Function to update guest stay
CREATE OR REPLACE FUNCTION update_guest_stay(
  p_guest_stay_id uuid,
  p_guest_name text DEFAULT NULL,
  p_guest_email text DEFAULT NULL,
  p_guest_phone text DEFAULT NULL,
  p_door_code text DEFAULT NULL,
  p_special_instructions text DEFAULT NULL,
  p_guest_count integer DEFAULT NULL,
  p_total_amount decimal DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE guest_stays SET
    guest_name = COALESCE(p_guest_name, guest_name),
    guest_email = COALESCE(p_guest_email, guest_email),
    guest_phone = COALESCE(p_guest_phone, guest_phone),
    door_code = COALESCE(p_door_code, door_code),
    special_instructions = COALESCE(p_special_instructions, special_instructions),
    guest_count = COALESCE(p_guest_count, guest_count),
    total_amount = COALESCE(p_total_amount, total_amount),
    status = COALESCE(p_status, status),
    notes = COALESCE(p_notes, notes),
    updated_at = now()
  WHERE id = p_guest_stay_id;

  RETURN FOUND;
END;
$$;

-- Function to get upcoming stays
CREATE OR REPLACE FUNCTION get_upcoming_stays(days_ahead integer DEFAULT 30)
RETURNS TABLE (
  id uuid,
  apartment_id uuid,
  apartment_title text,
  guest_name text,
  guest_email text,
  guest_phone text,
  check_in_date date,
  check_out_date date,
  booking_platform text,
  booking_reference text,
  door_code text,
  status text,
  guest_count integer,
  days_until_checkin integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gs.id,
    gs.apartment_id,
    a.title as apartment_title,
    gs.guest_name,
    gs.guest_email,
    gs.guest_phone,
    gs.check_in_date,
    gs.check_out_date,
    gs.booking_platform,
    gs.booking_reference,
    gs.door_code,
    gs.status,
    gs.guest_count,
    (gs.check_in_date - CURRENT_DATE)::integer as days_until_checkin
  FROM guest_stays gs
  JOIN apartments a ON a.id = gs.apartment_id
  WHERE gs.check_in_date <= (CURRENT_DATE + days_ahead)
    AND gs.check_out_date >= CURRENT_DATE
    AND gs.status != 'cancelled'
  ORDER BY gs.check_in_date ASC, gs.created_at ASC;
END;
$$;

-- Function to get calendar with guest information
CREATE OR REPLACE FUNCTION get_calendar_with_guests(
  start_date date,
  end_date date
)
RETURNS TABLE (
  date date,
  apartment_id uuid,
  apartment_title text,
  status text,
  guest_name text,
  guest_email text,
  booking_platform text,
  booking_reference text,
  door_code text,
  is_checkin boolean,
  is_checkout boolean,
  guest_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aa.date,
    aa.apartment_id,
    a.title as apartment_title,
    aa.status,
    gs.guest_name,
    gs.guest_email,
    gs.booking_platform,
    aa.booking_reference,
    gs.door_code,
    (aa.date = gs.check_in_date) as is_checkin,
    (aa.date = gs.check_out_date) as is_checkout,
    gs.guest_count
  FROM apartment_availability aa
  JOIN apartments a ON a.id = aa.apartment_id
  LEFT JOIN guest_stays gs ON gs.id = aa.guest_stay_id
  WHERE aa.date >= start_date AND aa.date <= end_date
  ORDER BY aa.date ASC, a.title ASC;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_apartment_availability_apartment_date 
  ON apartment_availability(apartment_id, date);

CREATE INDEX IF NOT EXISTS idx_apartment_availability_date_range 
  ON apartment_availability(date) WHERE status != 'available';

CREATE INDEX IF NOT EXISTS idx_apartment_ical_feeds_apartment 
  ON apartment_ical_feeds(apartment_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_guest_stays_dates 
  ON guest_stays(check_in_date, check_out_date);

CREATE INDEX IF NOT EXISTS idx_guest_stays_apartment 
  ON guest_stays(apartment_id, check_in_date);

-- Update trigger for apartment_availability
CREATE OR REPLACE FUNCTION update_apartment_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_apartment_availability_updated_at
  BEFORE UPDATE ON apartment_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_apartment_availability_updated_at();

-- Update trigger for guest_stays
CREATE OR REPLACE FUNCTION update_guest_stays_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_guest_stays_updated_at
  BEFORE UPDATE ON guest_stays
  FOR EACH ROW
  EXECUTE FUNCTION update_guest_stays_updated_at();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON apartment_availability TO authenticated;
GRANT SELECT ON apartment_availability TO anon;
GRANT ALL ON apartment_ical_feeds TO authenticated;
GRANT ALL ON guest_stays TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION check_apartment_availability TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_apartment_calendar TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_guest_stay TO authenticated;
GRANT EXECUTE ON FUNCTION update_guest_stay TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_stays TO authenticated;
GRANT EXECUTE ON FUNCTION get_calendar_with_guests TO authenticated;