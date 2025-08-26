/*
  # Fix Application Submission for Public Users

  1. Policy Updates
    - Drop existing INSERT policies on applications table that may be blocking anonymous users
    - Create explicit INSERT policy for anonymous (anon) users
    - Ensure public users can submit applications without authentication barriers

  2. Security
    - Maintain existing SELECT policies for user privacy
    - Keep admin management policies intact
    - Allow unrestricted INSERT for application submissions
*/

-- Drop existing INSERT policies that might be blocking anonymous users
DROP POLICY IF EXISTS "Allow public application submissions" ON applications;
DROP POLICY IF EXISTS "Public can submit applications" ON applications;
DROP POLICY IF EXISTS "Anyone can submit applications" ON applications;

-- Create a very explicit INSERT policy for anonymous users
CREATE POLICY "Anonymous users can submit applications"
  ON applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Also ensure authenticated users can still submit applications
CREATE POLICY "Authenticated users can submit applications"
  ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Verify the applications table has RLS enabled
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Double-check that we have the correct SELECT policies
-- (These should already exist but let's ensure they're correct)
DROP POLICY IF EXISTS "Users can read own applications" ON applications;
CREATE POLICY "Users can read own applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

-- Ensure admins can manage all applications
DROP POLICY IF EXISTS "Admins can manage all applications" ON applications;
CREATE POLICY "Admins can manage all applications"
  ON applications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email' 
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email' 
      AND admin_users.is_active = true
    )
  );