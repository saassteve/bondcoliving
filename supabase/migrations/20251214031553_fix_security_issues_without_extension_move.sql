/*
  # Comprehensive Security Fixes

  ## 1. Foreign Key Indexes
  Add indexes to all foreign key columns for optimal query performance:
    - announcement_reads.guest_user_id
    - announcements.created_by
    - community_events.created_by
    - guest_invitations (booking_id, created_by, used_by_user_id)
    - local_content.created_by
    - service_requests.resolved_by
    - stay_extension_requests (apartment_id, booking_id, guest_user_id, reviewed_by)

  ## 2. RLS Policy Performance Optimization
  Replace all `auth.uid()` calls with `(select auth.uid())` to prevent 
  re-evaluation for each row, improving query performance at scale.
  
  Affects 40+ policies across multiple tables.

  ## 3. Function Search Path Security
  Set immutable search_path for all functions to prevent security vulnerabilities.

  Note: Extensions (pg_net, http) cannot be moved from public schema as they don't support SET SCHEMA.
*/

-- =====================================================
-- PART 1: Add Missing Foreign Key Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_announcement_reads_guest_user_id 
  ON announcement_reads(guest_user_id);

CREATE INDEX IF NOT EXISTS idx_announcements_created_by 
  ON announcements(created_by);

CREATE INDEX IF NOT EXISTS idx_community_events_created_by 
  ON community_events(created_by);

CREATE INDEX IF NOT EXISTS idx_guest_invitations_booking_id 
  ON guest_invitations(booking_id);

CREATE INDEX IF NOT EXISTS idx_guest_invitations_created_by 
  ON guest_invitations(created_by);

CREATE INDEX IF NOT EXISTS idx_guest_invitations_used_by_user_id 
  ON guest_invitations(used_by_user_id);

CREATE INDEX IF NOT EXISTS idx_local_content_created_by 
  ON local_content(created_by);

CREATE INDEX IF NOT EXISTS idx_service_requests_resolved_by 
  ON service_requests(resolved_by);

CREATE INDEX IF NOT EXISTS idx_stay_extension_requests_apartment_id 
  ON stay_extension_requests(apartment_id);

CREATE INDEX IF NOT EXISTS idx_stay_extension_requests_booking_id 
  ON stay_extension_requests(booking_id);

CREATE INDEX IF NOT EXISTS idx_stay_extension_requests_guest_user_id 
  ON stay_extension_requests(guest_user_id);

CREATE INDEX IF NOT EXISTS idx_stay_extension_requests_reviewed_by 
  ON stay_extension_requests(reviewed_by);

-- =====================================================
-- PART 2: Fix RLS Policies - Auth Function Optimization
-- =====================================================

