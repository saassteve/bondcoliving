/*
  # Drop Unused Indexes

  Removes all indexes flagged as unused by pg_stat_user_indexes.
  These indexes consume disk space and slow down writes without providing
  any query performance benefit. They can be recreated if usage patterns change.
*/

DROP INDEX IF EXISTS idx_announcement_reads_guest_user_id;
DROP INDEX IF EXISTS idx_announcements_created_by;
DROP INDEX IF EXISTS idx_community_events_created_by;
DROP INDEX IF EXISTS idx_guest_invitations_booking_id;
DROP INDEX IF EXISTS idx_guest_invitations_created_by;
DROP INDEX IF EXISTS idx_local_content_created_by;
DROP INDEX IF EXISTS idx_guest_invitations_used_by_user_id;
DROP INDEX IF EXISTS idx_service_requests_resolved_by;
DROP INDEX IF EXISTS idx_stay_extension_requests_apartment_id;
DROP INDEX IF EXISTS idx_stay_extension_requests_guest_user_id;
DROP INDEX IF EXISTS idx_stay_extension_requests_reviewed_by;
DROP INDEX IF EXISTS idx_coworking_pass_codes_is_used;
DROP INDEX IF EXISTS idx_apartment_images_apartment_id;
DROP INDEX IF EXISTS idx_apartments_availability;
DROP INDEX IF EXISTS idx_coworking_passes_active;
DROP INDEX IF EXISTS idx_coworking_bookings_dates;
DROP INDEX IF EXISTS idx_coworking_bookings_start_date;
DROP INDEX IF EXISTS idx_ical_events_apartment_feed;
DROP INDEX IF EXISTS idx_coworking_bookings_booking_status;
DROP INDEX IF EXISTS apartment_features_apartment_id_idx;
DROP INDEX IF EXISTS idx_coworking_payments_stripe_session;
DROP INDEX IF EXISTS idx_bookings_check_in_date;
DROP INDEX IF EXISTS idx_bookings_status;
DROP INDEX IF EXISTS idx_email_logs_recipient_email;
DROP INDEX IF EXISTS idx_email_logs_status;
DROP INDEX IF EXISTS idx_email_logs_resend_id;
DROP INDEX IF EXISTS idx_booking_segments_apartment;
DROP INDEX IF EXISTS idx_booking_segments_dates;
DROP INDEX IF EXISTS idx_apartment_payments_stripe_session;
DROP INDEX IF EXISTS idx_apartment_payments_stripe_intent;
DROP INDEX IF EXISTS idx_bookings_status_payment;
DROP INDEX IF EXISTS idx_bookings_expires_at;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_type;
DROP INDEX IF EXISTS idx_apartments_building_id;
DROP INDEX IF EXISTS idx_apartments_accommodation_type;
DROP INDEX IF EXISTS idx_buildings_slug;
DROP INDEX IF EXISTS idx_guest_users_access_dates;
DROP INDEX IF EXISTS idx_messages_conversation_id;
DROP INDEX IF EXISTS idx_messages_sender_id;
DROP INDEX IF EXISTS idx_conversation_participants_guest_user_id;
DROP INDEX IF EXISTS idx_event_rsvps_event_id;
DROP INDEX IF EXISTS idx_event_rsvps_guest_user_id;
DROP INDEX IF EXISTS idx_service_requests_guest_user_id;
DROP INDEX IF EXISTS idx_webhook_logs_event_type;
DROP INDEX IF EXISTS idx_webhook_logs_status;
DROP INDEX IF EXISTS idx_webhook_logs_event_id;
DROP INDEX IF EXISTS idx_password_reset_tokens_token_hash;
DROP INDEX IF EXISTS idx_password_reset_tokens_expires_at;
DROP INDEX IF EXISTS idx_password_reset_tokens_user_id;
DROP INDEX IF EXISTS idx_support_tickets_guest_user;
DROP INDEX IF EXISTS idx_support_tickets_assigned_to;
DROP INDEX IF EXISTS idx_support_messages_ticket;
DROP INDEX IF EXISTS idx_support_messages_sender;
DROP INDEX IF EXISTS idx_cleaning_preferences_guest_user;
DROP INDEX IF EXISTS idx_cleaning_preferences_next_date;
DROP INDEX IF EXISTS idx_deletion_audit_log_created_at;
DROP INDEX IF EXISTS idx_deletion_audit_log_performed_by;
DROP INDEX IF EXISTS idx_deletion_audit_log_target;
DROP INDEX IF EXISTS idx_revenue_analytics_building;
DROP INDEX IF EXISTS idx_revenue_analytics_apartment;
DROP INDEX IF EXISTS idx_booking_analytics_date;
DROP INDEX IF EXISTS idx_booking_analytics_source;
DROP INDEX IF EXISTS idx_occupancy_analytics_apartment;
DROP INDEX IF EXISTS idx_cleaning_schedules_status;
DROP INDEX IF EXISTS idx_cleaning_schedules_apartment;
DROP INDEX IF EXISTS idx_maintenance_requests_status;
DROP INDEX IF EXISTS idx_maintenance_requests_apartment;
DROP INDEX IF EXISTS idx_tasks_status;
DROP INDEX IF EXISTS idx_tasks_assigned_to;
DROP INDEX IF EXISTS idx_activity_logs_created_at;
DROP INDEX IF EXISTS idx_activity_logs_admin_user;
DROP INDEX IF EXISTS idx_email_queue_status;
DROP INDEX IF EXISTS idx_email_queue_next_retry;
DROP INDEX IF EXISTS idx_email_queue_booking;
DROP INDEX IF EXISTS idx_api_keys_key_hash;
DROP INDEX IF EXISTS idx_api_keys_is_active;
DROP INDEX IF EXISTS idx_api_request_logs_api_key_id;
DROP INDEX IF EXISTS idx_api_request_logs_requested_at;

-- Recreate the indexes that are actually critical for correctness/security
-- (api_keys key_hash lookup is used by the validate_api_key function on every request)
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_request_logs_api_key_id ON api_request_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_requested_at ON api_request_logs(requested_at DESC);
