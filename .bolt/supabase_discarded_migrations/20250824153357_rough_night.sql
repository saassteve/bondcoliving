/*
  # Fix Applications Table RLS Policy

  1. Policy Updates
    - Drop existing problematic policies
    - Create new policy allowing anonymous users to insert applications
    - Ensure authenticated users can also insert applications
    - Maintain existing read policies for users and admins

  2. Security
    - Allow INSERT for both anon and authenticated roles
    - Maintain data protection for other operations
*/

-- Drop existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Allow application submissions" ON applications;
DROP POLICY IF EXISTS "Users can read own applications" ON applications;
DROP POLICY IF EXISTS "Authenticated users can manage applications" ON applications;

-- Create new policy to allow anonymous and authenticated users to submit applications
CREATE POLICY "Enable INSERT for application submissions"
  ON applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to read their own applications by email
CREATE POLICY "Users can read own applications by email"
  ON applications
  FOR SELECT
  TO authenticated
  USING ((jwt() ->> 'email'::text) = email);

-- Allow admins to manage all applications
CREATE POLICY "Admins can manage all applications"
  ON applications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = (jwt() ->> 'email'::text) 
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = (jwt() ->> 'email'::text) 
      AND admin_users.is_active = true
    )
  );