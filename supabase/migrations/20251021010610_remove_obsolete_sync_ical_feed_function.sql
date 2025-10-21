/*
  # Remove Obsolete iCal Sync Function

  1. Purpose
    - Remove the old `sync_ical_feed` database function that was a placeholder
    - This function is no longer needed as iCal syncing is now handled by:
      - Edge Function: sync-ical (fetches and parses iCal feeds)
      - Postgres Function: compute_blocked_days_for_feed (timezone-aware date bucketing)
      - Postgres Function: sync_availability_from_ical (atomic delete + insert)
  
  2. Changes
    - Drop the obsolete `sync_ical_feed` function
    - Remove associated grants
  
  3. Safety
    - No frontend code uses this function
    - The new system is fully operational and separate
*/

-- Drop the obsolete placeholder function
DROP FUNCTION IF EXISTS sync_ical_feed(uuid);

-- Note: The function grant is automatically removed when the function is dropped