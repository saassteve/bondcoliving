/*
  # Fix Bookings RLS and Add Diagnostics
  
  1. Purpose
    - Ensure bookings table has proper RLS policies for admin access
    - Add diagnostic views to help troubleshoot authentication issues
    - Verify is_admin() function exists and works correctly
    
  2. Changes
    - Drop and recreate bookings RLS policies to be more explicit
    - Add a diagnostic function to check admin status
    - Ensure policies are not conflicting
    
  3. Security
    - Maintain strict RLS - only admins can manage bookings
    - Authenticated guests can only see their own bookings (if applicable)
*/

-- First, verify is_admin() function exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_admin'
  ) THEN
    CREATE OR REPLACE FUNCTION is_admin()
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
    BEGIN
      RETURN EXISTS (
        SELECT 1
        FROM admin_users
        WHERE user_id = auth.uid()
        AND is_active = true
      );
    END;
    $func$;
  END IF;
END $$;

-- Create a diagnostic function to help troubleshoot
CREATE OR REPLACE FUNCTION debug_admin_auth()
RETURNS TABLE (
  current_user_id uuid,
  current_user_email text,
  is_admin_result boolean,
  admin_user_exists boolean,
  admin_user_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_user_id,
    (auth.jwt() ->> 'email') as current_user_email,
    is_admin() as is_admin_result,
    EXISTS(
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    ) as admin_user_exists,
    EXISTS(
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    ) as admin_user_active;
END;
$$;

-- Drop all existing bookings policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can manage bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;

-- Create new, explicit policies for bookings table
CREATE POLICY "Admins can select bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (is_admin());

-- Grant execute permission on diagnostic function to authenticated users
GRANT EXECUTE ON FUNCTION debug_admin_auth() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
