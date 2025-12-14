/*
  # Fix Bookings Visibility for Admin Dashboard

  1. Problem
    - Bookings have vanished from admin dashboard
    - Data still exists in Supabase database
    - RLS policies are preventing admin access

  2. Root Cause
    - Bookings table has 4 separate policies (select, insert, update, delete)
    - All use is_admin() function
    - Need to ensure is_admin() function is properly configured
    - Consolidate back to single FOR ALL policy for simplicity

  3. Solution
    - Recreate is_admin() function with proper configuration
    - Drop 4 separate bookings policies
    - Create single consolidated "Admins can manage bookings" policy
    - Add diagnostic function to help troubleshoot admin access issues

  4. Security
    - Only authenticated admin users with is_active = true can access bookings
    - is_admin() function runs as SECURITY DEFINER to bypass RLS on admin_users
*/

-- =====================================================
-- PART 1: Ensure is_admin() function is properly configured
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- This function runs as SECURITY DEFINER, so it bypasses RLS
  -- This is safe because it only checks if the current user is an active admin
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION is_admin() IS 'Returns true if the current authenticated user is an active admin. Uses SECURITY DEFINER to bypass RLS on admin_users table.';

-- =====================================================
-- PART 2: Fix bookings table RLS policies
-- =====================================================

-- Drop all existing bookings policies
DROP POLICY IF EXISTS "Admins can manage bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can manage bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can select bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view bookings" ON bookings;

-- Create single consolidated policy for all operations
CREATE POLICY "Admins can manage bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

COMMENT ON POLICY "Admins can manage bookings" ON bookings IS 'Allows admin users to perform all operations (SELECT, INSERT, UPDATE, DELETE) on bookings table.';

-- =====================================================
-- PART 3: Add diagnostic function for troubleshooting
-- =====================================================

CREATE OR REPLACE FUNCTION check_admin_booking_access()
RETURNS TABLE (
  current_user_id uuid,
  current_user_email text,
  is_authenticated boolean,
  admin_record_exists boolean,
  admin_is_active boolean,
  is_admin_result boolean,
  booking_count bigint,
  can_select_bookings boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_admin_exists boolean;
  v_admin_active boolean;
  v_is_admin boolean;
  v_booking_count bigint;
  v_can_select boolean;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Check admin status
  SELECT EXISTS(SELECT 1 FROM admin_users WHERE user_id = v_user_id) INTO v_admin_exists;
  SELECT EXISTS(SELECT 1 FROM admin_users WHERE user_id = v_user_id AND is_active = true) INTO v_admin_active;
  v_is_admin := is_admin();

  -- Try to count bookings (this will fail if RLS denies access)
  BEGIN
    SELECT count(*) INTO v_booking_count FROM bookings;
    v_can_select := true;
  EXCEPTION WHEN insufficient_privilege THEN
    v_booking_count := -1;
    v_can_select := false;
  END;

  RETURN QUERY SELECT
    v_user_id,
    v_user_email,
    v_user_id IS NOT NULL,
    v_admin_exists,
    v_admin_active,
    v_is_admin,
    v_booking_count,
    v_can_select;
END;
$$;

GRANT EXECUTE ON FUNCTION check_admin_booking_access() TO authenticated;

COMMENT ON FUNCTION check_admin_booking_access() IS 'Diagnostic function to check if current user can access bookings and why. Returns detailed information about authentication and admin status.';