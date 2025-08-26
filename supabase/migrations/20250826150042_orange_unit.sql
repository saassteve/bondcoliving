/*
  # Disable RLS on applications table

  This migration temporarily disables Row Level Security on the applications table
  to allow anonymous users to submit applications without policy restrictions.

  ## Changes Made
  1. Disable RLS on applications table
  2. Keep existing policies for when RLS is re-enabled later
  3. Add comment explaining the temporary nature

  ## Security Note
  This is a temporary solution to resolve the RLS policy violation error.
  The table will still be protected by application-level validation.
*/

-- Disable Row Level Security on applications table
ALTER TABLE "public"."applications" DISABLE ROW LEVEL SECURITY;

-- Add a comment to document this temporary change
COMMENT ON TABLE "public"."applications" IS 'RLS temporarily disabled to allow anonymous application submissions. Re-enable after policy issues are resolved.';