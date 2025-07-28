/*
  # Add bookings table for guest management

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key)
      - `apartment_id` (uuid, foreign key to apartments)
      - `guest_name` (text, required)
      - `guest_email` (text, optional)
      - `guest_phone` (text, optional)
      - `check_in_date` (date, required)
      - `check_out_date` (date, required)
      - `booking_source` (text, platform where booking came from)
      - `booking_reference` (text, platform booking ID)
      - `door_code` (text, access code for guest)
      - `special_instructions` (text, notes and requirements)
      - `guest_count` (integer, number of guests)
      - `total_amount` (numeric, booking amount)
      - `status` (text, booking status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `bookings` table
    - Add policy for authenticated admin users to manage bookings

  3. Indexes
    - Index on apartment_id for quick apartment-based queries
    - Index on check_in_date for chronological sorting
    - Index on status for filtering
*/

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  guest_email text,
  guest_phone text,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  booking_source text NOT NULL DEFAULT 'direct',
  booking_reference text,
  door_code text,
  special_instructions text,
  guest_count integer NOT NULL DEFAULT 1,
  total_amount numeric(10,2),
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT bookings_check_in_before_check_out CHECK (check_in_date < check_out_date),
  CONSTRAINT bookings_guest_count_positive CHECK (guest_count > 0),
  CONSTRAINT bookings_status_valid CHECK (status IN ('confirmed', 'checked_in', 'checked_out', 'cancelled')),
  CONSTRAINT bookings_booking_source_valid CHECK (booking_source IN ('direct', 'airbnb', 'booking.com', 'vrbo', 'other'))
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_apartment_id ON bookings(apartment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in_date ON bookings(check_in_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in_date, check_out_date);

-- RLS Policies
CREATE POLICY "Authenticated users can manage bookings"
  ON bookings
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

-- Add updated_at trigger
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();