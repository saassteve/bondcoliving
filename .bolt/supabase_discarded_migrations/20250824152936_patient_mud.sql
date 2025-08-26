/*
  # Fix Applications RLS Policies Using auth.email()

  This migration fixes the RLS policy issues for the applications table by:
  
  1. Policy Reset
     - Drop all existing conflicting policies
     - Clean slate approach to prevent conflicts
  
  2. New Policies Using Built-in Functions
     - Use auth.email() instead of jwt() function
     - Use auth.uid() for user identification
     - Avoid dependency on pgjwt extension
  
  3. Clear Permission Structure
     - Public can submit applications (INSERT)
     - Users can read their own applications (SELECT)
     - Admins can manage all applications (ALL operations)
  
  4. Security
     - Enable RLS on applications table
     - Proper admin verification through admin_users table
*/

-- Drop all existing policies on applications table
DROP POLICY IF EXISTS "Allow application submissions" ON applications;
DROP POLICY IF EXISTS "Authenticated users can manage applications" ON applications;
DROP POLICY IF EXISTS "Users can read own applications" ON applications;
DROP POLICY IF EXISTS "applications_public_insert" ON applications;
DROP POLICY IF EXISTS "applications_user_select" ON applications;
DROP POLICY IF EXISTS "applications_admin_full" ON applications;

-- Ensure RLS is enabled
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anyone to submit applications (INSERT only)
CREATE POLICY "applications_allow_public_insert"
  ON applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to read their own applications
CREATE POLICY "applications_user_read_own"
  ON applications
  FOR SELECT
  TO authenticated
  USING (auth.email() = email);

-- Policy 3: Allow admin users to manage all applications
CREATE POLICY "applications_admin_manage_all"
  ON applications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.email = auth.email() 
        AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.email = auth.email() 
        AND admin_users.is_active = true
    )
  );