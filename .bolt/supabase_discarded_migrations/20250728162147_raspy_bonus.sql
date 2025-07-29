/*
  # Add bookings management system

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key)
      - `apartment_id` (uuid, foreign key to apartments)
      - `guest_name` (text, required)
      - `guest_email` (text, optional)
      - `guest_phone` (text, optional)
      - `check_in_date` (date, required)
      - `check_out_date` (date, required)
      - `booking_source` (text, required - direct, airbnb, booking.com, etc.)
      - `booking_reference` (text, optional - platform booking ID)
      - `door_code` (text, optional)
      - `special_instructions` (text, optional)
      - `guest_count` (integer, default 1)
      - `total_amount` (decimal, optional)
      - `status` (text, default 'confirmed')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `bookings` table
    - Add policies for authenticated admin users to manage bookings
    - Add trigger for updated_at timestamp

  3. Indexes
    - Index on apartment_id for faster queries
    - Index on check_in_date for date-based filtering
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
  total_amount decimal(10,2),
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT bookings_status_check CHECK (status IN ('confirmed', 'checked_in', 'checked_out', 'cancelled')),
  CONSTRAINT bookings_guest_count_check CHECK (guest_count > 0),
  CONSTRAINT bookings_dates_check CHECK (check_out_date > check_in_date)
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can manage bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (
    (uid() IS NOT NULL) OR 
    (EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = (jwt() ->> 'email') 
      AND admin_users.is_active = true
    ))
  )
  WITH CHECK (
    (uid() IS NOT NULL) OR 
    (EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = (jwt() ->> 'email') 
      AND admin_users.is_active = true
    ))
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_apartment_id ON bookings(apartment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in_date ON bookings(check_in_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in_date, check_out_date);

-- Add updated_at trigger
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();