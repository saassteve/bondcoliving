/*
  # Fix Coworking Admin Visibility

  ## Problem
  Admins cannot see pass types and past bookings in the coworking management page.
  
  ## Root Cause
  1. For coworking_passes: The "Public can view active passes" policy only shows is_active=true.
     The admin policy exists but may be conflicting with other policies.
  2. For coworking_bookings: Multiple conflicting SELECT policies exist.
     The "Users can view own bookings" policy doesn't include admin fallback.
  
  ## Solution
  1. Drop all conflicting policies on both tables
  2. Recreate clean, non-overlapping policies:
     - Admin policies using is_admin() for full CRUD access
     - Public policies for limited read access
     - User policies for viewing own data

  ## Tables Modified
  - coworking_passes
  - coworking_bookings
*/

-- =====================================================
-- COWORKING_PASSES - Fix Admin Visibility
-- =====================================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Public can view active passes" ON coworking_passes;
DROP POLICY IF EXISTS "Public can read active coworking passes" ON coworking_passes;
DROP POLICY IF EXISTS "Admins can manage passes" ON coworking_passes;
DROP POLICY IF EXISTS "Admins can manage coworking passes" ON coworking_passes;

-- Create admin policy first (FOR ALL gives SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage passes"
  ON coworking_passes FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create public read policy for active passes only
CREATE POLICY "Public can view active passes"
  ON coworking_passes FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- =====================================================
-- COWORKING_BOOKINGS - Fix Admin Visibility
-- =====================================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can create bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Admins can manage bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Admins can manage coworking bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Anonymous users can create bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Customers can view own bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Users can read own bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON coworking_bookings;

-- Create admin policy first (FOR ALL gives full access)
CREATE POLICY "Admins can manage coworking bookings"
  ON coworking_bookings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Allow anyone (including anonymous) to create bookings for the public booking form
CREATE POLICY "Anyone can create bookings"
  ON coworking_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to view their own bookings by email
CREATE POLICY "Users can view own bookings"
  ON coworking_bookings FOR SELECT
  TO authenticated
  USING (
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- =====================================================
-- COWORKING_PASS_AVAILABILITY_SCHEDULES - Ensure Admin Access
-- =====================================================

DROP POLICY IF EXISTS "Public can view active schedules" ON coworking_pass_availability_schedules;
DROP POLICY IF EXISTS "Admins can manage schedules" ON coworking_pass_availability_schedules;

-- Admin full access
CREATE POLICY "Admins can manage schedules"
  ON coworking_pass_availability_schedules FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Public read for active schedules
CREATE POLICY "Public can view active schedules"
  ON coworking_pass_availability_schedules FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- =====================================================
-- Verify admin_users.user_id linkage
-- =====================================================

-- Update any admin_users records that have NULL user_id but matching email in auth.users
UPDATE admin_users
SET user_id = auth.users.id
FROM auth.users
WHERE admin_users.email = auth.users.email
  AND admin_users.user_id IS NULL;
