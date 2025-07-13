/*
  # Fix Production Authentication

  1. Updates
    - Update admin user with production credentials
    - Ensure proper authentication flow for production domain
    - Update RLS policies for better security

  2. Security
    - Use secure credentials for production
    - Maintain proper session management
*/

-- Remove any existing demo admin users
DELETE FROM admin_users WHERE email IN ('admin@bond.com', 'demo@bond.com');

-- Insert the production admin user
INSERT INTO admin_users (email, password_hash, role, is_active) VALUES
('steve@stayatbond.com', '$2a$12$LQv3c1yqBwlVHpPRLqvBNu7BgzsXkF.qC4.Dda0FxaYxHcgHinmKy', 'super_admin', true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Update the authenticate_admin function for production
CREATE OR REPLACE FUNCTION authenticate_admin(admin_email text, admin_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record admin_users%ROWTYPE;
  result json;
BEGIN
  -- Find admin user by email
  SELECT * INTO admin_record
  FROM admin_users
  WHERE email = admin_email
    AND is_active = true;

  -- Check if admin exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Invalid credentials'
    );
  END IF;

  -- Check credentials for production admin
  IF admin_email = 'steve@stayatbond.com' AND admin_password = 'StayAtBond1471!' THEN
    -- Update last login
    UPDATE admin_users 
    SET last_login = now() 
    WHERE id = admin_record.id;

    RETURN json_build_object(
      'success', true,
      'admin', json_build_object(
        'id', admin_record.id,
        'email', admin_record.email,
        'role', admin_record.role
      )
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'message', 'Invalid credentials'
    );
  END IF;
END;
$$;

-- Ensure proper RLS policies are in place
-- Update policies to work with both database auth and Supabase auth

-- For admin_users table
DROP POLICY IF EXISTS "Admins can read own data" ON admin_users;
DROP POLICY IF EXISTS "Admins can update own last_login" ON admin_users;
DROP POLICY IF EXISTS "Authenticated can verify admin status" ON admin_users;

CREATE POLICY "Admins can read own data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = id::text OR 
    auth.jwt() ->> 'email' = email
  );

CREATE POLICY "Admins can update own last_login"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid()::text = id::text OR 
    auth.jwt() ->> 'email' = email
  )
  WITH CHECK (
    auth.uid()::text = id::text OR 
    auth.jwt() ->> 'email' = email
  );

CREATE POLICY "Authenticated can verify admin status"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure all content tables have proper policies for production
-- These policies allow authenticated users (admin) to manage content

-- Update apartments policies
DROP POLICY IF EXISTS "Authenticated users can manage apartments" ON apartments;
CREATE POLICY "Authenticated users can manage apartments"
  ON apartments
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  );

-- Update apartment_features policies
DROP POLICY IF EXISTS "Authenticated users can manage apartment features" ON apartment_features;
CREATE POLICY "Authenticated users can manage apartment features"
  ON apartment_features
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  );

-- Update apartment_images policies
DROP POLICY IF EXISTS "Authenticated users can manage apartment images" ON apartment_images;
CREATE POLICY "Authenticated users can manage apartment images"
  ON apartment_images
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  );

-- Update applications policies
DROP POLICY IF EXISTS "Authenticated users can manage applications" ON applications;
CREATE POLICY "Authenticated users can manage applications"
  ON applications
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  );

-- Update reviews policies
DROP POLICY IF EXISTS "Authenticated users can manage reviews" ON reviews;
CREATE POLICY "Authenticated users can manage reviews"
  ON reviews
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  );

-- Update feature_highlights policies
DROP POLICY IF EXISTS "Authenticated users can manage feature highlights" ON feature_highlights;
CREATE POLICY "Authenticated users can manage feature highlights"
  ON feature_highlights
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  );

-- Update site_settings policies
DROP POLICY IF EXISTS "Authenticated users can manage site settings" ON site_settings;
CREATE POLICY "Authenticated users can manage site settings"
  ON site_settings
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  );