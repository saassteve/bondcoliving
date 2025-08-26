/*
  # Fix Applications RLS Policy

  1. Security Updates
    - Drop existing policies that might be conflicting
    - Create a clear policy allowing anonymous users to submit applications
    - Ensure authenticated users and admins can manage applications
    - Maintain user privacy (users can only see their own applications)

  2. Changes
    - Remove potentially conflicting policies
    - Add explicit INSERT policy for anonymous users
    - Add SELECT policy for users to view their own applications
    - Add management policy for authenticated users and admins
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow application submissions" ON applications;
DROP POLICY IF EXISTS "Authenticated users can manage applications" ON applications;
DROP POLICY IF EXISTS "Users can read own applications" ON applications;

-- Allow anonymous users to submit applications (INSERT only)
CREATE POLICY "Anonymous can submit applications"
  ON applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to submit applications
CREATE POLICY "Authenticated can submit applications"
  ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to read their own applications
CREATE POLICY "Users can read own applications"
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
      SELECT 1
      FROM admin_users
      WHERE admin_users.email = (jwt() ->> 'email'::text)
        AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM admin_users
      WHERE admin_users.email = (jwt() ->> 'email'::text)
        AND admin_users.is_active = true
    )
  );