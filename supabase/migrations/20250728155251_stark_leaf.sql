/*
  # Guest Management and Enhanced Calendar System

  1. New Tables
    - `guest_stays` - Track actual guest stays with details
    - Enhanced `apartment_availability` with guest references

  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated admin access

  3. Functions
    - Guest management functions
    - Calendar sync functions
*/

-- Create guest_stays table for tracking actual guest information
CREATE TABLE IF NOT EXISTS guest_stays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  guest_email text,
  guest_phone text,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  booking_platform text, -- 'direct', 'airbnb', 'booking.com', etc.
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

-- Add guest_stay_id to apartment_availability for linking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'apartment_availability' AND column_name = 'guest_stay_id'
  ) THEN
    ALTER TABLE apartment_availability ADD COLUMN guest_stay_id uuid REFERENCES guest_stays(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE guest_stays ENABLE ROW LEVEL SECURITY;

-- Policies for guest_stays
CREATE POLICY "Authenticated users can manage guest stays"
  ON guest_stays
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL OR EXISTS ( 
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) AND admin_users.is_active = true
  ))
  WITH CHECK (auth.uid() IS NOT NULL OR EXISTS ( 
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) AND admin_users.is_active = true
  ));

-- Function to create guest stay and update availability
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
  v_guest_stay_id uuid;
  v_current_date date;
BEGIN
  -- Validate dates
  IF p_check_out_date <= p_check_in_date THEN
    RAISE EXCEPTION 'Check-out date must be after check-in date';
  END IF;

  -- Create guest stay record
  INSERT INTO guest_stays (
    apartment_id, guest_name, guest_email, guest_phone,
    check_in_date, check_out_date, booking_platform, booking_reference,
    door_code, special_instructions, guest_count, total_amount, currency, notes
  ) VALUES (
    p_apartment_id, p_guest_name, p_guest_email, p_guest_phone,
    p_check_in_date, p_check_out_date, p_booking_platform, p_booking_reference,
    p_door_code, p_special_instructions, p_guest_count, p_total_amount, p_currency, p_notes
  ) RETURNING id INTO v_guest_stay_id;

  -- Update apartment availability for the stay period
  v_current_date := p_check_in_date;
  WHILE v_current_date < p_check_out_date LOOP
    INSERT INTO apartment_availability (
      apartment_id, date, status, booking_reference, guest_stay_id, notes
    ) VALUES (
      p_apartment_id, v_current_date, 'booked', p_booking_reference, v_guest_stay_id,
      CASE WHEN v_current_date = p_check_in_date THEN 'Check-in: ' || p_guest_name
           WHEN v_current_date = p_check_out_date - 1 THEN 'Check-out: ' || p_guest_name
           ELSE p_guest_name END
    )
    ON CONFLICT (apartment_id, date) 
    DO UPDATE SET 
      status = 'booked',
      booking_reference = p_booking_reference,
      guest_stay_id = v_guest_stay_id,
      notes = EXCLUDED.notes,
      updated_at = now();
    
    v_current_date := v_current_date + 1;
  END LOOP;

  RETURN v_guest_stay_id;
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
CREATE OR REPLACE FUNCTION get_upcoming_stays(
  days_ahead integer DEFAULT 30
)
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
  WHERE gs.check_in_date <= CURRENT_DATE + days_ahead
    AND gs.check_out_date >= CURRENT_DATE
    AND gs.status IN ('confirmed', 'checked_in')
  ORDER BY gs.check_in_date ASC;
END;
$$;

-- Function to get calendar view with guest information
CREATE OR REPLACE FUNCTION get_calendar_with_guests(
  start_date date DEFAULT CURRENT_DATE,
  end_date date DEFAULT (CURRENT_DATE + INTERVAL '1 month')
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
    (aa.date = gs.check_out_date - 1) as is_checkout,
    gs.guest_count
  FROM apartment_availability aa
  JOIN apartments a ON a.id = aa.apartment_id
  LEFT JOIN guest_stays gs ON gs.id = aa.guest_stay_id
  WHERE aa.date >= start_date AND aa.date <= end_date
  ORDER BY aa.date ASC, a.title ASC;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_guest_stays_apartment_dates 
  ON guest_stays(apartment_id, check_in_date, check_out_date);

CREATE INDEX IF NOT EXISTS idx_guest_stays_checkin_date 
  ON guest_stays(check_in_date) WHERE status IN ('confirmed', 'checked_in');

CREATE INDEX IF NOT EXISTS idx_apartment_availability_guest_stay 
  ON apartment_availability(guest_stay_id) WHERE guest_stay_id IS NOT NULL;

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
GRANT EXECUTE ON FUNCTION create_guest_stay TO authenticated;
GRANT EXECUTE ON FUNCTION update_guest_stay TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_stays TO authenticated;
GRANT EXECUTE ON FUNCTION get_calendar_with_guests TO authenticated;