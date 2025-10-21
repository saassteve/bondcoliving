/*
  # Fix Critical Security Issues - Final

  1. Performance & Security Fixes
    - Add missing index on apartment_features.apartment_id foreign key
    - Enable RLS on applications table
    - Optimize RLS policies to use (select auth.jwt()) pattern for caching
    - Set search_path on security definer functions

  2. Security Improvements
    - Prevents RLS policy re-evaluation on each row
    - Prevents search_path manipulation attacks
    - Ensures proper indexing for foreign key queries
*/

-- =====================================================
-- 1. Add missing foreign key index
-- =====================================================
CREATE INDEX IF NOT EXISTS apartment_features_apartment_id_idx 
ON apartment_features(apartment_id);

-- =====================================================
-- 2. Enable RLS on applications table
-- =====================================================
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. Optimize RLS Policies - Cache auth function calls
-- =====================================================

-- apartment_features
DROP POLICY IF EXISTS "Admins can manage apartment features" ON apartment_features;
CREATE POLICY "Admins can manage apartment features"
  ON apartment_features FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  );

-- reviews
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
CREATE POLICY "Admins can manage reviews"
  ON reviews FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  );

-- feature_highlights
DROP POLICY IF EXISTS "Admins can manage feature highlights" ON feature_highlights;
CREATE POLICY "Admins can manage feature highlights"
  ON feature_highlights FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  );

-- site_settings
DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;
CREATE POLICY "Admins can manage site settings"
  ON site_settings FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  );

-- admin_users
DROP POLICY IF EXISTS "Admins can read own data" ON admin_users;
CREATE POLICY "Admins can read own data"
  ON admin_users FOR SELECT TO authenticated
  USING (
    (select auth.uid())::text = id::text 
    OR email = (select auth.jwt() ->> 'email')
  );

DROP POLICY IF EXISTS "Admins can update own last_login" ON admin_users;
CREATE POLICY "Admins can update own last_login"
  ON admin_users FOR UPDATE TO authenticated
  USING (
    (select auth.uid())::text = id::text 
    OR email = (select auth.jwt() ->> 'email')
  )
  WITH CHECK (
    (select auth.uid())::text = id::text 
    OR email = (select auth.jwt() ->> 'email')
  );

-- apartment_images
DROP POLICY IF EXISTS "Admins can manage apartment images" ON apartment_images;
CREATE POLICY "Admins can manage apartment images"
  ON apartment_images FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  );

-- apartment_availability
DROP POLICY IF EXISTS "Admins can manage apartment availability" ON apartment_availability;
CREATE POLICY "Admins can manage apartment availability"
  ON apartment_availability FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  );

-- apartment_ical_feeds
DROP POLICY IF EXISTS "Admins can manage ical feeds" ON apartment_ical_feeds;
CREATE POLICY "Admins can manage ical feeds"
  ON apartment_ical_feeds FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  );

-- apartments
DROP POLICY IF EXISTS "Admins can manage apartments" ON apartments;
CREATE POLICY "Admins can manage apartments"
  ON apartments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  );

-- bookings
DROP POLICY IF EXISTS "Admins can manage bookings" ON bookings;
CREATE POLICY "Admins can manage bookings"
  ON bookings FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  );

-- apartment_ical_events
DROP POLICY IF EXISTS "Admins can manage ical events" ON apartment_ical_events;
CREATE POLICY "Admins can manage ical events"
  ON apartment_ical_events FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (select auth.jwt() ->> 'email') AND is_active = true
    )
  );

-- =====================================================
-- 4. Set search_path on security definer functions
-- =====================================================

ALTER FUNCTION authenticate_admin(text, text) SET search_path = public;
ALTER FUNCTION change_admin_password(text, text) SET search_path = public;
ALTER FUNCTION check_apartment_availability(uuid, date, date) SET search_path = public;
ALTER FUNCTION cleanup_orphaned_availability(uuid) SET search_path = public;
ALTER FUNCTION create_admin_user(text, text, text) SET search_path = public;
ALTER FUNCTION delete_ical_feed_cascade(uuid) SET search_path = public;
ALTER FUNCTION get_apartment_calendar(uuid, date, date) SET search_path = public;
ALTER FUNCTION set_bulk_apartment_availability(uuid, date[], text, text) SET search_path = public;