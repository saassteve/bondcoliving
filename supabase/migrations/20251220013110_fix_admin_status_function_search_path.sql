/*
  # Fix Admin Status Function Search Path

  ## Problem
  The `check_admin_status()`, `can_admin_delete_from()`, and `test_admin_permissions()` 
  functions were set to use an empty search_path for security hardening, but this breaks
  the functions because they use unqualified table names like `admin_users` instead of 
  `public.admin_users`.

  ## Solution
  Recreate these functions with `SET search_path = public` so that table references
  resolve correctly. This matches the pattern used by the working `verify_admin_user()` function.

  ## Changes
  1. Recreate `check_admin_status()` with proper search_path
  2. Recreate `can_admin_delete_from()` with proper search_path  
  3. Recreate `test_admin_permissions()` with proper search_path

  ## Security
  - Functions still use SECURITY DEFINER for elevated access
  - search_path is set explicitly to prevent search_path injection attacks
  - Setting to 'public' is safe as all referenced tables are in public schema
*/

-- =====================================================
-- Fix check_admin_status function
-- =====================================================
CREATE OR REPLACE FUNCTION check_admin_status()
RETURNS TABLE (
  is_authenticated boolean,
  current_auth_uid uuid,
  has_admin_record boolean,
  admin_user_id uuid,
  admin_email text,
  is_active boolean,
  user_ids_match boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_uid uuid;
  v_admin_record RECORD;
BEGIN
  v_auth_uid := auth.uid();
  
  IF v_auth_uid IS NULL THEN
    RETURN QUERY SELECT 
      false, NULL::uuid, false, NULL::uuid, NULL::text, NULL::boolean, false;
    RETURN;
  END IF;
  
  SELECT * INTO v_admin_record
  FROM admin_users
  WHERE user_id = v_auth_uid
  LIMIT 1;
  
  RETURN QUERY SELECT 
    true,
    v_auth_uid,
    v_admin_record.id IS NOT NULL,
    v_admin_record.user_id,
    v_admin_record.email,
    v_admin_record.is_active,
    COALESCE(v_admin_record.user_id = v_auth_uid, false);
END;
$$;

-- =====================================================
-- Fix can_admin_delete_from function
-- =====================================================
CREATE OR REPLACE FUNCTION can_admin_delete_from(target_table text, target_id uuid)
RETURNS TABLE (
  can_delete boolean,
  reason text,
  admin_check_passed boolean,
  record_exists boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_record_exists boolean;
  v_auth_uid uuid;
BEGIN
  v_auth_uid := auth.uid();
  
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = v_auth_uid
    AND is_active = true
  ) INTO v_is_admin;
  
  IF target_table = 'guest_users' THEN
    SELECT EXISTS (SELECT 1 FROM guest_users WHERE id = target_id) INTO v_record_exists;
  ELSIF target_table = 'guest_invitations' THEN
    SELECT EXISTS (SELECT 1 FROM guest_invitations WHERE id = target_id) INTO v_record_exists;
  ELSE
    RETURN QUERY SELECT false, 'Invalid table name', false, false;
    RETURN;
  END IF;
  
  IF NOT v_is_admin THEN
    RETURN QUERY SELECT false, 'User is not an active admin', false, v_record_exists;
  ELSIF NOT v_record_exists THEN
    RETURN QUERY SELECT false, 'Record does not exist', true, false;
  ELSE
    RETURN QUERY SELECT true, 'Can delete', true, true;
  END IF;
END;
$$;

-- =====================================================
-- Fix test_admin_permissions function
-- =====================================================
CREATE OR REPLACE FUNCTION test_admin_permissions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_admin_status RECORD;
BEGIN
  SELECT * INTO v_admin_status FROM check_admin_status();
  
  v_result := jsonb_build_object(
    'is_authenticated', v_admin_status.is_authenticated,
    'has_admin_record', v_admin_status.has_admin_record,
    'is_active', v_admin_status.is_active,
    'user_ids_match', v_admin_status.user_ids_match,
    'current_auth_uid', v_admin_status.current_auth_uid,
    'admin_email', v_admin_status.admin_email
  );
  
  RETURN v_result;
END;
$$;
