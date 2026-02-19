/*
  # Add missing indexes on foreign key columns

  1. New Indexes
    - `activity_logs.admin_user_id` - speeds up joins/deletes on admin_users
    - `admin_support_messages.ticket_id` - speeds up ticket message lookups
    - `admin_support_tickets.assigned_to` - speeds up assigned ticket queries
    - `admin_support_tickets.guest_user_id` - speeds up guest ticket lookups
    - `announcements.created_by` - speeds up creator lookups
    - `apartment_booking_segments.apartment_id` - speeds up apartment segment queries
    - `apartment_features.apartment_id` - speeds up feature lookups by apartment
    - `apartments.building_id` - speeds up building-apartment joins
    - `cleaning_schedules.apartment_id` - speeds up cleaning schedule lookups
    - `community_events.created_by` - speeds up event creator lookups
    - `deletion_audit_log.performed_by` - speeds up audit trail queries
    - `guest_invitations.booking_id` - speeds up invitation-booking joins
    - `guest_invitations.created_by` - speeds up creator lookups
    - `guest_invitations.used_by_user_id` - speeds up used invitation queries
    - `local_content.created_by` - speeds up content creator lookups
    - `maintenance_requests.apartment_id` - speeds up maintenance queries
    - `messages.conversation_id` - speeds up conversation message lookups
    - `messages.sender_id` - speeds up sender message lookups
    - `password_reset_tokens.user_id` - speeds up token lookups by user
    - `service_requests.guest_user_id` - speeds up guest service queries
    - `service_requests.resolved_by` - speeds up resolver lookups
    - `stay_extension_requests.apartment_id` - speeds up apartment extension queries
    - `stay_extension_requests.guest_user_id` - speeds up guest extension queries
    - `stay_extension_requests.reviewed_by` - speeds up reviewer lookups

  2. Important Notes
    - All indexes use CONCURRENTLY-safe IF NOT EXISTS guard
    - Only foreign key columns that were confirmed unindexed are included
    - 5 FKs already had covering indexes and are skipped
*/

CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_user_id
  ON public.activity_logs (admin_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_support_messages_ticket_id
  ON public.admin_support_messages (ticket_id);

CREATE INDEX IF NOT EXISTS idx_admin_support_tickets_assigned_to
  ON public.admin_support_tickets (assigned_to);

CREATE INDEX IF NOT EXISTS idx_admin_support_tickets_guest_user_id
  ON public.admin_support_tickets (guest_user_id);

CREATE INDEX IF NOT EXISTS idx_announcements_created_by
  ON public.announcements (created_by);

CREATE INDEX IF NOT EXISTS idx_apartment_booking_segments_apartment_id
  ON public.apartment_booking_segments (apartment_id);

CREATE INDEX IF NOT EXISTS idx_apartment_features_apartment_id
  ON public.apartment_features (apartment_id);

CREATE INDEX IF NOT EXISTS idx_apartments_building_id
  ON public.apartments (building_id);

CREATE INDEX IF NOT EXISTS idx_cleaning_schedules_apartment_id
  ON public.cleaning_schedules (apartment_id);

CREATE INDEX IF NOT EXISTS idx_community_events_created_by
  ON public.community_events (created_by);

CREATE INDEX IF NOT EXISTS idx_deletion_audit_log_performed_by
  ON public.deletion_audit_log (performed_by);

CREATE INDEX IF NOT EXISTS idx_guest_invitations_booking_id
  ON public.guest_invitations (booking_id);

CREATE INDEX IF NOT EXISTS idx_guest_invitations_created_by
  ON public.guest_invitations (created_by);

CREATE INDEX IF NOT EXISTS idx_guest_invitations_used_by_user_id
  ON public.guest_invitations (used_by_user_id);

CREATE INDEX IF NOT EXISTS idx_local_content_created_by
  ON public.local_content (created_by);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_apartment_id
  ON public.maintenance_requests (apartment_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON public.messages (conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON public.messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
  ON public.password_reset_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_service_requests_guest_user_id
  ON public.service_requests (guest_user_id);

CREATE INDEX IF NOT EXISTS idx_service_requests_resolved_by
  ON public.service_requests (resolved_by);

CREATE INDEX IF NOT EXISTS idx_stay_extension_requests_apartment_id
  ON public.stay_extension_requests (apartment_id);

CREATE INDEX IF NOT EXISTS idx_stay_extension_requests_guest_user_id
  ON public.stay_extension_requests (guest_user_id);

CREATE INDEX IF NOT EXISTS idx_stay_extension_requests_reviewed_by
  ON public.stay_extension_requests (reviewed_by);
