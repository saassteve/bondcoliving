/*
  # Fix applications table RLS policy for anonymous submissions

  1. Security Updates
    - Drop existing insert policy that may be causing issues
    - Create new simplified insert policy for anonymous users
    - Ensure anonymous users can submit applications without authentication

  2. Policy Changes
    - Allow anonymous (anon) and authenticated users to insert applications
    - Remove complex conditions that might be blocking submissions
    - Keep existing read policies intact
*/

-- Drop the existing insert policy if it exists
DROP POLICY IF EXISTS "Anyone can create applications" ON applications;

-- Create a new, simplified insert policy for applications
CREATE POLICY "Allow anonymous application submissions"
  ON applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure the existing select policy for users reading their own applications is correct
DROP POLICY IF EXISTS "Users can read own applications" ON applications;

CREATE POLICY "Users can read own applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING ((jwt() ->> 'email'::text) = email);

-- Keep the admin management policy
DROP POLICY IF EXISTS "Authenticated users can manage applications" ON applications;

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