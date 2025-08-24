/*
  # Comprehensive RLS Policy Fix for Applications Table

  1. Problem Resolution
    - Fixes "new row violates row-level security policy" error
    - Removes conflicting policies that block anonymous submissions
    - Creates clear, granular policies for each operation

  2. New Policies
    - `applications_insert_policy` - Allows anyone to submit applications
    - `applications_select_own_policy` - Users can read their own applications
    - `applications_admin_all_policy` - Admins can manage all applications

  3. Security
    - Public can submit applications (INSERT)
    - Users can only see their own applications (SELECT)
    - Only active admins can manage all applications (SELECT, UPDATE, DELETE)
*/

-- Drop all existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow application submissions" ON applications;
DROP POLICY IF EXISTS "Authenticated users can manage applications" ON applications;
DROP POLICY IF EXISTS "Users can read own applications" ON applications;

-- Ensure RLS is enabled
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anyone (anonymous and authenticated) to submit applications
CREATE POLICY "applications_insert_policy"
  ON applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to read their own applications
CREATE POLICY "applications_select_own_policy"
  ON applications
  FOR SELECT
  TO authenticated
  USING ((jwt() ->> 'email'::text) = email);

-- Policy 3: Allow admin users to manage all applications
CREATE POLICY "applications_admin_all_policy"
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