/*
  # Fix anonymous application submissions

  1. Security Changes
    - Drop existing complex insert policy that may be blocking submissions
    - Create simple, permissive policy for anonymous users to submit applications
    - Maintain existing read policies for user privacy
    - Keep admin management policies intact

  2. Policy Details
    - Allow all users (anonymous and authenticated) to insert applications
    - Use simple `true` condition to avoid complex policy conflicts
    - Ensure form submissions work without authentication barriers
*/

-- Drop the existing insert policy that might be causing issues
DROP POLICY IF EXISTS "Anyone can create applications" ON applications;

-- Create a simple, permissive insert policy for all users
CREATE POLICY "Allow application submissions"
  ON applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure the existing read policies remain intact
-- (Users can read their own applications, admins can read all)