/*
  # Fix Auth RLS Initialization Plan Issues and Multiple Permissive Policies

  ## Changes

  1. admin_users - wrap auth.uid() in SELECT subquery; drop redundant duplicate SELECT policies
     keeping only one consolidated SELECT policy and one UPDATE policy
  2. coworking_bookings - wrap auth.uid() SELECT; drop redundant INSERT (always-true)
     and keep only the admin INSERT since anyone can already insert via anon role
  3. conversation_participants - fix INSERT policy auth.uid() subquery
  4. buildings - drop duplicate INSERT/UPDATE/DELETE policies that overlap with is_admin() ALL policy
  5. apartment_ical_exports - drop duplicate ALL policy that uses raw auth.uid()
  6. revenue_analytics - drop duplicate SELECT policy
  7. admin_notifications - wrap auth.jwt() references with SELECT subquery; fix always-true INSERT
  8. webhook_logs - drop duplicate/always-true policies, restrict to service_role
  9. location_notify_signups - fix auth.uid() init plan
*/

-- ============================================================
-- admin_users
-- ============================================================
DROP POLICY IF EXISTS "Admin users can read own data" ON admin_users;
DROP POLICY IF EXISTS "Admin users can read own data by email" ON admin_users;
DROP POLICY IF EXISTS "Admin users can update own data" ON admin_users;

CREATE POLICY "Admin users can read own data"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admin users can update own data"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- coworking_bookings
-- ============================================================
-- Fix auth.uid() init plan on Users can view own bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON coworking_bookings;
CREATE POLICY "Users can view own bookings"
  ON coworking_bookings FOR SELECT
  TO authenticated
  USING (
    (NOT is_admin())
    AND customer_email = (
      SELECT email FROM auth.users WHERE id = (SELECT auth.uid())
    )
  );

-- Remove always-true INSERT that duplicates admin INSERT; public booking creation
-- should be restricted to anon/authenticated with minimal check
DROP POLICY IF EXISTS "Anyone can create bookings" ON coworking_bookings;
CREATE POLICY "Anyone can create bookings"
  ON coworking_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    is_admin()
    OR (
      customer_email IS NOT NULL
      AND customer_name IS NOT NULL
    )
  );

-- ============================================================
-- conversation_participants
-- ============================================================
DROP POLICY IF EXISTS "Users can add participants to conversations they participate in" ON conversation_participants;
CREATE POLICY "Users can add participants to conversations they participate in"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR (
      EXISTS (
        SELECT 1
        FROM conversation_participants cp
        JOIN guest_users gu ON cp.guest_user_id = gu.id
        WHERE cp.conversation_id = conversation_participants.conversation_id
          AND gu.user_id = (SELECT auth.uid())
      )
    )
  );

-- ============================================================
-- buildings
-- ============================================================
-- Drop duplicate policies that overlap with "Admins can manage buildings" ALL policy
DROP POLICY IF EXISTS "Authenticated admins can delete buildings" ON buildings;
DROP POLICY IF EXISTS "Authenticated admins can insert buildings" ON buildings;
DROP POLICY IF EXISTS "Authenticated admins can update buildings" ON buildings;

-- ============================================================
-- apartment_ical_exports
-- ============================================================
-- Drop the older raw-auth.uid policy, keep is_admin() version
DROP POLICY IF EXISTS "Admins can manage ical exports" ON apartment_ical_exports;

-- Fix the remaining policy's auth function call
DROP POLICY IF EXISTS "Admins can manage export tokens" ON apartment_ical_exports;
CREATE POLICY "Admins can manage export tokens"
  ON apartment_ical_exports FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- revenue_analytics
-- ============================================================
-- Drop the duplicate SELECT policy using raw auth.uid()
DROP POLICY IF EXISTS "Admins can view revenue analytics" ON revenue_analytics;

-- ============================================================
-- admin_notifications
-- ============================================================
-- Fix auth.jwt() re-evaluation and always-true INSERT
DROP POLICY IF EXISTS "Admins can view their notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Admins can update their notifications" ON admin_notifications;
DROP POLICY IF EXISTS "System can create notifications" ON admin_notifications;

CREATE POLICY "Admins can view their notifications"
  ON admin_notifications FOR SELECT
  TO authenticated
  USING (
    admin_user_id IS NULL
    OR admin_user_id = (
      SELECT id FROM admin_users
      WHERE email = (SELECT auth.jwt() ->> 'email')
        AND is_active = true
      LIMIT 1
    )
  );

CREATE POLICY "Admins can update their notifications"
  ON admin_notifications FOR UPDATE
  TO authenticated
  USING (
    admin_user_id IS NULL
    OR admin_user_id = (
      SELECT id FROM admin_users
      WHERE email = (SELECT auth.jwt() ->> 'email')
        AND is_active = true
      LIMIT 1
    )
  )
  WITH CHECK (
    admin_user_id IS NULL
    OR admin_user_id = (
      SELECT id FROM admin_users
      WHERE email = (SELECT auth.jwt() ->> 'email')
        AND is_active = true
      LIMIT 1
    )
  );

-- Restrict notification creation to service_role only (triggers/functions use service role)
CREATE POLICY "System can create notifications"
  ON admin_notifications FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================
-- webhook_logs
-- ============================================================
-- Fix always-true INSERT/UPDATE and duplicate SELECT
DROP POLICY IF EXISTS "Admins can view webhook logs" ON webhook_logs;
DROP POLICY IF EXISTS "System can create webhook logs" ON webhook_logs;
DROP POLICY IF EXISTS "System can update webhook logs" ON webhook_logs;

CREATE POLICY "Admins can view webhook logs"
  ON webhook_logs FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "System can create webhook logs"
  ON webhook_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "System can update webhook logs"
  ON webhook_logs FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- location_notify_signups
-- ============================================================
DROP POLICY IF EXISTS "Admins can read notification signups" ON location_notify_signups;
CREATE POLICY "Admins can read notification signups"
  ON location_notify_signups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
        AND admin_users.is_active = true
    )
  );
