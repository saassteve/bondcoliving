/*
  # Add RLS policies for apartment_ical_exports

  1. Security Changes
    - Table had RLS enabled but zero policies, making it completely inaccessible
    - Added admin-only SELECT, INSERT, UPDATE, DELETE policies
    - Only active admin users (verified via admin_users table) can access

  2. New Policies
    - `Admins can view ical exports` (SELECT) - admin-only read
    - `Admins can create ical exports` (INSERT) - admin-only create
    - `Admins can update ical exports` (UPDATE) - admin-only update
    - `Admins can delete ical exports` (DELETE) - admin-only delete

  3. Important Notes
    - Uses `(select auth.uid())` pattern for optimal per-query auth resolution
    - All policies check admin_users.is_active to prevent deactivated admin access
*/

CREATE POLICY "Admins can view ical exports"
  ON public.apartment_ical_exports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
        AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can create ical exports"
  ON public.apartment_ical_exports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
        AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can update ical exports"
  ON public.apartment_ical_exports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
        AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
        AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can delete ical exports"
  ON public.apartment_ical_exports
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
        AND admin_users.is_active = true
    )
  );
