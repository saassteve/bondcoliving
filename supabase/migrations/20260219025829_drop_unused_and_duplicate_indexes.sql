/*
  # Drop unused and duplicate indexes

  1. Dropped Unused Indexes (14 total)
    - `idx_api_keys_is_active` on api_keys - never queried
    - `idx_api_request_logs_requested_at` on api_request_logs - never queried
    - `idx_api_keys_created_by` on api_keys - never queried
    - `idx_cleaning_schedules_created_by` on cleaning_schedules - never queried
    - `idx_maintenance_requests_building_id` on maintenance_requests - never queried
    - `idx_maintenance_requests_reported_by` on maintenance_requests - never queried
    - `idx_occupancy_analytics_booking_id` on occupancy_analytics - never queried
    - `idx_occupancy_analytics_building_id` on occupancy_analytics - never queried
    - `idx_tasks_created_by` on tasks - never queried
    - `idx_tasks_related_apartment_id` on tasks - never queried
    - `idx_tasks_related_booking_id` on tasks - never queried
    - `idx_tasks_related_building_id` on tasks - never queried

  2. Dropped Duplicate Index (1)
    - `idx_api_keys_key_hash` on api_keys - duplicate of unique constraint index `api_keys_key_hash_key`

  3. Important Notes
    - These indexes have zero usage according to pg_stat_user_indexes
    - Removing them reduces write overhead and storage
    - If any become needed later, they can be recreated
*/

DROP INDEX IF EXISTS public.idx_api_keys_is_active;
DROP INDEX IF EXISTS public.idx_api_request_logs_requested_at;
DROP INDEX IF EXISTS public.idx_api_keys_created_by;
DROP INDEX IF EXISTS public.idx_cleaning_schedules_created_by;
DROP INDEX IF EXISTS public.idx_maintenance_requests_building_id;
DROP INDEX IF EXISTS public.idx_maintenance_requests_reported_by;
DROP INDEX IF EXISTS public.idx_occupancy_analytics_booking_id;
DROP INDEX IF EXISTS public.idx_occupancy_analytics_building_id;
DROP INDEX IF EXISTS public.idx_tasks_created_by;
DROP INDEX IF EXISTS public.idx_tasks_related_apartment_id;
DROP INDEX IF EXISTS public.idx_tasks_related_booking_id;
DROP INDEX IF EXISTS public.idx_tasks_related_building_id;

DROP INDEX IF EXISTS public.idx_api_keys_key_hash;
