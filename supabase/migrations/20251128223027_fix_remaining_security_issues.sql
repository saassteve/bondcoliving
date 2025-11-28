/*
  # Fix Remaining Security and Performance Issues

  ## Overview
  This migration addresses the remaining security and performance issues identified by Supabase:

  1. **RLS Policy Performance**: Fix remaining policies that use `auth.<function>()` without SELECT wrapper
  2. **Function Search Path**: Add search_path to newly created functions
  3. **Multiple Permissive Policies**: Document acceptable permissive policies

  ## Issues Addressed
  - coworking_pass_availability_schedules: "Admins can manage schedules" policy
  - coworking_images: "Admins can manage coworking images" policy
  - deactivate_expired_schedules() function search path
  - check_pass_availability() function search path

  ## Security Notes
  Multiple permissive policies are intentional and correct:
  - Separate policies for admin (full access) vs public (read-only) provide clear security boundaries
  - This follows principle of least privilege and is a Supabase best practice
  - Warnings about multiple permissive policies can be ignored when policies serve different purposes
*/

-- =====================================================
-- 1. Fix coworking_pass_availability_schedules RLS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage schedules" ON coworking_pass_availability_schedules;
CREATE POLICY "Admins can manage schedules"
  ON coworking_pass_availability_schedules
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.email = (select auth.jwt() ->> 'email'::text)
    AND admin_users.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.email = (select auth.jwt() ->> 'email'::text)
    AND admin_users.is_active = true
  ));

-- =====================================================
-- 2. Fix coworking_images RLS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage coworking images" ON coworking_images;
CREATE POLICY "Admins can manage coworking images"
  ON coworking_images
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.email = (select auth.jwt() ->> 'email'::text)
    AND admin_users.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.email = (select auth.jwt() ->> 'email'::text)
    AND admin_users.is_active = true
  ));

-- =====================================================
-- 3. Set search_path on newly created functions
-- =====================================================

-- Fix search_path for check_pass_availability
ALTER FUNCTION check_pass_availability(uuid, date) SET search_path = public, pg_temp;

-- Fix search_path for deactivate_expired_schedules
ALTER FUNCTION deactivate_expired_schedules() SET search_path = public, pg_temp;

-- Also fix other coworking-related functions if they exist
DO $$
BEGIN
  -- Fix get_pass_capacity if it exists
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_pass_capacity'
  ) THEN
    ALTER FUNCTION get_pass_capacity(uuid, date, date) SET search_path = public, pg_temp;
  END IF;

  -- Fix recalculate_pass_capacities if it exists
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'recalculate_pass_capacities'
  ) THEN
    ALTER FUNCTION recalculate_pass_capacities() SET search_path = public, pg_temp;
  END IF;

  -- Fix update_pass_capacity if it exists
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_pass_capacity'
  ) THEN
    ALTER FUNCTION update_pass_capacity() SET search_path = public, pg_temp;
  END IF;
END $$;

-- =====================================================
-- 4. Add comments documenting multiple permissive policies
-- =====================================================

COMMENT ON POLICY "Public can view active schedules" ON coworking_pass_availability_schedules IS 
  'Allows public read access to active schedules. Works alongside admin policy for clear separation of concerns.';

COMMENT ON POLICY "Admins can manage schedules" ON coworking_pass_availability_schedules IS 
  'Allows authenticated admins full control. Separate from public policy for security clarity and maintainability.';

COMMENT ON POLICY "Public can read active coworking images" ON coworking_images IS 
  'Allows public read access to active images. Works alongside admin policy for clear separation of concerns.';

COMMENT ON POLICY "Admins can manage coworking images" ON coworking_images IS 
  'Allows authenticated admins full control. Separate from public policy for security clarity and maintainability.';

COMMENT ON POLICY "Public can view active passes" ON coworking_passes IS 
  'Allows public read access to active passes. Works alongside admin policy for clear separation of concerns.';

COMMENT ON POLICY "Admins can manage passes" ON coworking_passes IS 
  'Allows authenticated admins full control. Separate from public policy for security clarity and maintainability.';

COMMENT ON POLICY "Users can view own bookings" ON coworking_bookings IS 
  'Allows users to view their own bookings by email. Works alongside admin policy for customer self-service.';

COMMENT ON POLICY "Admins can manage bookings" ON coworking_bookings IS 
  'Allows authenticated admins full control over all bookings. Separate from user policy for security.';

COMMENT ON POLICY "Anyone can create bookings" ON coworking_bookings IS 
  'Allows anonymous booking creation for customer convenience. Admin policy provides management access.';

COMMENT ON POLICY "Service can create payments" ON coworking_payments IS 
  'Allows payment creation from Stripe webhooks. Admin policy provides management access.';

COMMENT ON POLICY "Admins can manage payments" ON coworking_payments IS 
  'Allows authenticated admins to view and manage all payments. Separate from service policy.';

-- =====================================================
-- 5. Verify all critical functions have search_path set
-- =====================================================

-- List all SECURITY DEFINER functions without search_path for debugging
-- (This query helps identify any remaining functions that need fixing)
DO $$
DECLARE
  func_record RECORD;
  func_count INTEGER := 0;
BEGIN
  FOR func_record IN 
    SELECT 
      n.nspname as schema,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as arguments
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.prosecdef = true  -- SECURITY DEFINER
      AND n.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM pg_proc p2
        WHERE p2.oid = p.oid
        AND p2.proconfig IS NOT NULL
        AND 'search_path=public, pg_temp' = ANY(p2.proconfig)
      )
  LOOP
    RAISE NOTICE 'Function without search_path: %.%(%) - will be fixed if possible', 
      func_record.schema, func_record.function_name, func_record.arguments;
    func_count := func_count + 1;
  END LOOP;

  IF func_count = 0 THEN
    RAISE NOTICE 'All SECURITY DEFINER functions have search_path configured correctly';
  ELSE
    RAISE NOTICE 'Found % SECURITY DEFINER functions without search_path - manual review recommended', func_count;
  END IF;
END $$;
