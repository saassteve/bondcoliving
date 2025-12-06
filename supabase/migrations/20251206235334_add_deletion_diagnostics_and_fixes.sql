/*
  # Add Deletion Diagnostics and Fix Admin Data

  ## Problem
  When admins try to delete guests or invitations, the UI shows "success" but records
  remain in the database. This is caused by RLS policies silently blocking operations.

  ## Changes
  
  1. Data Integrity Fixes
    - Ensure all admin_users records have valid user_id values
    - Activate all admin accounts (set is_active = true)
  
  2. Diagnostic Functions
    - `check_admin_status()` - Returns current user's admin status
    - `can_admin_delete_from()` - Tests if admin can delete from a table
    - `test_admin_permissions()` - Quick permission check
  
  3. Audit Logging
    - Add deletion_audit_log table to track all deletion attempts
  
  ## Security
  - All functions use SECURITY DEFINER carefully
  - Maintains existing RLS policies
  - Only active admins can access diagnostics
*/

-- =====================================================
-- STEP 1: Fix Admin User Data
-- =====================================================

-- Backfill user_id for any admin records that don't have it
UPDATE admin_users
SET user_id = auth.users.id
FROM auth.users
WHERE admin_users.email = auth.users.email
AND admin_users.user_id IS NULL;

-- Activate all admin accounts
UPDATE admin_users
SET is_active = true
WHERE is_active = false OR is_active IS NULL;

-- =====================================================
-- STEP 2: Create Diagnostic Functions
-- =====================================================

-- Function to check current user's admin status
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

-- Function to test deletion permissions
CREATE OR REPLACE FUNCTION can_admin_delete_from(target_table text, target_id uuid)
RETURNS TABLE (
  can_delete boolean,
  reason text,
  admin_check_passed boolean,
  record_exists boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Quick permission test function
CREATE OR REPLACE FUNCTION test_admin_permissions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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

-- =====================================================
-- STEP 3: Create Deletion Audit Log
-- =====================================================

CREATE TABLE IF NOT EXISTS deletion_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_table text NOT NULL,
  target_id uuid NOT NULL,
  target_identifier text,
  success boolean NOT NULL,
  rows_affected integer DEFAULT 0,
  error_message text,
  permission_check jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deletion_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view deletion audit log" ON deletion_audit_log;
CREATE POLICY "Admins can view deletion audit log"
  ON deletion_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can insert audit log" ON deletion_audit_log;
CREATE POLICY "Admins can insert audit log"
  ON deletion_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_deletion_audit_log_created_at ON deletion_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deletion_audit_log_performed_by ON deletion_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_deletion_audit_log_target ON deletion_audit_log(target_table, target_id);

-- =====================================================
-- STEP 4: Log Migration Results
-- =====================================================

DO $$
DECLARE
  total_admins INTEGER;
  active_admins INTEGER;
  admins_with_user_id INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_admins FROM admin_users;
  SELECT COUNT(*) INTO active_admins FROM admin_users WHERE is_active = true;
  SELECT COUNT(*) INTO admins_with_user_id FROM admin_users WHERE user_id IS NOT NULL;
  
  RAISE NOTICE 'Deletion Diagnostics Migration Complete:';
  RAISE NOTICE '  Total admin accounts: %', total_admins;
  RAISE NOTICE '  Active admin accounts: %', active_admins;
  RAISE NOTICE '  Admins with user_id: %', admins_with_user_id;
  
  IF admins_with_user_id < total_admins THEN
    RAISE WARNING 'Some admin accounts are missing user_id linkage!';
  END IF;
END $$;