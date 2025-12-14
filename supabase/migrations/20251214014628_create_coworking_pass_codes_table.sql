/*
  # Create Coworking Pass Codes Table

  1. New Tables
    - `coworking_pass_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique) - The access code to send to guests
      - `is_used` (boolean) - Whether the code has been assigned
      - `used_at` (timestamptz) - When the code was assigned
      - `booking_id` (uuid) - Reference to the booking that received this code
      - `created_at` (timestamptz) - When the code was created

  2. Security
    - Enable RLS on `coworking_pass_codes` table
    - Add policy for authenticated admins to manage codes
    - Add policy for service role to assign codes automatically

  3. Indexes
    - Add index on `is_used` for quick lookup of available codes
    - Add index on `booking_id` for quick lookup of codes by booking
*/

-- Create the coworking pass codes table
CREATE TABLE IF NOT EXISTS coworking_pass_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  is_used boolean DEFAULT false NOT NULL,
  used_at timestamptz,
  booking_id uuid REFERENCES coworking_bookings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE coworking_pass_codes ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coworking_pass_codes_is_used ON coworking_pass_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_coworking_pass_codes_booking_id ON coworking_pass_codes(booking_id);

-- Policy for admins to view all codes
CREATE POLICY "Admins can view all codes"
  ON coworking_pass_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Policy for admins to insert codes
CREATE POLICY "Admins can insert codes"
  ON coworking_pass_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Policy for admins to update codes
CREATE POLICY "Admins can update codes"
  ON coworking_pass_codes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Policy for admins to delete unused codes
CREATE POLICY "Admins can delete unused codes"
  ON coworking_pass_codes
  FOR DELETE
  TO authenticated
  USING (
    is_used = false
    AND EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Function to get and assign an unused code to a booking
CREATE OR REPLACE FUNCTION assign_coworking_pass_code(p_booking_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
BEGIN
  -- Get an unused code and mark it as used in one atomic operation
  UPDATE coworking_pass_codes
  SET 
    is_used = true,
    used_at = now(),
    booking_id = p_booking_id
  WHERE id = (
    SELECT id
    FROM coworking_pass_codes
    WHERE is_used = false
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING code INTO v_code;
  
  RETURN v_code;
END;
$$;