/*
  # Fix Unindexed Foreign Keys

  Adds covering indexes for all foreign key columns that were flagged as
  missing indexes, to prevent sequential scans on JOINs and cascades.

  ## Tables affected
  - api_keys (created_by)
  - cleaning_schedules (created_by)
  - maintenance_requests (building_id, reported_by)
  - occupancy_analytics (booking_id, building_id)
  - tasks (created_by, related_apartment_id, related_booking_id, related_building_id)
*/

CREATE INDEX IF NOT EXISTS idx_api_keys_created_by
  ON api_keys(created_by);

CREATE INDEX IF NOT EXISTS idx_cleaning_schedules_created_by
  ON cleaning_schedules(created_by);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_building_id
  ON maintenance_requests(building_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_reported_by
  ON maintenance_requests(reported_by);

CREATE INDEX IF NOT EXISTS idx_occupancy_analytics_booking_id
  ON occupancy_analytics(booking_id);

CREATE INDEX IF NOT EXISTS idx_occupancy_analytics_building_id
  ON occupancy_analytics(building_id);

CREATE INDEX IF NOT EXISTS idx_tasks_created_by
  ON tasks(created_by);

CREATE INDEX IF NOT EXISTS idx_tasks_related_apartment_id
  ON tasks(related_apartment_id);

CREATE INDEX IF NOT EXISTS idx_tasks_related_booking_id
  ON tasks(related_booking_id);

CREATE INDEX IF NOT EXISTS idx_tasks_related_building_id
  ON tasks(related_building_id);
