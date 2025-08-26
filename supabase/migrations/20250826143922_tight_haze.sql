/*
  # Fix Application Submission for Public Users

  1. Security Updates
    - Update RLS policy to allow anonymous users to submit applications
    - Ensure public users can only insert, not read other applications
    - Maintain admin access for managing applications

  2. Changes
    - Modify "Allow application submissions" policy to properly allow anonymous users
    - Keep existing admin management policies intact
*/

-- Drop the existing policy that might be too restrictive
DROP POLICY IF EXISTS "Allow application submissions" ON applications;

-- Create a new policy that explicitly allows anonymous users to submit applications
CREATE POLICY "Public can submit applications"
  ON applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure the existing policy for users to read their own applications is correct
DROP POLICY IF EXISTS "Users can read own applications" ON applications;

CREATE POLICY "Users can read own applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING ((jwt() ->> 'email'::text) = email);

-- Keep the admin management policy as is
-- (This should already exist and allow admins to manage all applications)