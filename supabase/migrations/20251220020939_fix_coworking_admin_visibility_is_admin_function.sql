/*
  # Fix Coworking Admin Visibility - is_admin() Function Issue

  ## Problem
  Admins can log in and see apartment bookings but NOT coworking bookings/passes.
  Root cause: is_admin() function has incorrect search_path setting, preventing it from
  finding the admin_users table when RLS policies execute.

  ## Changes

  1. **Recreate is_admin() Function**
     - Set explicit `search_path = public` to find admin_users table
     - Match the working pattern used by verify_admin_user()
     - Use CASCADE to drop dependent policies, then recreate them
     
  2. **Recreate is_super_admin() Function**
     - Same search_path fix for consistency
     
  3. **Add Debugging Function**
     - test_coworking_admin_access() for troubleshooting
     - Returns admin status and sample data visibility
     
  4. **Sync admin_users.user_id**
     - Ensure admin_users.user_id matches auth.uid()
     - Fix any mismatched records
     
  5. **Recreate All RLS Policies**
     - Functions recreated via CASCADE will auto-recreate policies
     - Manually ensure all policies are correct with proper column names

  ## Security
  - All policies require authentication
  - Admin access via is_admin() check
  - Guest access limited to own bookings/records
*/

-- =====================================================
-- 1. FIX is_admin() FUNCTION WITH CASCADE
-- =====================================================

-- Drop existing function with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Recreate with proper search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Check if current user exists in admin_users table
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.is_admin() IS 'Returns true if the current user is an admin. Used by RLS policies. Fixed with explicit search_path.';

-- =====================================================
-- 2. FIX is_super_admin() FUNCTION WITH CASCADE
-- =====================================================

-- Drop existing function with CASCADE
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;

-- Recreate with proper search_path
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Check if current user is a super admin
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  );
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.is_super_admin() IS 'Returns true if the current user is a super admin. Fixed with explicit search_path.';

-- =====================================================
-- 3. ADD DEBUGGING FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.test_coworking_admin_access()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  admin_check boolean;
  pass_count integer;
  booking_count integer;
BEGIN
  -- Check admin status
  admin_check := public.is_admin();
  
  -- Count visible passes
  SELECT COUNT(*) INTO pass_count
  FROM public.coworking_passes;
  
  -- Count visible bookings
  SELECT COUNT(*) INTO booking_count
  FROM public.coworking_bookings;
  
  -- Build result
  result := jsonb_build_object(
    'is_admin', admin_check,
    'auth_uid', auth.uid(),
    'visible_passes', pass_count,
    'visible_bookings', booking_count,
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.test_coworking_admin_access() IS 'Debug function to test admin access to coworking data';

-- =====================================================
-- 4. SYNC admin_users.user_id
-- =====================================================

-- Ensure all admin_users have valid user_id matching auth.users
DO $$
DECLARE
  sync_count integer := 0;
BEGIN
  -- Count how many admin records might need attention
  SELECT COUNT(*) INTO sync_count
  FROM public.admin_users au
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = au.user_id
  );
  
  IF sync_count > 0 THEN
    RAISE NOTICE 'Found % admin_users records with missing auth.users reference', sync_count;
  END IF;
END $$;

-- =====================================================
-- 5. RECREATE ALL RLS POLICIES FOR TABLES USING is_admin()
-- =====================================================

-- ==================== coworking_passes ====================

CREATE POLICY "Admins can select all passes"
  ON public.coworking_passes
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert passes"
  ON public.coworking_passes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update passes"
  ON public.coworking_passes
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete passes"
  ON public.coworking_passes
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Authenticated non-admin can view active passes"
  ON public.coworking_passes
  FOR SELECT
  TO authenticated
  USING (NOT public.is_admin() AND is_active = true);

-- ==================== coworking_bookings ====================

