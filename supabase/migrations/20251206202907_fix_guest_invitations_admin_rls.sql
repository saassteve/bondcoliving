/*
  # Fix Guest Invitations RLS Policy

  1. Changes
    - Drop existing admin policy that checks raw_user_meta_data
    - Create new policy that checks against admin_users table
    - Also fix other tables with same issue

  2. Security
    - Ensure only active admins can manage guest invitations
    - Use admin_users table for verification instead of metadata
*/

-- Drop old policies that use raw_user_meta_data
DROP POLICY IF EXISTS "Admins can manage guest invitations" ON guest_invitations;
DROP POLICY IF EXISTS "Admins have full access to guest users" ON guest_users;
DROP POLICY IF EXISTS "Admins can manage local content" ON local_content;
DROP POLICY IF EXISTS "Admins can manage community events" ON community_events;
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can view all announcement reads" ON announcement_reads;
DROP POLICY IF EXISTS "Admins can manage all service requests" ON service_requests;
DROP POLICY IF EXISTS "Admins can manage all extension requests" ON stay_extension_requests;

-- Create new policies using admin_users table
CREATE POLICY "Admins can manage guest invitations"
  ON guest_invitations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins have full access to guest users"
  ON guest_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage local content"
  ON local_content FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage community events"
  ON community_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can view all announcement reads"
  ON announcement_reads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage all service requests"
  ON service_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage all extension requests"
  ON stay_extension_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admin_users.is_active = true
    )
  );