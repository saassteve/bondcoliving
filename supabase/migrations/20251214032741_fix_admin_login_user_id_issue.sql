/*
  # Fix Admin Login - User ID Population Issue

  1. Problem
    - Admin users cannot login when their `user_id` field is NULL or incorrect
    - The RLS policy `USING (user_id = auth.uid())` blocks access when user_id doesn't match
    - The auth service queries admin_users by user_id, which returns no results
    - This creates a catch-22: can't login to populate user_id, user_id must exist to login

  2. Solution
    - Re-populate user_id for all admin records by matching email addresses
    - Add a fallback RLS policy that allows email-based authentication
    - This lets users login even if user_id is NULL/wrong, then fix it on login
    - Add diagnostic function to help troubleshoot login issues

  3. Changes
    - Update all admin_users records to populate user_id from auth.users by email
    - Add "Email-based admin verification" SELECT policy as fallback
    - Create diagnostic function to check admin authentication status
    - Add function to auto-populate user_id on successful authentication

  4. Security
    - Email-based policy only allows reading own record (email must match auth.users)
    - Still requires is_active = true
    - User ID will be auto-populated on next successful login
*/

-- ==============================================================================
-- STEP 1: Re-populate user_id for all admin records
-- ==============================================================================

-- Update admin records where user_id is NULL but email matches auth.users
UPDATE admin_users
SET user_id = auth.users.id
FROM auth.users
WHERE admin_users.email = auth.users.email
AND admin_users.user_id IS NULL;

-- Update admin records where user_id is incorrect (doesn't match auth.users email)
UPDATE admin_users
SET user_id = auth.users.id
FROM auth.users
WHERE admin_users.email = auth.users.email
AND admin_users.user_id IS NOT NULL
AND admin_users.user_id != auth.users.id;

-- ==============================================================================
-- STEP 2: Add fallback RLS policy for email-based authentication
-- ==============================================================================

-- This policy allows admins to read their record by email even if user_id is NULL/wrong
-- It checks that the email in admin_users matches the email in auth.users
DROP POLICY IF EXISTS "Email-based admin verification" ON admin_users;

CREATE POLICY "Email-based admin verification"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    email = (
      SELECT email
      FROM auth.users
      WHERE id = auth.uid()
    )
    AND is_active = true
  );

-- ==============================================================================
-- STEP 3: Create diagnostic function
-- ==============================================================================

CREATE OR REPLACE FUNCTION check_admin_auth_status()
RETURNS TABLE (
  current_auth_uid uuid,
  current_auth_email text,
  admin_record_exists boolean,
  admin_user_id uuid,
  admin_email text,
  admin_is_active boolean,
  user_id_matches boolean,
  email_matches boolean,
  can_login boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    auth.uid() as current_auth_uid,
    au.email as current_auth_email,
    (a.id IS NOT NULL) as admin_record_exists,
    a.user_id as admin_user_id,
    a.email as admin_email,
    COALESCE(a.is_active, false) as admin_is_active,
    (a.user_id = auth.uid()) as user_id_matches,
    (a.email = au.email) as email_matches,
    (
      a.id IS NOT NULL 
      AND a.is_active = true 
      AND (a.user_id = auth.uid() OR a.email = au.email)
    ) as can_login
  FROM auth.users au
  LEFT JOIN admin_users a ON a.email = au.email OR a.user_id = au.id
  WHERE au.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_admin_auth_status() TO authenticated;

-- ==============================================================================
-- STEP 4: Create function to auto-fix user_id on login
-- ==============================================================================

-- This function updates user_id when an admin successfully authenticates
CREATE OR REPLACE FUNCTION fix_admin_user_id()
RETURNS void AS $$
DECLARE
  current_email text;
BEGIN
  -- Get current user's email
  SELECT email INTO current_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Update admin_users record to set correct user_id
  UPDATE admin_users
  SET user_id = auth.uid()
  WHERE email = current_email
  AND (user_id IS NULL OR user_id != auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION fix_admin_user_id() TO authenticated;

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

-- Check current state of admin records
-- This will help diagnose if there are still issues
DO $$
DECLARE
  total_admins int;
  admins_with_user_id int;
  admins_without_user_id int;
  mismatched_admins int;
BEGIN
  SELECT COUNT(*) INTO total_admins FROM admin_users;
  
  SELECT COUNT(*) INTO admins_with_user_id 
  FROM admin_users 
  WHERE user_id IS NOT NULL;
  
  SELECT COUNT(*) INTO admins_without_user_id 
  FROM admin_users 
  WHERE user_id IS NULL;
  
  SELECT COUNT(*) INTO mismatched_admins
  FROM admin_users a
  LEFT JOIN auth.users au ON a.user_id = au.id
  WHERE a.user_id IS NOT NULL 
  AND a.email != au.email;

  RAISE NOTICE 'Admin Users Report:';
  RAISE NOTICE '  Total admins: %', total_admins;
  RAISE NOTICE '  With user_id: %', admins_with_user_id;
  RAISE NOTICE '  Without user_id: %', admins_without_user_id;
  RAISE NOTICE '  Mismatched email/user_id: %', mismatched_admins;
  
  IF admins_without_user_id > 0 OR mismatched_admins > 0 THEN
    RAISE WARNING 'Some admin records may need manual intervention';
  END IF;
END $$;