-- announcement_reads
DROP POLICY IF EXISTS "Users can view own announcement reads" ON announcement_reads;
CREATE POLICY "Users can view own announcement reads"
  ON announcement_reads FOR SELECT
  TO authenticated
  USING (guest_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can mark announcements as read" ON announcement_reads;
CREATE POLICY "Users can mark announcements as read"
  ON announcement_reads FOR INSERT
  TO authenticated
  WITH CHECK (guest_user_id = (select auth.uid()));

-- admin_users
DROP POLICY IF EXISTS "Admin users can read own data" ON admin_users;
CREATE POLICY "Admin users can read own data"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admin users can update own last_login" ON admin_users;
CREATE POLICY "Admin users can update own last_login"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- guest_users
DROP POLICY IF EXISTS "Admins can delete guest users" ON guest_users;
CREATE POLICY "Admins can delete guest users"
  ON guest_users FOR DELETE
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Users can view own guest user record" ON guest_users;
CREATE POLICY "Users can view own guest user record"
  ON guest_users FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own guest user record" ON guest_users;
CREATE POLICY "Users can update own guest user record"
  ON guest_users FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- guest_invitations
DROP POLICY IF EXISTS "Admins can delete guest invitations" ON guest_invitations;
CREATE POLICY "Admins can delete guest invitations"
  ON guest_invitations FOR DELETE
  TO authenticated
  USING (is_admin());

-- coworking_pass_codes
DROP POLICY IF EXISTS "Admins can view all codes" ON coworking_pass_codes;
CREATE POLICY "Admins can view all codes"
  ON coworking_pass_codes FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert codes" ON coworking_pass_codes;
CREATE POLICY "Admins can insert codes"
  ON coworking_pass_codes FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update codes" ON coworking_pass_codes;
CREATE POLICY "Admins can update codes"
  ON coworking_pass_codes FOR UPDATE
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete unused codes" ON coworking_pass_codes;
CREATE POLICY "Admins can delete unused codes"
  ON coworking_pass_codes FOR DELETE
  TO authenticated
  USING (is_admin() AND NOT is_used);

-- service_requests
DROP POLICY IF EXISTS "Overnight guests can view own service requests" ON service_requests;
CREATE POLICY "Overnight guests can view own service requests"
  ON service_requests FOR SELECT
  TO authenticated
  USING (guest_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Overnight guests can create service requests" ON service_requests;
CREATE POLICY "Overnight guests can create service requests"
  ON service_requests FOR INSERT
  TO authenticated
  WITH CHECK (guest_user_id = (select auth.uid()));

-- stay_extension_requests
DROP POLICY IF EXISTS "Overnight guests can view own extension requests" ON stay_extension_requests;
CREATE POLICY "Overnight guests can view own extension requests"
  ON stay_extension_requests FOR SELECT
  TO authenticated
  USING (guest_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Overnight guests can create extension requests" ON stay_extension_requests;
CREATE POLICY "Overnight guests can create extension requests"
  ON stay_extension_requests FOR INSERT
  TO authenticated
  WITH CHECK (guest_user_id = (select auth.uid()));

-- deletion_audit_log
DROP POLICY IF EXISTS "Admins can view deletion audit log" ON deletion_audit_log;
CREATE POLICY "Admins can view deletion audit log"
  ON deletion_audit_log FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert audit log" ON deletion_audit_log;
CREATE POLICY "Admins can insert audit log"
  ON deletion_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- admin_support_tickets
DROP POLICY IF EXISTS "Guests can view own support tickets" ON admin_support_tickets;
CREATE POLICY "Guests can view own support tickets"
  ON admin_support_tickets FOR SELECT
  TO authenticated
  USING (guest_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Guests can create support tickets" ON admin_support_tickets;
CREATE POLICY "Guests can create support tickets"
  ON admin_support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (guest_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Guests can update own support tickets" ON admin_support_tickets;
CREATE POLICY "Guests can update own support tickets"
  ON admin_support_tickets FOR UPDATE
  TO authenticated
  USING (guest_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins have full access to support tickets" ON admin_support_tickets;
CREATE POLICY "Admins have full access to support tickets"
  ON admin_support_tickets FOR ALL
  TO authenticated
  USING (is_admin());

-- admin_support_messages
DROP POLICY IF EXISTS "Guests can view messages in own tickets" ON admin_support_messages;
CREATE POLICY "Guests can view messages in own tickets"
  ON admin_support_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_support_tickets
      WHERE admin_support_tickets.id = admin_support_messages.ticket_id
      AND admin_support_tickets.guest_user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Guests can send messages in own tickets" ON admin_support_messages;
CREATE POLICY "Guests can send messages in own tickets"
  ON admin_support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_type = 'guest' AND
    EXISTS (
      SELECT 1 FROM admin_support_tickets
      WHERE admin_support_tickets.id = admin_support_messages.ticket_id
      AND admin_support_tickets.guest_user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins have full access to support messages" ON admin_support_messages;
CREATE POLICY "Admins have full access to support messages"
  ON admin_support_messages FOR ALL
  TO authenticated
  USING (is_admin());

-- guest_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON guest_profiles;
CREATE POLICY "Users can view own profile"
  ON guest_profiles FOR SELECT
  TO authenticated
  USING (guest_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON guest_profiles;
CREATE POLICY "Users can update own profile"
  ON guest_profiles FOR UPDATE
  TO authenticated
  USING (guest_user_id = (select auth.uid()))
  WITH CHECK (guest_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON guest_profiles;
CREATE POLICY "Users can insert own profile"
  ON guest_profiles FOR INSERT
  TO authenticated
  WITH CHECK (guest_user_id = (select auth.uid()));

-- messaging_preferences
DROP POLICY IF EXISTS "Users can view own messaging preferences" ON messaging_preferences;
CREATE POLICY "Users can view own messaging preferences"
  ON messaging_preferences FOR SELECT
  TO authenticated
  USING (guest_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own messaging preferences" ON messaging_preferences;
CREATE POLICY "Users can update own messaging preferences"
  ON messaging_preferences FOR UPDATE
  TO authenticated
  USING (guest_user_id = (select auth.uid()))
  WITH CHECK (guest_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own messaging preferences" ON messaging_preferences;
CREATE POLICY "Users can insert own messaging preferences"
  ON messaging_preferences FOR INSERT
  TO authenticated
  WITH CHECK (guest_user_id = (select auth.uid()));

-- conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.guest_user_id = (select auth.uid())
    )
  );

-- conversation_participants
DROP POLICY IF EXISTS "Users can view participants in own conversations" ON conversation_participants;
CREATE POLICY "Users can view participants in own conversations"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.guest_user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own participant record" ON conversation_participants;
CREATE POLICY "Users can update own participant record"
  ON conversation_participants FOR UPDATE
  TO authenticated
  USING (guest_user_id = (select auth.uid()))
  WITH CHECK (guest_user_id = (select auth.uid()));

-- messages
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.guest_user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;
CREATE POLICY "Users can send messages in own conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.guest_user_id = (select auth.uid())
    )
  );

-- local_content
DROP POLICY IF EXISTS "Active guests can view published content" ON local_content;
CREATE POLICY "Active guests can view published content"
  ON local_content FOR SELECT
  TO authenticated
  USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = (select auth.uid())
      AND guest_users.access_end_date >= CURRENT_TIMESTAMP
    )
  );

-- cleaning_preferences
DROP POLICY IF EXISTS "Overnight guests can view own cleaning preferences" ON cleaning_preferences;
CREATE POLICY "Overnight guests can view own cleaning preferences"
  ON cleaning_preferences FOR SELECT
  TO authenticated
  USING (guest_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Overnight guests can create cleaning preferences" ON cleaning_preferences;
CREATE POLICY "Overnight guests can create cleaning preferences"
  ON cleaning_preferences FOR INSERT
  TO authenticated
  WITH CHECK (guest_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Overnight guests can update own cleaning preferences" ON cleaning_preferences;
CREATE POLICY "Overnight guests can update own cleaning preferences"
  ON cleaning_preferences FOR UPDATE
  TO authenticated
  USING (guest_user_id = (select auth.uid()))
  WITH CHECK (guest_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all cleaning preferences" ON cleaning_preferences;
CREATE POLICY "Admins can view all cleaning preferences"
  ON cleaning_preferences FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage cleaning preferences" ON cleaning_preferences;
CREATE POLICY "Admins can manage cleaning preferences"
  ON cleaning_preferences FOR ALL
  TO authenticated
  USING (is_admin());

-- community_events
DROP POLICY IF EXISTS "Active guests can view published events" ON community_events;
CREATE POLICY "Active guests can view published events"
  ON community_events FOR SELECT
  TO authenticated
  USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = (select auth.uid())
      AND guest_users.access_end_date >= CURRENT_TIMESTAMP
    )
  );

-- event_rsvps
DROP POLICY IF EXISTS "Active guests can view RSVPs for events" ON event_rsvps;
CREATE POLICY "Active guests can view RSVPs for events"
  ON event_rsvps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = (select auth.uid())
      AND guest_users.access_end_date >= CURRENT_TIMESTAMP
    )
  );

DROP POLICY IF EXISTS "Users can manage own RSVPs" ON event_rsvps;
CREATE POLICY "Users can manage own RSVPs"
  ON event_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (guest_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own RSVPs" ON event_rsvps;
CREATE POLICY "Users can update own RSVPs"
  ON event_rsvps FOR UPDATE
  TO authenticated
  USING (guest_user_id = (select auth.uid()))
  WITH CHECK (guest_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own RSVPs" ON event_rsvps;
CREATE POLICY "Users can delete own RSVPs"
  ON event_rsvps FOR DELETE
  TO authenticated
  USING (guest_user_id = (select auth.uid()));

-- announcements
DROP POLICY IF EXISTS "Active guests can view published announcements" ON announcements;
CREATE POLICY "Active guests can view published announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = (select auth.uid())
      AND guest_users.access_end_date >= CURRENT_TIMESTAMP
    )
  );

-- coworking_bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON coworking_bookings;
CREATE POLICY "Users can view own bookings"
  ON coworking_bookings FOR SELECT
  TO authenticated
  USING (customer_email = (SELECT email FROM auth.users WHERE id = (select auth.uid())));

-- =====================================================
-- PART 3: Fix Function Search Paths
-- =====================================================

ALTER FUNCTION update_promotion_banners_updated_at() SET search_path = '';
ALTER FUNCTION calculate_booking_total(uuid) SET search_path = '';
ALTER FUNCTION check_booking_availability(uuid, date, date, uuid) SET search_path = '';
ALTER FUNCTION expire_guest_access() SET search_path = '';
ALTER FUNCTION get_unread_message_count(uuid) SET search_path = '';
ALTER FUNCTION cleanup_expired_password_reset_tokens() SET search_path = '';
ALTER FUNCTION get_next_available_date_for_apartment(uuid, integer, integer) SET search_path = '';
ALTER FUNCTION assign_coworking_pass_code(uuid) SET search_path = '';
ALTER FUNCTION is_super_admin() SET search_path = '';
ALTER FUNCTION is_admin() SET search_path = '';
ALTER FUNCTION update_ticket_last_message() SET search_path = '';
ALTER FUNCTION calculate_next_cleaning_date(date, integer, integer) SET search_path = '';
ALTER FUNCTION get_available_cleaning_days(uuid) SET search_path = '';
ALTER FUNCTION check_admin_status() SET search_path = '';
ALTER FUNCTION can_admin_delete_from(text, uuid) SET search_path = '';
ALTER FUNCTION test_admin_permissions() SET search_path = '';
