/*
  # Fix Admin Users RLS Policies

  1. Changes
    - Update admin_users RLS policies to use user_id column
    - Previous policies were comparing auth.uid() with id (wrong column)
    - Now correctly compare auth.uid() with user_id

  2. Security
    - Admins can read their own admin_users record
    - Super admins can manage all admin users
*/

-- Drop old policies
DROP POLICY IF EXISTS "Admin users can read own data" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;

-- Create new policies using user_id
CREATE POLICY "Admin users can read own data"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage admin users"
  ON admin_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
      AND role = 'super_admin' 
      AND is_active = true
    )
  );
