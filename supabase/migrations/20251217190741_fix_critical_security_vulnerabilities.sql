/*
  # Fix Critical Security Vulnerabilities
  
  This migration addresses several critical security issues found during security audit:
  
  ## 1. Promotion Banners Security Issues
     - **CRITICAL**: Remove overly permissive policies that allow ANY authenticated user to create/update/delete
     - Keep admin-only management policy
     - Keep public read policy for active banners
  
  ## 2. Coworking Payments Security Issues
     - Restrict INSERT to service_role only (for webhook handlers)
     - Prevent unauthorized payment record creation
  
  ## 3. Email Logs Security Issues
     - Restrict INSERT to service_role only (for edge functions)
     - Prevent unauthorized log entries
  
  ## 4. Apartment Payments Visibility
     - Restrict SELECT to admins only
     - Remove public visibility of payment data
  
  ## Security Impact
     - Prevents unauthorized users from manipulating promotion banners
     - Prevents payment record manipulation
     - Prevents email log manipulation
     - Protects sensitive payment information
*/

-- ============================================================================
-- 1. FIX PROMOTION BANNERS SECURITY
-- ============================================================================

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can create promotion banners" ON promotion_banners;
DROP POLICY IF EXISTS "Authenticated users can update promotion banners" ON promotion_banners;
DROP POLICY IF EXISTS "Authenticated users can delete promotion banners" ON promotion_banners;
DROP POLICY IF EXISTS "Authenticated users can view all promotion banners" ON promotion_banners;

-- These policies should already exist, but let's ensure they're correct
DROP POLICY IF EXISTS "Admins can manage promotion banners" ON promotion_banners;
DROP POLICY IF EXISTS "Anyone can view active promotion banners" ON promotion_banners;

-- Recreate secure policies
CREATE POLICY "Admins can manage promotion banners"
  ON promotion_banners FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Anyone can view active promotion banners"
  ON promotion_banners FOR SELECT
  TO public
  USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= now()) 
    AND (end_date IS NULL OR end_date >= now())
  );

-- ============================================================================
-- 2. FIX COWORKING PAYMENTS SECURITY
-- ============================================================================

-- Drop the weak insert policy
DROP POLICY IF EXISTS "Service can create payments" ON coworking_payments;

-- Create secure service role policy
CREATE POLICY "Service role can create payments"
  ON coworking_payments FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Ensure admins can still manage all payments
DROP POLICY IF EXISTS "Admins can manage coworking payments" ON coworking_payments;
CREATE POLICY "Admins can manage coworking payments"
  ON coworking_payments FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 3. FIX EMAIL LOGS SECURITY
-- ============================================================================

-- Drop the weak insert policy
DROP POLICY IF EXISTS "Service can insert email logs" ON email_logs;

-- Create secure service role policy
CREATE POLICY "Service role can insert email logs"
  ON email_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Ensure existing admin policies are correct
DROP POLICY IF EXISTS "Admins can view email logs" ON email_logs;
DROP POLICY IF EXISTS "Admins can manage email logs" ON email_logs;

CREATE POLICY "Admins can manage email logs"
  ON email_logs FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 4. FIX APARTMENT PAYMENTS VISIBILITY
-- ============================================================================

-- Drop public view policy
DROP POLICY IF EXISTS "Public can view payment status" ON apartment_payments;

-- Ensure admin-only access
DROP POLICY IF EXISTS "Admins can manage apartment payments" ON apartment_payments;
CREATE POLICY "Admins can manage apartment payments"
  ON apartment_payments FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Add service role policy for webhook payment creation
CREATE POLICY "Service role can create apartment payments"
  ON apartment_payments FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- 5. VERIFY COWORKING_BOOKINGS POLICIES ARE SECURE
-- ============================================================================

-- The existing policies are:
-- 1. "Admins can manage coworking bookings" - SECURE ✓
-- 2. "Anyone can create bookings" - NEEDED for public booking form ✓
-- 3. "Users can view own bookings" - SECURE ✓

-- No changes needed for coworking_bookings as they are properly secured

-- ============================================================================
-- SECURITY AUDIT SUMMARY
-- ============================================================================

-- Tables with admin-only access (except specific public operations):
-- ✓ promotion_banners - admins manage, public reads active only
-- ✓ coworking_payments - admins + service_role manage
-- ✓ email_logs - admins view, service_role inserts
-- ✓ apartment_payments - admins + service_role manage
-- ✓ coworking_bookings - admins manage all, public can create, users view own
-- ✓ coworking_passes - admins manage, public views active
-- ✓ coworking_pass_codes - admins only
