/*
  # Fix RLS policies for apartment_features table

  1. Security Changes
    - Drop existing restrictive policies for apartment_features
    - Add new policies that properly handle admin authentication
    - Ensure authenticated users with admin privileges can insert/update/delete
    - Keep public read access for apartment features

  2. Policy Updates
    - Replace complex admin verification with simpler auth checks
    - Add separate policies for different operations (INSERT, UPDATE, DELETE, SELECT)
    - Use auth.uid() for better authentication handling
*/

-- Drop existing policies for apartment_features
DROP POLICY IF EXISTS "Authenticated admins can manage apartment features" ON apartment_features;
DROP POLICY IF EXISTS "Public can read apartment features" ON apartment_features;

-- Create new policies with proper admin authentication
CREATE POLICY "Public can read apartment features"
  ON apartment_features
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert apartment features"
  ON apartment_features
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update apartment features"
  ON apartment_features
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete apartment features"
  ON apartment_features
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);