/*
  # Fix All Admin RLS Policies to Use user_id

  1. Problem
    - Many tables still check admin access using email from JWT
    - This is inefficient and can cause permission issues
    - The admin_users table now has user_id column linking to auth.users

  2. Solution
    - Update all RLS policies to check admin_users.user_id = auth.uid()
    - This is more efficient and reliable
    - Covers all tables: bookings, apartments, coworking, etc.

  3. Tables Updated
    - bookings
    - apartments
    - apartment_availability
    - apartment_features
    - apartment_images
    - apartment_ical_feeds
    - apartment_ical_events
    - apartment_booking_segments
    - apartment_payments
    - coworking_passes
    - coworking_bookings
    - coworking_payments
    - coworking_pass_availability_schedules
    - coworking_images
    - email_logs
    - applications
    - reviews
    - feature_highlights
    - site_settings
    - admin_users (remaining policies)
*/

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- BOOKINGS TABLE
DROP POLICY IF EXISTS "Admins can manage bookings" ON bookings;
CREATE POLICY "Admins can manage bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APARTMENTS TABLE
DROP POLICY IF EXISTS "Admins can manage apartments" ON apartments;
CREATE POLICY "Admins can manage apartments"
  ON apartments FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APARTMENT_AVAILABILITY TABLE
DROP POLICY IF EXISTS "Admins can manage apartment availability" ON apartment_availability;
CREATE POLICY "Admins can manage apartment availability"
  ON apartment_availability FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APARTMENT_FEATURES TABLE
DROP POLICY IF EXISTS "Admins can manage apartment features" ON apartment_features;
CREATE POLICY "Admins can manage apartment features"
  ON apartment_features FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APARTMENT_IMAGES TABLE
DROP POLICY IF EXISTS "Admins can manage apartment images" ON apartment_images;
CREATE POLICY "Admins can manage apartment images"
  ON apartment_images FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APARTMENT_ICAL_FEEDS TABLE
DROP POLICY IF EXISTS "Admins can manage ical feeds" ON apartment_ical_feeds;
CREATE POLICY "Admins can manage ical feeds"
  ON apartment_ical_feeds FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APARTMENT_ICAL_EVENTS TABLE
DROP POLICY IF EXISTS "Admins can manage ical events" ON apartment_ical_events;
CREATE POLICY "Admins can manage ical events"
  ON apartment_ical_events FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APARTMENT_BOOKING_SEGMENTS TABLE
DROP POLICY IF EXISTS "Authenticated users can manage segments" ON apartment_booking_segments;
CREATE POLICY "Admins can manage booking segments"
  ON apartment_booking_segments FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APARTMENT_PAYMENTS TABLE
DROP POLICY IF EXISTS "Authenticated users can manage payments" ON apartment_payments;
CREATE POLICY "Admins can manage apartment payments"
  ON apartment_payments FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- COWORKING_PASSES TABLE
DROP POLICY IF EXISTS "Admins can manage passes" ON coworking_passes;
CREATE POLICY "Admins can manage passes"
  ON coworking_passes FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- COWORKING_BOOKINGS TABLE
DROP POLICY IF EXISTS "Admins can manage bookings" ON coworking_bookings;
CREATE POLICY "Admins can manage coworking bookings"
  ON coworking_bookings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- COWORKING_PAYMENTS TABLE
DROP POLICY IF EXISTS "Admins can manage payments" ON coworking_payments;
CREATE POLICY "Admins can manage coworking payments"
  ON coworking_payments FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- COWORKING_PASS_AVAILABILITY_SCHEDULES TABLE
DROP POLICY IF EXISTS "Admins can manage schedules" ON coworking_pass_availability_schedules;
CREATE POLICY "Admins can manage schedules"
  ON coworking_pass_availability_schedules FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- COWORKING_IMAGES TABLE
DROP POLICY IF EXISTS "Admins can manage coworking images" ON coworking_images;
CREATE POLICY "Admins can manage coworking images"
  ON coworking_images FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- EMAIL_LOGS TABLE
DROP POLICY IF EXISTS "Admins can view email logs" ON email_logs;
CREATE POLICY "Admins can view email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can manage email logs"
  ON email_logs FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- APPLICATIONS TABLE
DROP POLICY IF EXISTS "Admins can manage all applications" ON applications;
CREATE POLICY "Admins can manage all applications"
  ON applications FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- REVIEWS TABLE
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
CREATE POLICY "Admins can manage reviews"
  ON reviews FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- FEATURE_HIGHLIGHTS TABLE
DROP POLICY IF EXISTS "Admins can manage feature highlights" ON feature_highlights;
CREATE POLICY "Admins can manage feature highlights"
  ON feature_highlights FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- SITE_SETTINGS TABLE
DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;
CREATE POLICY "Admins can manage site settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ADMIN_USERS TABLE (remaining policies)
DROP POLICY IF EXISTS "Admins can update own last_login" ON admin_users;
CREATE POLICY "Admins can update own last_login"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND is_active = true)
  WITH CHECK (user_id = auth.uid() AND is_active = true);

DROP POLICY IF EXISTS "Authenticated can verify admin status" ON admin_users;
CREATE POLICY "Authenticated can verify admin status"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND is_active = true);

-- PROMOTION_BANNERS TABLE
DROP POLICY IF EXISTS "Admins can manage promotion banners" ON promotion_banners;
CREATE POLICY "Admins can manage promotion banners"
  ON promotion_banners FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
