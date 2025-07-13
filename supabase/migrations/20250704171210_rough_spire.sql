/*
  # Fix infinite recursion in admin_users RLS policies

  1. Policy Updates
    - Remove the problematic "Super admins can manage other admins" policy that references non-existent users table
    - Simplify the "Users can read own admin data" policy
    - Keep the "Authenticated can verify admin status" policy as is

  2. Security
    - Maintain RLS on admin_users table
    - Ensure admins can read their own data
    - Allow authenticated users to verify admin status (needed for other policies)
    - Remove the complex super admin policy that was causing recursion
*/

-- Drop the problematic policies
DROP POLICY IF EXISTS "Super admins can manage other admins" ON admin_users;
DROP POLICY IF EXISTS "Users can read own admin data" ON admin_users;

-- Recreate the policy for users to read their own admin data
CREATE POLICY "Admins can read own data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Add a policy for admins to update their own last_login
CREATE POLICY "Admins can update own last_login"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);