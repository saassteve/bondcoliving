/*
  # Fix Applications RLS Policies with pgjwt Extension

  1. Extensions
    - Enable pgjwt extension for JWT token handling
  
  2. Policy Reset
    - Drop all existing conflicting policies on applications table
    - Re-enable RLS to ensure clean state
  
  3. New Policies
    - `applications_public_insert`: Allow anyone to submit applications
    - `applications_user_select`: Users can read their own applications
    - `applications_admin_full`: Admins have full access to all applications
  
  4. Security
    - Public can submit applications without authentication
    - Users can only see their own applications
    - Admins verified through admin_users table can manage all
*/

-- Enable pgjwt extension for JWT token handling
CREATE EXTENSION IF NOT EXISTS pgjwt;

-- Drop all existing policies on applications table to prevent conflicts
DROP POLICY IF EXISTS "Allow application submissions" ON applications;
DROP POLICY IF EXISTS "Authenticated users can manage applications" ON applications;
DROP POLICY IF EXISTS "Users can read own applications" ON applications;
DROP POLICY IF EXISTS "applications_insert_policy" ON applications;
DROP POLICY IF EXISTS "applications_select_own_policy" ON applications;
DROP POLICY IF EXISTS "applications_admin_all_policy" ON applications;

-- Ensure RLS is enabled
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow public application submissions (most permissive)
CREATE POLICY "applications_public_insert"
  ON applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy 2: Allow users to read their own applications
CREATE POLICY "applications_user_select"
  ON applications
  FOR SELECT
  TO authenticated
  USING ((jwt() ->> 'email'::text) = email);

-- Policy 3: Allow admins full access to all applications
CREATE POLICY "applications_admin_full"
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