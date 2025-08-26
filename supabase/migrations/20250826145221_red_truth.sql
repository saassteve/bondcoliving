/*
  # Fix all RLS policies to use correct auth functions

  This migration updates all existing RLS policies to use the correct Supabase auth functions:
  - Changes jwt() to auth.jwt()
  - Changes uid() to auth.uid()

  ## Tables Updated
  1. apartment_features - Admin management policies
  2. reviews - Admin management policies  
  3. feature_highlights - Admin management policies
  4. site_settings - Admin management policies
  5. applications - Admin management and user access policies
  6. admin_users - Admin self-management policies
  7. apartment_images - Admin management policies
  8. apartment_availability - Admin management policies
  9. apartment_ical_feeds - Admin management policies
  10. apartments - Admin management policies
  11. bookings - Admin management policies

  ## Security
  - Maintains all existing security restrictions
  - Fixes function reference errors that were blocking policy evaluation
  - Ensures anonymous users can submit applications as intended
*/

-- Fix apartment_features policies
DROP POLICY IF EXISTS "Admins can manage apartment features" ON apartment_features;
CREATE POLICY "Admins can manage apartment features"
  ON apartment_features
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ));

-- Fix reviews policies
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
CREATE POLICY "Admins can manage reviews"
  ON reviews
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ));

-- Fix feature_highlights policies
DROP POLICY IF EXISTS "Admins can manage feature highlights" ON feature_highlights;
CREATE POLICY "Admins can manage feature highlights"
  ON feature_highlights
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ));

-- Fix site_settings policies
DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;
CREATE POLICY "Admins can manage site settings"
  ON site_settings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ));

-- Fix applications policies - CRITICAL for public submissions
DROP POLICY IF EXISTS "Admins can manage all applications" ON applications;
DROP POLICY IF EXISTS "Anonymous users can submit applications" ON applications;
DROP POLICY IF EXISTS "Authenticated users can submit applications" ON applications;
DROP POLICY IF EXISTS "Users can read own applications" ON applications;

-- Create new, explicit policies for applications
CREATE POLICY "Admins can manage all applications"
  ON applications
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ));

CREATE POLICY "Anonymous users can submit applications"
  ON applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can submit applications"
  ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read own applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = email);

-- Fix admin_users policies
DROP POLICY IF EXISTS "Admins can read own data" ON admin_users;
DROP POLICY IF EXISTS "Admins can update own last_login" ON admin_users;

CREATE POLICY "Admins can read own data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (((auth.uid())::text = (id)::text) OR ((auth.jwt() ->> 'email'::text) = email));

CREATE POLICY "Admins can update own last_login"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (((auth.uid())::text = (id)::text) OR ((auth.jwt() ->> 'email'::text) = email))
  WITH CHECK (((auth.uid())::text = (id)::text) OR ((auth.jwt() ->> 'email'::text) = email));

-- Fix apartment_images policies
DROP POLICY IF EXISTS "Admins can manage apartment images" ON apartment_images;
CREATE POLICY "Admins can manage apartment images"
  ON apartment_images
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ));

-- Fix apartment_availability policies
DROP POLICY IF EXISTS "Admins can manage apartment availability" ON apartment_availability;
CREATE POLICY "Admins can manage apartment availability"
  ON apartment_availability
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ));

-- Fix apartment_ical_feeds policies
DROP POLICY IF EXISTS "Admins can manage ical feeds" ON apartment_ical_feeds;
CREATE POLICY "Admins can manage ical feeds"
  ON apartment_ical_feeds
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ));

-- Fix apartments policies
DROP POLICY IF EXISTS "Admins can manage apartments" ON apartments;
CREATE POLICY "Admins can manage apartments"
  ON apartments
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ));

-- Fix bookings policies
DROP POLICY IF EXISTS "Admins can manage bookings" ON bookings;
CREATE POLICY "Admins can manage bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email'::text) 
    AND admin_users.is_active = true
  ));