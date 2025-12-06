/*
  # Fix Admin Users Table and RLS Policies

  1. Changes
    - Add user_id column to admin_users table to link with auth.users
    - Update RLS policies to use user_id instead of querying auth.users table
    - This fixes the "permission denied for table users" error

  2. Migration Steps
    - Add user_id column with foreign key to auth.users
    - Drop and recreate RLS policies using user_id
    - NOTE: Existing admin records will need their user_id populated manually

  3. Security
    - RLS policies now check admin_users.user_id = auth.uid()
    - This is more efficient and doesn't require special permissions on auth.users
*/

-- Add user_id column to admin_users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE UNIQUE INDEX IF NOT EXISTS admin_users_user_id_idx ON admin_users(user_id);
  END IF;
END $$;

-- Update existing admin records to populate user_id based on email
-- This matches admins to their auth.users record
UPDATE admin_users
SET user_id = auth.users.id
FROM auth.users
WHERE admin_users.email = auth.users.email
AND admin_users.user_id IS NULL;

-- Drop old RLS policies
DROP POLICY IF EXISTS "Admins can manage guest invitations" ON guest_invitations;
DROP POLICY IF EXISTS "Admins have full access to guest users" ON guest_users;
DROP POLICY IF EXISTS "Admins can manage local content" ON local_content;
DROP POLICY IF EXISTS "Admins can manage community events" ON community_events;
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can view all announcement reads" ON announcement_reads;
DROP POLICY IF EXISTS "Admins can manage all service requests" ON service_requests;
DROP POLICY IF EXISTS "Admins can manage all extension requests" ON stay_extension_requests;

-- Create new policies using user_id instead of email subquery
CREATE POLICY "Admins can manage guest invitations"
  ON guest_invitations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins have full access to guest users"
  ON guest_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage local content"
  ON local_content FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage community events"
  ON community_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can view all announcement reads"
  ON announcement_reads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage all service requests"
  ON service_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage all extension requests"
  ON stay_extension_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );
