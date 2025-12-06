/*
  # Fix Infinite Recursion in Admin RLS Policies

  1. Problem
    - The `is_admin()` function queries `admin_users` table
    - The `admin_users` table has policies that also query `admin_users`
    - This creates infinite recursion: query admin_users → check policy → query admin_users → loop
    - Error: "infinite recursion detected in policy for relation admin_users"

  2. Solution
    - Recreate `is_admin()` function as SECURITY DEFINER to bypass RLS
    - Remove ALL recursive policies on `admin_users` table
    - Use simple, non-recursive policies on `admin_users`: just `user_id = auth.uid()`
    - All OTHER tables can safely use `is_admin()` function

  3. Key Principle
    - Policies on `admin_users` MUST NOT query `admin_users` again
    - Only the `is_admin()` function (running with elevated privileges) can query `admin_users`
    - This breaks the circular dependency

  4. Security
    - `is_admin()` runs as SECURITY DEFINER with owner privileges
    - It bypasses RLS to check admin status
    - Admin users can only read their own record in `admin_users`
    - Super admins get full access via the helper function, not via direct policy
*/

-- Drop existing functions with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;

-- Recreate is_admin function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- This function runs as SECURITY DEFINER, so it bypasses RLS
  -- This is safe because it only checks if the current user is an active admin
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- This function runs as SECURITY DEFINER, so it bypasses RLS
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;

-- ==============================================================================
-- ADMIN_USERS TABLE - NO RECURSIVE QUERIES ALLOWED
-- ==============================================================================

-- Drop ALL existing policies on admin_users (some were already dropped by CASCADE)
DROP POLICY IF EXISTS "Admin users can read own data" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can update own last_login" ON admin_users;
DROP POLICY IF EXISTS "Authenticated can verify admin status" ON admin_users;
DROP POLICY IF EXISTS "Super admins have full access" ON admin_users;

-- Create simple, non-recursive policies
-- These policies MUST NOT query admin_users table again

CREATE POLICY "Admin users can read own data"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin users can update own last_login"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Super admin access uses is_super_admin() function which bypasses RLS
CREATE POLICY "Super admins have full access"
  ON admin_users FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ==============================================================================
-- RECREATE ALL POLICIES THAT USE is_admin()
-- ==============================================================================

-- BOOKINGS
DROP POLICY IF EXISTS "Admins can manage bookings" ON bookings;
CREATE POLICY "Admins can manage bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APARTMENTS
DROP POLICY IF EXISTS "Admins can manage apartments" ON apartments;
CREATE POLICY "Admins can manage apartments"
  ON apartments FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APARTMENT_AVAILABILITY
DROP POLICY IF EXISTS "Admins can manage apartment availability" ON apartment_availability;
CREATE POLICY "Admins can manage apartment availability"
  ON apartment_availability FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APARTMENT_FEATURES
DROP POLICY IF EXISTS "Admins can manage apartment features" ON apartment_features;
CREATE POLICY "Admins can manage apartment features"
  ON apartment_features FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APARTMENT_IMAGES
DROP POLICY IF EXISTS "Admins can manage apartment images" ON apartment_images;
CREATE POLICY "Admins can manage apartment images"
  ON apartment_images FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APARTMENT_ICAL_FEEDS
DROP POLICY IF EXISTS "Admins can manage ical feeds" ON apartment_ical_feeds;
CREATE POLICY "Admins can manage ical feeds"
  ON apartment_ical_feeds FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APARTMENT_ICAL_EVENTS
DROP POLICY IF EXISTS "Admins can manage ical events" ON apartment_ical_events;
CREATE POLICY "Admins can manage ical events"
  ON apartment_ical_events FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APARTMENT_BOOKING_SEGMENTS
DROP POLICY IF EXISTS "Admins can manage booking segments" ON apartment_booking_segments;
CREATE POLICY "Admins can manage booking segments"
  ON apartment_booking_segments FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APARTMENT_PAYMENTS
DROP POLICY IF EXISTS "Admins can manage apartment payments" ON apartment_payments;
CREATE POLICY "Admins can manage apartment payments"
  ON apartment_payments FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- COWORKING_PASSES
DROP POLICY IF EXISTS "Admins can manage passes" ON coworking_passes;
CREATE POLICY "Admins can manage passes"
  ON coworking_passes FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- COWORKING_BOOKINGS
DROP POLICY IF EXISTS "Admins can manage coworking bookings" ON coworking_bookings;
CREATE POLICY "Admins can manage coworking bookings"
  ON coworking_bookings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- COWORKING_PAYMENTS
DROP POLICY IF EXISTS "Admins can manage coworking payments" ON coworking_payments;
CREATE POLICY "Admins can manage coworking payments"
  ON coworking_payments FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- COWORKING_PASS_AVAILABILITY_SCHEDULES
DROP POLICY IF EXISTS "Admins can manage schedules" ON coworking_pass_availability_schedules;
CREATE POLICY "Admins can manage schedules"
  ON coworking_pass_availability_schedules FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- COWORKING_IMAGES
DROP POLICY IF EXISTS "Admins can manage coworking images" ON coworking_images;
CREATE POLICY "Admins can manage coworking images"
  ON coworking_images FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- EMAIL_LOGS
DROP POLICY IF EXISTS "Admins can view email logs" ON email_logs;
DROP POLICY IF EXISTS "Admins can manage email logs" ON email_logs;
CREATE POLICY "Admins can view email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can manage email logs"
  ON email_logs FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APPLICATIONS
DROP POLICY IF EXISTS "Admins can manage all applications" ON applications;
CREATE POLICY "Admins can manage all applications"
  ON applications FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- REVIEWS
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
CREATE POLICY "Admins can manage reviews"
  ON reviews FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- FEATURE_HIGHLIGHTS
DROP POLICY IF EXISTS "Admins can manage feature highlights" ON feature_highlights;
CREATE POLICY "Admins can manage feature highlights"
  ON feature_highlights FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- SITE_SETTINGS
DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;
CREATE POLICY "Admins can manage site settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- PROMOTION_BANNERS
DROP POLICY IF EXISTS "Admins can manage promotion banners" ON promotion_banners;
CREATE POLICY "Admins can manage promotion banners"
  ON promotion_banners FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- GUEST_INVITATIONS
DROP POLICY IF EXISTS "Admins can manage guest invitations" ON guest_invitations;
CREATE POLICY "Admins can manage guest invitations"
  ON guest_invitations FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- GUEST_USERS
DROP POLICY IF EXISTS "Admins have full access to guest users" ON guest_users;
CREATE POLICY "Admins have full access to guest users"
  ON guest_users FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- LOCAL_CONTENT
DROP POLICY IF EXISTS "Admins can manage local content" ON local_content;
CREATE POLICY "Admins can manage local content"
  ON local_content FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- COMMUNITY_EVENTS
DROP POLICY IF EXISTS "Admins can manage community events" ON community_events;
CREATE POLICY "Admins can manage community events"
  ON community_events FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ANNOUNCEMENTS
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ANNOUNCEMENT_READS
DROP POLICY IF EXISTS "Admins can view all announcement reads" ON announcement_reads;
CREATE POLICY "Admins can view all announcement reads"
  ON announcement_reads FOR SELECT
  TO authenticated
  USING (is_admin());

-- SERVICE_REQUESTS
DROP POLICY IF EXISTS "Admins can manage all service requests" ON service_requests;
CREATE POLICY "Admins can manage all service requests"
  ON service_requests FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- STAY_EXTENSION_REQUESTS
DROP POLICY IF EXISTS "Admins can manage all extension requests" ON stay_extension_requests;
CREATE POLICY "Admins can manage all extension requests"
  ON stay_extension_requests FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
