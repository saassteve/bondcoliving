/*
  # Fix Applications Table RLS Policies

  This migration specifically addresses the RLS policy violation error for the applications table.
  
  1. Policy Updates
     - Drop and recreate INSERT policies for applications table
     - Ensure anonymous users can submit applications with USING (true)
     - Ensure authenticated users can submit applications with USING (true)
     - Keep existing SELECT policy for users to read their own applications
     - Keep existing ALL policy for admins to manage applications
  
  2. Security
     - Force enable RLS on applications table
     - Use most permissive USING (true) clause for INSERT operations
     - Maintain admin access controls
  
  3. Notes
     - This targets the specific "new row violates row-level security policy" error
     - Uses explicit policy recreation to ensure clean state
*/

-- First, ensure RLS is enabled and forced on the applications table
ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."applications" FORCE ROW LEVEL SECURITY;

-- Drop existing INSERT policies if they exist
DROP POLICY IF EXISTS "Anonymous users can submit applications" ON "public"."applications";
DROP POLICY IF EXISTS "Authenticated users can submit applications" ON "public"."applications";

-- Recreate INSERT policies with explicit USING (true) for maximum permissiveness
CREATE POLICY "Anonymous users can submit applications"
  ON "public"."applications"
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can submit applications"
  ON "public"."applications"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Verify that the admin ALL policy exists and uses correct auth functions
DROP POLICY IF EXISTS "Admins can manage all applications" ON "public"."applications";

CREATE POLICY "Admins can manage all applications"
  ON "public"."applications"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM admin_users
      WHERE admin_users.email = (auth.jwt() ->> 'email'::text)
        AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM admin_users
      WHERE admin_users.email = (auth.jwt() ->> 'email'::text)
        AND admin_users.is_active = true
    )
  );

-- Verify that the user SELECT policy exists and uses correct auth functions
DROP POLICY IF EXISTS "Users can read own applications" ON "public"."applications";

CREATE POLICY "Users can read own applications"
  ON "public"."applications"
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = email);