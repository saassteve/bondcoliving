/*
  # Fix Admin Authentication with Secure Database Function
  
  This migration creates a secure database function to handle admin verification,
  bypassing RLS permission issues that were preventing successful admin login.
  
  ## Changes
  
  1. **New Database Function: verify_admin_user()**
     - Takes a user_id (UUID) as parameter
     - Uses SECURITY DEFINER to bypass RLS restrictions
     - Queries admin_users table directly with elevated privileges
     - Returns admin user details (id, email, role, user_id) if valid and active
     - Returns NULL if user is not an admin or not active
     - Only executable by authenticated users
  
  2. **RLS Policy Simplification**
     - Drops problematic email-based fallback policy on admin_users
     - Keeps basic security policies for general table access
     - Admin verification is now handled by the secure function
  
  3. **Security Benefits**
     - Verification logic is server-side (more secure)
     - Eliminates client-side RLS permission errors
     - Function runs with elevated privileges safely
     - Only authenticated users can call the function
     - No exposure of auth.users table
  
  ## How It Works
  
  1. User authenticates with Supabase Auth (email/password)
  2. Client receives authenticated session with user.id
  3. Client calls verify_admin_user(session.user.id) function
  4. Function checks admin_users table with SECURITY DEFINER
  5. Function returns admin details or NULL
  6. Client proceeds based on function result
*/

-- Drop the problematic email-based RLS policy
DROP POLICY IF EXISTS "Admin users can read own data by email" ON admin_users;

-- Create the secure admin verification function
CREATE OR REPLACE FUNCTION verify_admin_user(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the verification attempt for debugging
  RAISE LOG 'verify_admin_user called for user_id: %', p_user_id;
  
  -- Query the admin_users table with elevated privileges
  -- This bypasses all RLS policies
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.role,
    au.user_id
  FROM admin_users au
  WHERE au.user_id = p_user_id
    AND au.is_active = true
  LIMIT 1;
  
  -- If we reach here with no results, user is not an admin
  IF NOT FOUND THEN
    RAISE LOG 'verify_admin_user: No active admin found for user_id: %', p_user_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users only
-- This ensures only logged-in users can call this function
REVOKE ALL ON FUNCTION verify_admin_user FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_admin_user TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION verify_admin_user IS 'Securely verifies if a user_id belongs to an active admin. Uses SECURITY DEFINER to bypass RLS. Only callable by authenticated users.';
