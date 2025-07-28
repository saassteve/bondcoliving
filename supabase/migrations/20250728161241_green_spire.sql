/*
  # Create Admin User System

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `role` (text, admin or super_admin)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `last_login` (timestamp)

  2. Security
    - Enable RLS on `admin_users` table
    - Add policies for admin access
    
  3. Initial Data
    - Create a default admin user
*/

-- Create admin_users table if it doesn't exist
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

-- Create policies only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_users' AND policyname = 'Admins can read own data'
  ) THEN
    CREATE POLICY "Admins can read own data"
      ON admin_users
      FOR SELECT
      TO authenticated
      USING (
        (auth.uid())::text = id::text OR 
        (auth.jwt() ->> 'email'::text) = email
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_users' AND policyname = 'Admins can update own last_login'
  ) THEN
    CREATE POLICY "Admins can update own last_login"
      ON admin_users
      FOR UPDATE
      TO authenticated
      USING (
        (auth.uid())::text = id::text OR 
        (auth.jwt() ->> 'email'::text) = email
      )
      WITH CHECK (
        (auth.uid())::text = id::text OR 
        (auth.jwt() ->> 'email'::text) = email
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_users' AND policyname = 'Authenticated can verify admin status'
  ) THEN
    CREATE POLICY "Authenticated can verify admin status"
      ON admin_users
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create a default admin user (you should change this password!)
INSERT INTO admin_users (email, password_hash, role, is_active)
VALUES (
  'admin@stayatbond.com',
  crypt('admin123', gen_salt('bf')),
  'super_admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Function to change admin password
CREATE OR REPLACE FUNCTION change_admin_password(
  current_password text,
  new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
  current_hash text;
BEGIN
  -- Get the current user's email from JWT
  user_email := auth.jwt() ->> 'email';
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current password hash
  SELECT password_hash INTO current_hash
  FROM admin_users
  WHERE email = user_email AND is_active = true;

  IF current_hash IS NULL THEN
    RAISE EXCEPTION 'Admin user not found';
  END IF;

  -- Verify current password
  IF NOT (current_hash = crypt(current_password, current_hash)) THEN
    RAISE EXCEPTION 'Current password is incorrect';
  END IF;

  -- Update password
  UPDATE admin_users
  SET password_hash = crypt(new_password, gen_salt('bf'))
  WHERE email = user_email;

  RETURN true;
END;
$$;

-- Function to create admin user
CREATE OR REPLACE FUNCTION create_admin_user(
  admin_email text,
  admin_password text,
  admin_role text DEFAULT 'admin'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_email text;
  current_user_role text;
BEGIN
  -- Get the current user's info from JWT
  current_user_email := auth.jwt() ->> 'email';
  
  IF current_user_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if current user is super_admin
  SELECT role INTO current_user_role
  FROM admin_users
  WHERE email = current_user_email AND is_active = true;

  IF current_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can create new admin users';
  END IF;

  -- Create the new admin user
  INSERT INTO admin_users (email, password_hash, role, is_active)
  VALUES (
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    admin_role,
    true
  );

  RETURN true;
END;
$$;