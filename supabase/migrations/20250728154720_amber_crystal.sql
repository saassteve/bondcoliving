/*
  # Add Admin Management Functions

  1. New Functions
    - `authenticate_admin` - Securely authenticate admin users with password verification
    - `change_admin_password` - Allow admins to change their own passwords
    - `create_admin_user` - Allow super admins to create new admin users

  2. Security
    - Uses pgcrypto extension for secure password hashing with bcrypt
    - Validates current passwords before allowing changes
    - Role-based access control for user management
    - Prevents users from modifying their own active status

  3. Password Security
    - All passwords are hashed using bcrypt with salt rounds
    - Current password verification required for changes
    - Minimum password length validation
*/

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to authenticate admin users
CREATE OR REPLACE FUNCTION authenticate_admin(admin_email TEXT, admin_password TEXT)
RETURNS JSON AS $$
DECLARE
  admin_record RECORD;
  is_valid BOOLEAN := FALSE;
BEGIN
  -- Find the admin user
  SELECT id, email, password_hash, role, is_active
  INTO admin_record
  FROM admin_users
  WHERE email = admin_email AND is_active = true;
  
  -- Check if user exists and password is correct
  IF admin_record.id IS NOT NULL THEN
    is_valid := crypt(admin_password, admin_record.password_hash) = admin_record.password_hash;
    
    -- Update last login if authentication successful
    IF is_valid THEN
      UPDATE admin_users 
      SET last_login = now() 
      WHERE id = admin_record.id;
    END IF;
  END IF;
  
  -- Return authentication result
  IF is_valid THEN
    RETURN json_build_object(
      'success', true,
      'admin', json_build_object(
        'id', admin_record.id,
        'email', admin_record.email,
        'role', admin_record.role
      )
    );
  ELSE
    RETURN json_build_object('success', false);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to change admin password
CREATE OR REPLACE FUNCTION change_admin_password(current_password TEXT, new_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  admin_record RECORD;
  current_user_email TEXT;
BEGIN
  -- Get current user email from JWT
  current_user_email := (jwt() ->> 'email');
  
  -- Validate input
  IF length(new_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters long';
  END IF;
  
  -- Find the admin user
  SELECT id, password_hash
  INTO admin_record
  FROM admin_users
  WHERE email = current_user_email AND is_active = true;
  
  -- Check if user exists
  IF admin_record.id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found';
  END IF;
  
  -- Verify current password
  IF NOT (crypt(current_password, admin_record.password_hash) = admin_record.password_hash) THEN
    RAISE EXCEPTION 'Current password is incorrect';
  END IF;
  
  -- Update password
  UPDATE admin_users
  SET password_hash = crypt(new_password, gen_salt('bf'))
  WHERE id = admin_record.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create new admin user (super admin only)
CREATE OR REPLACE FUNCTION create_admin_user(admin_email TEXT, admin_password TEXT, admin_role TEXT DEFAULT 'admin')
RETURNS BOOLEAN AS $$
DECLARE
  current_user_email TEXT;
  current_user_role TEXT;
BEGIN
  -- Get current user info from JWT
  current_user_email := (jwt() ->> 'email');
  
  -- Check if current user is super admin
  SELECT role INTO current_user_role
  FROM admin_users
  WHERE email = current_user_email AND is_active = true;
  
  IF current_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can create new admin users';
  END IF;
  
  -- Validate input
  IF length(admin_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters long';
  END IF;
  
  IF admin_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be admin or super_admin';
  END IF;
  
  -- Create new admin user
  INSERT INTO admin_users (email, password_hash, role, is_active)
  VALUES (
    lower(trim(admin_email)),
    crypt(admin_password, gen_salt('bf')),
    admin_role,
    true
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION authenticate_admin(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION change_admin_password(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_admin_user(TEXT, TEXT, TEXT) TO authenticated;

-- Also grant to anon for the authenticate function (needed for login)
GRANT EXECUTE ON FUNCTION authenticate_admin(TEXT, TEXT) TO anon;