/*
  # Fix RLS policy for anonymous application submissions

  1. Policy Changes
    - Drop existing restrictive policies
    - Create new policy allowing anonymous users to submit applications
    - Maintain admin access for managing applications
    - Allow users to read their own applications by email

  2. Security
    - Anonymous users can only INSERT applications
    - Users can read their own applications via email match
    - Admins retain full access to all applications
*/

-- Drop existing policies that might be blocking anonymous access
DROP POLICY IF EXISTS "Allow application submissions" ON applications;
DROP POLICY IF EXISTS "Authenticated users can manage applications" ON applications;
DROP POLICY IF EXISTS "Users can read own applications" ON applications;

-- Create new policy allowing anonymous application submissions
CREATE POLICY "Anyone can submit applications"
  ON applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to read their own applications by email
CREATE POLICY "Users can read own applications by email"
  ON applications
  FOR SELECT
  TO authenticated
  USING (
    (jwt() ->> 'email'::text) = email
  );

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