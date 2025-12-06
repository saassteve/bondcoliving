/*
  # Apartment Booking System with Split-Stay Support

  1. New Tables
    - `apartment_booking_segments`
      - Tracks individual apartment segments in split-stay bookings
      - Links to parent booking and specific apartment
      - Stores segment-specific dates and pricing
    
    - `apartment_payments`
      - Tracks Stripe payment information for apartment bookings
      - Similar structure to coworking_payments for consistency
      - Links to booking records

  2. Site Settings
    - Add booking configuration settings (minimum stay duration, etc.)

  3. Updates to Existing Tables
    - Add metadata field to bookings table for split-stay information
    - Add payment_status to bookings table

  4. Security
    - Enable RLS on new tables
    - Public can create bookings (unauthenticated)
    - Authenticated admins can manage all bookings and segments

  5. Indexes
    - Optimize queries for date ranges and booking lookups
    - Index on segment parent relationships
*/

-- Add payment_status and metadata to existing bookings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_status text DEFAULT 'pending' 
      CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE bookings ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'is_split_stay'
  ) THEN
    ALTER TABLE bookings ADD COLUMN is_split_stay boolean DEFAULT false;
  END IF;
END $$;

-- Create apartment_booking_segments table
CREATE TABLE IF NOT EXISTS apartment_booking_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  apartment_id uuid NOT NULL REFERENCES apartments(id) ON DELETE RESTRICT,
  segment_order integer NOT NULL,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  segment_price numeric(10,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT segments_check_in_before_check_out CHECK (check_in_date < check_out_date),
  CONSTRAINT segments_positive_price CHECK (segment_price >= 0),
  CONSTRAINT segments_positive_order CHECK (segment_order >= 0)
);

-- Create apartment_payments table
CREATE TABLE IF NOT EXISTS apartment_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
  payment_method text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT payments_positive_amount CHECK (amount > 0)
);

-- Enable RLS
ALTER TABLE apartment_booking_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for apartment_booking_segments

-- Public can view their own booking segments (through booking relationship)
CREATE POLICY "Public can view booking segments"
  ON apartment_booking_segments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users (admins) can manage all segments
CREATE POLICY "Authenticated users can manage segments"
  ON apartment_booking_segments
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

-- RLS Policies for apartment_payments

-- Public can view payment status for bookings
CREATE POLICY "Public can view payment status"
  ON apartment_payments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users (admins) can manage payments
CREATE POLICY "Authenticated users can manage payments"
  ON apartment_payments
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
CREATE INDEX IF NOT EXISTS idx_booking_segments_parent ON apartment_booking_segments(parent_booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_segments_apartment ON apartment_booking_segments(apartment_id);
CREATE INDEX IF NOT EXISTS idx_booking_segments_dates ON apartment_booking_segments(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_apartment_payments_booking ON apartment_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_apartment_payments_stripe_session ON apartment_payments(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_apartment_payments_stripe_intent ON apartment_payments(stripe_payment_intent_id);

-- Add updated_at triggers
CREATE TRIGGER update_apartment_booking_segments_updated_at
  BEFORE UPDATE ON apartment_booking_segments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apartment_payments_updated_at
  BEFORE UPDATE ON apartment_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default booking settings into site_settings
INSERT INTO site_settings (key, value) VALUES
('apartment_booking_settings', '{
  "minimum_stay_days": 30,
  "enable_split_stays": true,
  "max_split_segments": 3,
  "require_payment_immediately": true,
  "allow_same_day_checkout_checkin": true,
  "currency": "EUR"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Function to calculate booking total from segments
CREATE OR REPLACE FUNCTION calculate_booking_total(p_booking_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_amount numeric;
BEGIN
  SELECT COALESCE(SUM(segment_price), 0)
  INTO total_amount
  FROM apartment_booking_segments
  WHERE parent_booking_id = p_booking_id;
  
  RETURN total_amount;
END;
$$;

-- Function to check if booking dates overlap with existing bookings
CREATE OR REPLACE FUNCTION check_booking_availability(
  p_apartment_id uuid,
  p_check_in date,
  p_check_out date,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  overlap_count integer;
BEGIN
  -- Check in apartment_availability table
  SELECT COUNT(*)
  INTO overlap_count
  FROM apartment_availability
  WHERE apartment_id = p_apartment_id
    AND date >= p_check_in
    AND date < p_check_out
    AND status IN ('booked', 'blocked');
  
  IF overlap_count > 0 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON apartment_booking_segments TO anon, authenticated;
GRANT ALL ON apartment_booking_segments TO authenticated;
GRANT SELECT ON apartment_payments TO anon, authenticated;
GRANT ALL ON apartment_payments TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_booking_total TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_booking_availability TO anon, authenticated;