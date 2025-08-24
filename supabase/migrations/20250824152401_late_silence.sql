/*
  # Reset applications table RLS policies

  1. Security Changes
    - Drop all existing policies on applications table
    - Create simple policy to allow anonymous application submissions
    - Maintain admin access for managing applications
    - Allow users to read their own applications

  This fixes the RLS policy blocking anonymous application submissions.
*/

-- Drop all existing policies on applications table
DROP POLICY IF EXISTS "Allow application submissions" ON applications;
DROP POLICY IF EXISTS "Authenticated users can manage applications" ON applications;
DROP POLICY IF EXISTS "Users can read own applications" ON applications;

-- Create new simple policies
CREATE POLICY "Public can insert applications"
  ON applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read own applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (email = (jwt() ->> 'email'::text));

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