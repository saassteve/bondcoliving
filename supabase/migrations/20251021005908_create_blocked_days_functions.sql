/*
  # Create Postgres Functions for iCal Day Bucketing

  1. Functions
    - `compute_blocked_days_for_feed` - Converts raw iCal events to blocked dates
      Uses Postgres timezone handling with AT TIME ZONE
      Handles all-day events, UTC times, and TZID local times
      Returns distinct dates with exclusive end semantics
    
    - `sync_availability_from_ical` - Atomic delete + insert operation
      Removes old availability data for a feed
      Inserts new blocked dates computed from raw events
      Runs in a single transaction for consistency
  
  2. Timezone Handling
    - All-day events: Use DATE parsing directly
    - UTC times (ending in Z): Convert UTC to property timezone
    - TZID times: Use the specified timezone, fallback to property timezone
    - Exclusive end: Generate days up to but not including end day
  
  3. Date Filtering
    - Only returns dates from today forward
    - Limits to 24 months into the future
    - Automatically filters cancelled events
*/

-- Function to compute blocked days from raw events
CREATE OR REPLACE FUNCTION compute_blocked_days_for_feed(
  p_apartment_id uuid,
  p_feed_name text,
  p_property_tz text DEFAULT 'Europe/London'
) RETURNS TABLE (date date) 
LANGUAGE sql 
STABLE
AS $$
WITH base AS (
  SELECT *
  FROM apartment_ical_events
  WHERE apartment_id = p_apartment_id
    AND feed_name = p_feed_name
    AND COALESCE(UPPER(status), 'CONFIRMED') <> 'CANCELLED'
),
norm AS (
  SELECT
    uid,
    -- Start day bucket
    CASE
      WHEN dtstart_is_date THEN 
        to_date(substr(dtstart_raw, 1, 8), 'YYYYMMDD')
      WHEN right(dtstart_raw, 1) = 'Z' THEN
        ((to_timestamp(
          substr(dtstart_raw, 1, 4) || '-' || 
          substr(dtstart_raw, 5, 2) || '-' || 
          substr(dtstart_raw, 7, 2) || ' ' ||
          substr(dtstart_raw, 10, 2) || ':' ||
          substr(dtstart_raw, 12, 2) || ':' ||
          substr(dtstart_raw, 14, 2),
          'YYYY-MM-DD HH24:MI:SS'
        ) AT TIME ZONE 'UTC') AT TIME ZONE p_property_tz)::date
      ELSE
        -- TZID local datetime or floating time
        (to_timestamp(
          substr(dtstart_raw, 1, 4) || '-' || 
          substr(dtstart_raw, 5, 2) || '-' || 
          substr(dtstart_raw, 7, 2) || ' ' ||
          substr(dtstart_raw, 10, 2) || ':' ||
          substr(dtstart_raw, 12, 2) || ':' ||
          substr(dtstart_raw, 14, 2),
          'YYYY-MM-DD HH24:MI:SS'
        ) AT TIME ZONE COALESCE(dtstart_tzid, p_property_tz))::date
    END AS start_day,
    -- End day (exclusive semantics)
    CASE
      WHEN dtend_is_date THEN 
        to_date(substr(dtend_raw, 1, 8), 'YYYYMMDD')
      WHEN right(dtend_raw, 1) = 'Z' THEN
        ((to_timestamp(
          substr(dtend_raw, 1, 4) || '-' || 
          substr(dtend_raw, 5, 2) || '-' || 
          substr(dtend_raw, 7, 2) || ' ' ||
          substr(dtend_raw, 10, 2) || ':' ||
          substr(dtend_raw, 12, 2) || ':' ||
          substr(dtend_raw, 14, 2),
          'YYYY-MM-DD HH24:MI:SS'
        ) AT TIME ZONE 'UTC') AT TIME ZONE p_property_tz)::date
      ELSE
        (to_timestamp(
          substr(dtend_raw, 1, 4) || '-' || 
          substr(dtend_raw, 5, 2) || '-' || 
          substr(dtend_raw, 7, 2) || ' ' ||
          substr(dtend_raw, 10, 2) || ':' ||
          substr(dtend_raw, 12, 2) || ':' ||
          substr(dtend_raw, 14, 2),
          'YYYY-MM-DD HH24:MI:SS'
        ) AT TIME ZONE COALESCE(dtend_tzid, p_property_tz))::date
    END AS end_day_exclusive
  FROM base
),
rng AS (
  SELECT 
    generate_series(start_day, end_day_exclusive - interval '1 day', interval '1 day')::date AS date
  FROM norm
  WHERE end_day_exclusive > start_day
),
windowed AS (
  SELECT date 
  FROM rng
  WHERE date >= CURRENT_DATE
    AND date < CURRENT_DATE + interval '24 months'
)
SELECT DISTINCT date
FROM windowed
ORDER BY date;
$$;

-- Atomic function to sync availability from iCal events
CREATE OR REPLACE FUNCTION sync_availability_from_ical(
  p_apartment_id uuid,
  p_feed_name text,
  p_property_tz text DEFAULT 'Europe/London'
) RETURNS TABLE (
  dates_synced int,
  date_range_start date,
  date_range_end date
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int;
  v_min_date date;
  v_max_date date;
BEGIN
  -- Delete old availability records for this feed
  DELETE FROM apartment_availability
  WHERE apartment_id = p_apartment_id
    AND booking_reference = p_feed_name;

  -- Insert new blocked dates computed from raw events
  WITH blocked_days AS (
    SELECT date 
    FROM compute_blocked_days_for_feed(p_apartment_id, p_feed_name, p_property_tz)
  )
  INSERT INTO apartment_availability (
    apartment_id, 
    date, 
    status, 
    booking_reference, 
    notes
  )
  SELECT 
    p_apartment_id,
    date,
    'booked',
    p_feed_name,
    'Synced from ' || p_feed_name
  FROM blocked_days;

  -- Get stats for return
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  SELECT MIN(date), MAX(date)
  INTO v_min_date, v_max_date
  FROM apartment_availability
  WHERE apartment_id = p_apartment_id
    AND booking_reference = p_feed_name;

  RETURN QUERY SELECT v_count, v_min_date, v_max_date;
END;
$$;