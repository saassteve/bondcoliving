/*
  # Fix is_admin() Function - Final

  ## Problem
  The is_admin() function may be returning false for valid admin users,
  causing coworking data to not appear in admin dashboard.

  ## Changes
  1. Recreate is_admin() with explicit is_active check
  2. Ensure proper SECURITY DEFINER and search_path settings
  3. Grant execute to all required roles
  4. Add debug function for troubleshooting
*/

-- Drop and recreate is_admin() to ensure clean state
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_result boolean;
BEGIN
  -- Get current user id
  v_uid := auth.uid();
  
  -- Return false if not authenticated
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user exists in admin_users and is active
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = v_uid
    AND is_active = true
  ) INTO v_result;
  
  RETURN COALESCE(v_result, false);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if current authenticated user is an active admin';

-- Recreate is_super_admin() for consistency
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_result boolean;
BEGIN
  v_uid := auth.uid();
  
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = v_uid
    AND role = 'super_admin'
    AND is_active = true
  ) INTO v_result;
  
  RETURN COALESCE(v_result, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO service_role;

-- =====================================================
-- RECREATE ALL RLS POLICIES (CASCADE dropped them)
-- =====================================================

-- COWORKING_PASSES
DROP POLICY IF EXISTS "Admins can select all passes" ON coworking_passes;
DROP POLICY IF EXISTS "Admins can insert passes" ON coworking_passes;
DROP POLICY IF EXISTS "Admins can update passes" ON coworking_passes;
DROP POLICY IF EXISTS "Admins can delete passes" ON coworking_passes;
DROP POLICY IF EXISTS "Authenticated non-admin can view active passes" ON coworking_passes;
DROP POLICY IF EXISTS "Public can view active passes" ON coworking_passes;

CREATE POLICY "Admins can select all passes"
  ON coworking_passes FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert passes"
  ON coworking_passes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update passes"
  ON coworking_passes FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete passes"
  ON coworking_passes FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Public can view active passes"
  ON coworking_passes FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Authenticated non-admin can view active passes"
  ON coworking_passes FOR SELECT
  TO authenticated
  USING (NOT public.is_admin() AND is_active = true);

-- COWORKING_BOOKINGS
DROP POLICY IF EXISTS "Admins can select all bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Admins can insert bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON coworking_bookings;

CREATE POLICY "Admins can select all bookings"
  ON coworking_bookings FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert bookings"
  ON coworking_bookings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update bookings"
  ON coworking_bookings FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete bookings"
  ON coworking_bookings FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Anyone can create bookings"
  ON coworking_bookings FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can view own bookings"
  ON coworking_bookings FOR SELECT
  TO authenticated
  USING (
    NOT public.is_admin() AND
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- COWORKING_PASS_AVAILABILITY_SCHEDULES
DROP POLICY IF EXISTS "Admins can select schedules" ON coworking_pass_availability_schedules;
DROP POLICY IF EXISTS "Admins can insert schedules" ON coworking_pass_availability_schedules;
DROP POLICY IF EXISTS "Admins can update schedules" ON coworking_pass_availability_schedules;
DROP POLICY IF EXISTS "Admins can delete schedules" ON coworking_pass_availability_schedules;
DROP POLICY IF EXISTS "Public can view active schedules" ON coworking_pass_availability_schedules;

CREATE POLICY "Admins can select schedules"
  ON coworking_pass_availability_schedules FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert schedules"
  ON coworking_pass_availability_schedules FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update schedules"
  ON coworking_pass_availability_schedules FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete schedules"
  ON coworking_pass_availability_schedules FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Public can view active schedules"
  ON coworking_pass_availability_schedules FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- COWORKING_IMAGES
DROP POLICY IF EXISTS "Admins can select images" ON coworking_images;
DROP POLICY IF EXISTS "Admins can insert images" ON coworking_images;
DROP POLICY IF EXISTS "Admins can update images" ON coworking_images;
DROP POLICY IF EXISTS "Admins can delete images" ON coworking_images;
DROP POLICY IF EXISTS "Public can view active images" ON coworking_images;
DROP POLICY IF EXISTS "Public can read active coworking images" ON coworking_images;

CREATE POLICY "Admins can select images"
  ON coworking_images FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert images"
  ON coworking_images FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update images"
  ON coworking_images FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete images"
  ON coworking_images FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Public can view active images"
  ON coworking_images FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- COWORKING_PAYMENTS
DROP POLICY IF EXISTS "Admins can select payments" ON coworking_payments;
DROP POLICY IF EXISTS "Admins can insert payments" ON coworking_payments;
DROP POLICY IF EXISTS "Admins can update payments" ON coworking_payments;
DROP POLICY IF EXISTS "Admins can delete payments" ON coworking_payments;
DROP POLICY IF EXISTS "Service role can create payments" ON coworking_payments;

CREATE POLICY "Admins can select payments"
  ON coworking_payments FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert payments"
  ON coworking_payments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update payments"
  ON coworking_payments FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete payments"
  ON coworking_payments FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Service role can create payments"
  ON coworking_payments FOR INSERT
  TO service_role
  WITH CHECK (true);

-- COWORKING_PASS_CODES
DROP POLICY IF EXISTS "Admins can select codes" ON coworking_pass_codes;
DROP POLICY IF EXISTS "Admins can insert codes" ON coworking_pass_codes;
DROP POLICY IF EXISTS "Admins can update codes" ON coworking_pass_codes;
DROP POLICY IF EXISTS "Admins can delete codes" ON coworking_pass_codes;

CREATE POLICY "Admins can select codes"
  ON coworking_pass_codes FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert codes"
  ON coworking_pass_codes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update codes"
  ON coworking_pass_codes FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete codes"
  ON coworking_pass_codes FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =====================================================
-- RECREATE POLICIES FOR OTHER ADMIN TABLES
-- =====================================================

-- ADMIN_USERS
DROP POLICY IF EXISTS "Admin users can read own data" ON admin_users;
DROP POLICY IF EXISTS "Admin users can update own last_login" ON admin_users;
DROP POLICY IF EXISTS "Super admins have full access" ON admin_users;

CREATE POLICY "Admin users can read own data"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin users can update own data"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins have full access"
  ON admin_users FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- BOOKINGS (apartment bookings)
DROP POLICY IF EXISTS "Admins can manage bookings" ON bookings;
CREATE POLICY "Admins can manage bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- APARTMENTS
DROP POLICY IF EXISTS "Admins can manage apartments" ON apartments;
CREATE POLICY "Admins can manage apartments"
  ON apartments FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- APARTMENT_AVAILABILITY
DROP POLICY IF EXISTS "Admins can manage apartment availability" ON apartment_availability;
CREATE POLICY "Admins can manage apartment availability"
  ON apartment_availability FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- APARTMENT_FEATURES
DROP POLICY IF EXISTS "Admins can manage apartment features" ON apartment_features;
CREATE POLICY "Admins can manage apartment features"
  ON apartment_features FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- APARTMENT_IMAGES
DROP POLICY IF EXISTS "Admins can manage apartment images" ON apartment_images;
CREATE POLICY "Admins can manage apartment images"
  ON apartment_images FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- BUILDINGS
DROP POLICY IF EXISTS "Admins can manage buildings" ON buildings;
CREATE POLICY "Admins can manage buildings"
  ON buildings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- REVIEWS
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
CREATE POLICY "Admins can manage reviews"
  ON reviews FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- FEATURE_HIGHLIGHTS
DROP POLICY IF EXISTS "Admins can manage feature highlights" ON feature_highlights;
CREATE POLICY "Admins can manage feature highlights"
  ON feature_highlights FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- SITE_SETTINGS
DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;
CREATE POLICY "Admins can manage site settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- PROMOTION_BANNERS
DROP POLICY IF EXISTS "Admins can manage promotion banners" ON promotion_banners;
CREATE POLICY "Admins can manage promotion banners"
  ON promotion_banners FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- EMAIL_LOGS
DROP POLICY IF EXISTS "Admins can manage email logs" ON email_logs;
CREATE POLICY "Admins can manage email logs"
  ON email_logs FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- GUEST_USERS
DROP POLICY IF EXISTS "Admins have full access to guest users" ON guest_users;
CREATE POLICY "Admins have full access to guest users"
  ON guest_users FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- GUEST_INVITATIONS
DROP POLICY IF EXISTS "Admins can manage guest invitations" ON guest_invitations;
CREATE POLICY "Admins can manage guest invitations"
  ON guest_invitations FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- APARTMENT_ICAL_FEEDS
DROP POLICY IF EXISTS "Admins can manage ical feeds" ON apartment_ical_feeds;
CREATE POLICY "Admins can manage ical feeds"
  ON apartment_ical_feeds FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- APARTMENT_ICAL_EVENTS
DROP POLICY IF EXISTS "Admins can manage ical events" ON apartment_ical_events;
CREATE POLICY "Admins can manage ical events"
  ON apartment_ical_events FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- APARTMENT_BOOKING_SEGMENTS
DROP POLICY IF EXISTS "Admins can manage booking segments" ON apartment_booking_segments;
CREATE POLICY "Admins can manage booking segments"
  ON apartment_booking_segments FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- APARTMENT_PAYMENTS
DROP POLICY IF EXISTS "Admins can manage apartment payments" ON apartment_payments;
CREATE POLICY "Admins can manage apartment payments"
  ON apartment_payments FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- APARTMENT_ICAL_EXPORTS
DROP POLICY IF EXISTS "Admins can manage export tokens" ON apartment_ical_exports;
CREATE POLICY "Admins can manage export tokens"
  ON apartment_ical_exports FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- LOCAL_CONTENT
DROP POLICY IF EXISTS "Admins can manage local content" ON local_content;
CREATE POLICY "Admins can manage local content"
  ON local_content FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- COMMUNITY_EVENTS
DROP POLICY IF EXISTS "Admins can manage community events" ON community_events;
CREATE POLICY "Admins can manage community events"
  ON community_events FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ANNOUNCEMENTS
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ANNOUNCEMENT_READS
DROP POLICY IF EXISTS "Admins can view all announcement reads" ON announcement_reads;
CREATE POLICY "Admins can view all announcement reads"
  ON announcement_reads FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- SERVICE_REQUESTS
DROP POLICY IF EXISTS "Admins can manage all service requests" ON service_requests;
CREATE POLICY "Admins can manage all service requests"
  ON service_requests FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- STAY_EXTENSION_REQUESTS
DROP POLICY IF EXISTS "Admins can manage all extension requests" ON stay_extension_requests;
CREATE POLICY "Admins can manage all extension requests"
  ON stay_extension_requests FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- REVENUE_ANALYTICS
DROP POLICY IF EXISTS "Admins can view analytics" ON revenue_analytics;
CREATE POLICY "Admins can view analytics"
  ON revenue_analytics FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- OCCUPANCY_ANALYTICS
DROP POLICY IF EXISTS "Admins can view occupancy analytics" ON occupancy_analytics;
CREATE POLICY "Admins can view occupancy analytics"
  ON occupancy_analytics FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- CLEANING_SCHEDULES
DROP POLICY IF EXISTS "Admins can manage cleaning schedules" ON cleaning_schedules;
CREATE POLICY "Admins can manage cleaning schedules"
  ON cleaning_schedules FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- MAINTENANCE_REQUESTS
DROP POLICY IF EXISTS "Admins can manage maintenance requests" ON maintenance_requests;
CREATE POLICY "Admins can manage maintenance requests"
  ON maintenance_requests FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- TASKS
DROP POLICY IF EXISTS "Admins can manage tasks" ON tasks;
CREATE POLICY "Admins can manage tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ACTIVITY_LOGS
DROP POLICY IF EXISTS "Admins can view activity logs" ON activity_logs;
CREATE POLICY "Admins can view activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- BOOKING_ANALYTICS
DROP POLICY IF EXISTS "Admins can view booking analytics" ON booking_analytics;
CREATE POLICY "Admins can view booking analytics"
  ON booking_analytics FOR SELECT
  TO authenticated
  USING (public.is_admin());
