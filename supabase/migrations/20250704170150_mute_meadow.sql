/*
  # Add Admin Authentication System

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `role` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `last_login` (timestamp)

  2. Security
    - Enable RLS on admin_users table
    - Add policies for admin authentication
    - Update existing policies to use proper admin authentication

  3. Functions
    - Admin login function
    - Password hashing utilities
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Admin users can only read their own data
CREATE POLICY "Admin users can read own data"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Only super admins can manage admin users
CREATE POLICY "Super admins can manage admin users"
  ON admin_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND role = 'super_admin' 
      AND is_active = true
    )
  );

-- Create admin authentication function
CREATE OR REPLACE FUNCTION authenticate_admin(
  admin_email text,
  admin_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record admin_users;
  auth_result json;
BEGIN
  -- Find admin user
  SELECT * INTO admin_record
  FROM admin_users
  WHERE email = admin_email
    AND is_active = true;

  -- Check if admin exists and password matches
  IF admin_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Invalid credentials');
  END IF;

  -- In a real implementation, you would use proper password hashing
  -- For demo purposes, we'll use a simple comparison
  IF admin_record.password_hash = crypt(admin_password, admin_record.password_hash) THEN
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
    RETURN json_build_object('success', false, 'message', 'Invalid credentials');
  END IF;
END;
$$;

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (email, password_hash, role) VALUES
('admin@bond.com', crypt('admin123', gen_salt('bf')), 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Update existing policies to use admin_users table instead of JWT claims
DROP POLICY IF EXISTS "Admins can manage apartments" ON apartments;
DROP POLICY IF EXISTS "Admins can manage apartment features" ON apartment_features;
DROP POLICY IF EXISTS "Admins can manage applications" ON applications;
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage feature highlights" ON feature_highlights;
DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;

-- Create new admin policies
CREATE POLICY "Authenticated admins can manage apartments"
  ON apartments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND is_active = true
    )
  );

CREATE POLICY "Authenticated admins can manage apartment features"
  ON apartment_features FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND is_active = true
    )
  );

CREATE POLICY "Authenticated admins can manage applications"
  ON applications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND is_active = true
    )
  );

CREATE POLICY "Authenticated admins can manage reviews"
  ON reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND is_active = true
    )
  );

CREATE POLICY "Authenticated admins can manage feature highlights"
  ON feature_highlights FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND is_active = true
    )
  );

CREATE POLICY "Authenticated admins can manage site settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND is_active = true
    )
  );