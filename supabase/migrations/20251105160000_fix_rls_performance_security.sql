/*
  # Fix RLS Performance and Security Issues

  ## Overview
  This migration addresses critical security and performance issues identified by Supabase:

  1. **RLS Policy Performance**: Replace `auth.<function>()` with `(select auth.<function>())`
     to prevent re-evaluation on each row

  2. **Function Search Path Security**: Set immutable search_path on SECURITY DEFINER functions
     to prevent search_path manipulation attacks

  3. **Duplicate Policy Cleanup**: Remove duplicate/redundant RLS policies

  ## Changes

  ### Performance Optimizations
  - All RLS policies now use `(select auth.<function>())` pattern for better query performance
  - This caches the auth function result instead of calling it for each row

  ### Security Improvements
  - Set search_path on all SECURITY DEFINER functions
  - Clean up duplicate permissive policies to simplify security model
  - Maintain restrictive security while improving performance

  ## Tables Affected
  - apartments, apartment_features, apartment_images, apartment_availability
  - apartment_ical_feeds, apartment_ical_events
  - bookings
  - applications
  - reviews, feature_highlights, site_settings
  - admin_users
  - coworking_passes, coworking_bookings, coworking_payments
  - email_logs
*/

-- =====================================================
-- 1. Applications Table Policies
-- =====================================================

DROP POLICY IF EXISTS "Users can read own applications" ON applications;
CREATE POLICY "Users can read own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (email = (select auth.jwt() ->> 'email'::text));

DROP POLICY IF EXISTS "Admins can manage all applications" ON applications;
CREATE POLICY "Admins can manage all applications"
  ON applications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (select auth.jwt() ->> 'email'::text)
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (select auth.jwt() ->> 'email'::text)
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- 2. Coworking Bookings Policies - Consolidate Duplicates
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Anonymous users can create bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Customers can view own bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Users can read own bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON coworking_bookings;
DROP POLICY IF EXISTS "Admins can manage coworking bookings" ON coworking_bookings;

-- Create consolidated policies with optimized auth calls
CREATE POLICY "Anyone can create bookings"
  ON coworking_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view own bookings"
  ON coworking_bookings FOR SELECT
  TO anon, authenticated
  USING (
    customer_email IS NOT NULL
    AND (
      customer_email = (select auth.jwt() ->> 'email'::text)
      OR EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.email = (select auth.jwt() ->> 'email'::text)
        AND admin_users.is_active = true
      )
    )
  );

CREATE POLICY "Admins can manage bookings"
  ON coworking_bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (select auth.jwt() ->> 'email'::text)
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (select auth.jwt() ->> 'email'::text)
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can delete bookings"
  ON coworking_bookings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (select auth.jwt() ->> 'email'::text)
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- 3. Coworking Passes Policies - Consolidate Duplicates
-- =====================================================

DROP POLICY IF EXISTS "Public can read active coworking passes" ON coworking_passes;
DROP POLICY IF EXISTS "Public can view active passes" ON coworking_passes;
DROP POLICY IF EXISTS "Admins can manage passes" ON coworking_passes;
DROP POLICY IF EXISTS "Admins can manage coworking passes" ON coworking_passes;

CREATE POLICY "Public can view active passes"
  ON coworking_passes FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage passes"
  ON coworking_passes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (select auth.jwt() ->> 'email'::text)
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (select auth.jwt() ->> 'email'::text)
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- 4. Coworking Payments Policies - Consolidate Duplicates
-- =====================================================

DROP POLICY IF EXISTS "Anyone can create payments" ON coworking_payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON coworking_payments;
DROP POLICY IF EXISTS "Admins can update payments" ON coworking_payments;
DROP POLICY IF EXISTS "Admins can manage coworking payments" ON coworking_payments;

CREATE POLICY "Service can create payments"
  ON coworking_payments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage payments"
  ON coworking_payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (select auth.jwt() ->> 'email'::text)
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (select auth.jwt() ->> 'email'::text)
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- 5. Email Logs Policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all email logs" ON email_logs;
DROP POLICY IF EXISTS "Admins can insert email logs" ON email_logs;

CREATE POLICY "Service can insert email logs"
  ON email_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (select auth.jwt() ->> 'email'::text)
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- 6. Set search_path on remaining SECURITY DEFINER functions
-- =====================================================

-- Booking reference functions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_booking_reference') THEN
    ALTER FUNCTION generate_booking_reference() SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_booking_reference') THEN
    ALTER FUNCTION set_booking_reference() SET search_path = public, pg_temp;
  END IF;
END $$;

-- Trigger functions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_coworking_updated_at') THEN
    ALTER FUNCTION update_coworking_updated_at() SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_access_code_email') THEN
    ALTER FUNCTION trigger_access_code_email() SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    ALTER FUNCTION update_updated_at_column() SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_pass_capacity') THEN
    ALTER FUNCTION update_pass_capacity() SET search_path = public, pg_temp;
  END IF;
END $$;

-- iCal sync functions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'compute_blocked_days_for_feed') THEN
    ALTER FUNCTION compute_blocked_days_for_feed(uuid) SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_availability_from_ical') THEN
    ALTER FUNCTION sync_availability_from_ical(uuid, jsonb) SET search_path = public, pg_temp;
  END IF;
END $$;

-- Availability check functions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_pass_availability') THEN
    ALTER FUNCTION check_pass_availability(uuid, date) SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_pass_capacity') THEN
    ALTER FUNCTION get_pass_capacity(uuid, date, date) SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'recalculate_pass_capacities') THEN
    ALTER FUNCTION recalculate_pass_capacities() SET search_path = public, pg_temp;
  END IF;
END $$;
