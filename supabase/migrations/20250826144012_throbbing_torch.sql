/*
  # Fix JWT function error and update RLS policies

  1. Policy Updates
    - Replace jwt() with auth.jwt() 
    - Use auth.uid() instead of uid()
    - Ensure proper Supabase auth function usage

  2. Security
    - Maintain existing security model
    - Allow public application submissions
    - Preserve admin access controls
*/

-- First, drop all existing policies that use jwt() or uid()
DROP POLICY IF EXISTS "Allow application submissions" ON applications;
DROP POLICY IF EXISTS "Authenticated users can manage applications" ON applications;
DROP POLICY IF EXISTS "Users can read own applications" ON applications;

DROP POLICY IF EXISTS "Authenticated users can manage apartments" ON apartments;
DROP POLICY IF EXISTS "Public can read apartments" ON apartments;

DROP POLICY IF EXISTS "Authenticated users can manage apartment features" ON apartment_features;
DROP POLICY IF EXISTS "Public can read apartment features" ON apartment_features;

DROP POLICY IF EXISTS "Authenticated users can manage apartment images" ON apartment_images;
DROP POLICY IF EXISTS "Public can read apartment images" ON apartment_images;

DROP POLICY IF EXISTS "Authenticated users can manage apartment availability" ON apartment_availability;
DROP POLICY IF EXISTS "Public can read apartment availability" ON apartment_availability;

DROP POLICY IF EXISTS "Authenticated users can manage ical feeds" ON apartment_ical_feeds;

DROP POLICY IF EXISTS "Authenticated users can manage bookings" ON bookings;

DROP POLICY IF EXISTS "Authenticated users can manage reviews" ON reviews;
DROP POLICY IF EXISTS "Public can read reviews" ON reviews;

DROP POLICY IF EXISTS "Authenticated users can manage feature highlights" ON feature_highlights;
DROP POLICY IF EXISTS "Public can read feature highlights" ON feature_highlights;

DROP POLICY IF EXISTS "Authenticated users can manage site settings" ON site_settings;
DROP POLICY IF EXISTS "Public can read site settings" ON site_settings;

DROP POLICY IF EXISTS "Admins can read own data" ON admin_users;
DROP POLICY IF EXISTS "Admins can update own last_login" ON admin_users;
DROP POLICY IF EXISTS "Authenticated can verify admin status" ON admin_users;

-- Create new policies with correct Supabase auth functions

-- Applications policies
CREATE POLICY "Allow public application submissions"
  ON applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all applications"
  ON applications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  );

CREATE POLICY "Users can read own applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email') = email);

-- Apartments policies
CREATE POLICY "Public can read apartments"
  ON apartments
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage apartments"
  ON apartments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  );

-- Apartment features policies
CREATE POLICY "Public can read apartment features"
  ON apartment_features
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage apartment features"
  ON apartment_features
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  );

-- Apartment images policies
CREATE POLICY "Public can read apartment images"
  ON apartment_images
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage apartment images"
  ON apartment_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  );

-- Apartment availability policies
CREATE POLICY "Public can read apartment availability"
  ON apartment_availability
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage apartment availability"
  ON apartment_availability
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  );

-- iCal feeds policies (admin only)
CREATE POLICY "Admins can manage ical feeds"
  ON apartment_ical_feeds
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  );

-- Bookings policies
CREATE POLICY "Admins can manage bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  );

-- Reviews policies
CREATE POLICY "Public can read featured reviews"
  ON reviews
  FOR SELECT
  TO anon, authenticated
  USING (is_featured = true);

CREATE POLICY "Admins can manage reviews"
  ON reviews
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  );

-- Feature highlights policies
CREATE POLICY "Public can read active feature highlights"
  ON feature_highlights
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage feature highlights"
  ON feature_highlights
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  );

-- Site settings policies
CREATE POLICY "Public can read site settings"
  ON site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage site settings"
  ON site_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND is_active = true
    )
  );

-- Admin users policies
CREATE POLICY "Admins can read own data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = id::text OR 
    (auth.jwt() ->> 'email') = email
  );

CREATE POLICY "Admins can update own last_login"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid()::text = id::text OR 
    (auth.jwt() ->> 'email') = email
  )
  WITH CHECK (
    auth.uid()::text = id::text OR 
    (auth.jwt() ->> 'email') = email
  );

CREATE POLICY "Authenticated can verify admin status"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);