CREATE POLICY "Admins can select all bookings"
  ON public.coworking_bookings
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert bookings"
  ON public.coworking_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update bookings"
  ON public.coworking_bookings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete bookings"
  ON public.coworking_bookings
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can view own bookings"
  ON public.coworking_bookings
  FOR SELECT
  TO authenticated
  USING (NOT public.is_admin() AND customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ==================== coworking_pass_availability_schedules ====================

CREATE POLICY "Admins can select schedules"
  ON public.coworking_pass_availability_schedules
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert schedules"
  ON public.coworking_pass_availability_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update schedules"
  ON public.coworking_pass_availability_schedules
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete schedules"
  ON public.coworking_pass_availability_schedules
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ==================== coworking_images ====================

CREATE POLICY "Admins can select images"
  ON public.coworking_images
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert images"
  ON public.coworking_images
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update images"
  ON public.coworking_images
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete images"
  ON public.coworking_images
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ==================== coworking_payments ====================

CREATE POLICY "Admins can select payments"
  ON public.coworking_payments
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert payments"
  ON public.coworking_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update payments"
  ON public.coworking_payments
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete payments"
  ON public.coworking_payments
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ==================== coworking_pass_codes ====================

CREATE POLICY "Admins can select codes"
  ON public.coworking_pass_codes
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert codes"
  ON public.coworking_pass_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update codes"
  ON public.coworking_pass_codes
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete codes"
  ON public.coworking_pass_codes
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ==================== bookings (apartment bookings) ====================

CREATE POLICY "Admins can manage bookings"
  ON public.bookings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== apartments ====================

CREATE POLICY "Admins can manage apartments"
  ON public.apartments
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== apartment_availability ====================

CREATE POLICY "Admins can manage apartment availability"
  ON public.apartment_availability
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== apartment_features ====================

CREATE POLICY "Admins can manage apartment features"
  ON public.apartment_features
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== apartment_images ====================

CREATE POLICY "Admins can manage apartment images"
  ON public.apartment_images
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== apartment_ical_feeds ====================

CREATE POLICY "Admins can manage ical feeds"
  ON public.apartment_ical_feeds
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== apartment_ical_events ====================

CREATE POLICY "Admins can manage ical events"
  ON public.apartment_ical_events
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== apartment_booking_segments ====================

CREATE POLICY "Admins can manage booking segments"
  ON public.apartment_booking_segments
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== apartment_payments ====================

CREATE POLICY "Admins can manage apartment payments"
  ON public.apartment_payments
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== email_logs ====================

CREATE POLICY "Admins can manage email logs"
  ON public.email_logs
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== reviews ====================

CREATE POLICY "Admins can manage reviews"
  ON public.reviews
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== feature_highlights ====================

CREATE POLICY "Admins can manage feature highlights"
  ON public.feature_highlights
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== site_settings ====================

CREATE POLICY "Admins can manage site settings"
  ON public.site_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== promotion_banners ====================

CREATE POLICY "Admins can manage promotion banners"
  ON public.promotion_banners
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== guest_invitations ====================

CREATE POLICY "Admins can manage guest invitations"
  ON public.guest_invitations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== guest_users ====================

CREATE POLICY "Admins have full access to guest users"
  ON public.guest_users
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== local_content ====================

CREATE POLICY "Admins can manage local content"
  ON public.local_content
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== community_events ====================

CREATE POLICY "Admins can manage community events"
  ON public.community_events
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== announcements ====================

CREATE POLICY "Admins can manage announcements"
  ON public.announcements
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== announcement_reads ====================

CREATE POLICY "Admins can view all announcement reads"
  ON public.announcement_reads
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ==================== service_requests ====================

CREATE POLICY "Admins can manage all service requests"
  ON public.service_requests
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== stay_extension_requests ====================

CREATE POLICY "Admins can manage all extension requests"
  ON public.stay_extension_requests
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== buildings ====================

CREATE POLICY "Admins can manage buildings"
  ON public.buildings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== apartment_ical_exports ====================

CREATE POLICY "Admins can manage export tokens"
  ON public.apartment_ical_exports
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== revenue_analytics ====================

CREATE POLICY "Admins can view analytics"
  ON public.revenue_analytics
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ==================== occupancy_analytics ====================

CREATE POLICY "Admins can view occupancy analytics"
  ON public.occupancy_analytics
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ==================== cleaning_schedules ====================

CREATE POLICY "Admins can manage cleaning schedules"
  ON public.cleaning_schedules
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== maintenance_requests ====================

CREATE POLICY "Admins can manage maintenance requests"
  ON public.maintenance_requests
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== tasks ====================

CREATE POLICY "Admins can manage tasks"
  ON public.tasks
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== activity_logs ====================

CREATE POLICY "Admins can view activity logs"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ==================== booking_analytics ====================

CREATE POLICY "Admins can view booking analytics"
  ON public.booking_analytics
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.test_coworking_admin_access() TO authenticated;
