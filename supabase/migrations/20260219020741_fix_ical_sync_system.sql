/*
  # Fix iCal Sync System

  1. Schema Changes
    - Add `updated_at` column to `apartment_ical_feeds` (was missing, causing trigger errors)
    - Add `timezone` column to `apartment_ical_feeds` for per-feed timezone support

  2. Function Cleanup
    - Drop old overloaded `sync_availability_from_ical(uuid, text)` that returns jsonb (naive date casting)
    - Drop old overloaded `compute_blocked_days_for_feed(uuid)` that returns jsonb (naive date casting)
    - Recreate the correct 3-param versions with improved error handling

  3. Security
    - Set search_path on all functions to prevent search_path injection
    - Functions use SECURITY DEFINER where needed

  4. Important Notes
    - The old 2-param functions used naive `dtstart_raw::date` casts which fail on iCal datetime formats like `20250105T090000Z`
    - The new functions properly parse iCal date/datetime formats with timezone handling
    - The sync function now uses booking_reference = feed_name consistently for traceability
*/

-- 1. Add missing columns to apartment_ical_feeds
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'apartment_ical_feeds' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE apartment_ical_feeds ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'apartment_ical_feeds' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE apartment_ical_feeds ADD COLUMN timezone text DEFAULT 'Atlantic/Madeira';
  END IF;
END $$;

-- 2. Drop the old ambiguous function overloads (the ones with wrong signatures)
DROP FUNCTION IF EXISTS sync_availability_from_ical(uuid, text);
DROP FUNCTION IF EXISTS compute_blocked_days_for_feed(uuid);

-- 3. Recreate compute_blocked_days_for_feed with proper signature and error handling
CREATE OR REPLACE FUNCTION compute_blocked_days_for_feed(
  p_apartment_id uuid,
  p_feed_name text,
  p_property_tz text DEFAULT 'Atlantic/Madeira'
)
RETURNS TABLE(date date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
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
      generate_series(n.start_day, n.end_day_exclusive - interval '1 day', interval '1 day')::date AS date
    FROM norm n
    WHERE n.end_day_exclusive > n.start_day
  ),
  windowed AS (
    SELECT r.date
    FROM rng r
    WHERE r.date >= CURRENT_DATE
      AND r.date < CURRENT_DATE + interval '36 months'
  )
  SELECT DISTINCT w.date
  FROM windowed w
  ORDER BY w.date;
END;
$$;

-- 4. Recreate sync_availability_from_ical with proper signature
CREATE OR REPLACE FUNCTION sync_availability_from_ical(
  p_apartment_id uuid,
  p_feed_name text,
  p_property_tz text DEFAULT 'Atlantic/Madeira'
)
RETURNS TABLE(dates_synced int, date_range_start date, date_range_end date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_min_date date;
  v_max_date date;
BEGIN
  DELETE FROM apartment_availability
  WHERE apartment_id = p_apartment_id
    AND booking_reference = p_feed_name;

  WITH blocked_days AS (
    SELECT bd.date
    FROM compute_blocked_days_for_feed(p_apartment_id, p_feed_name, p_property_tz) bd
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
    bd.date,
    'booked',
    p_feed_name,
    'Synced from ' || p_feed_name
  FROM blocked_days bd
  ON CONFLICT (apartment_id, date)
  DO UPDATE SET
    status = 'booked',
    booking_reference = EXCLUDED.booking_reference,
    notes = EXCLUDED.notes,
    updated_at = now();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  SELECT MIN(aa.date), MAX(aa.date)
  INTO v_min_date, v_max_date
  FROM apartment_availability aa
  WHERE aa.apartment_id = p_apartment_id
    AND aa.booking_reference = p_feed_name;

  RETURN QUERY SELECT v_count, v_min_date, v_max_date;
END;
$$;

-- 5. Fix get_or_create_export_token to have search_path set
CREATE OR REPLACE FUNCTION get_or_create_export_token(p_apartment_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
BEGIN
  SELECT export_token INTO v_token
  FROM apartment_ical_exports
  WHERE apartment_id = p_apartment_id AND is_active = true;

  IF v_token IS NULL THEN
    v_token := encode(gen_random_bytes(32), 'base64');
    v_token := replace(replace(replace(v_token, '/', '_'), '+', '-'), '=', '');

    INSERT INTO apartment_ical_exports (apartment_id, export_token)
    VALUES (p_apartment_id, v_token)
    ON CONFLICT (apartment_id)
    DO UPDATE SET
      export_token = EXCLUDED.export_token,
      is_active = true,
      updated_at = now();

    RETURN v_token;
  END IF;

  RETURN v_token;
END;
$$;

-- 6. Fix delete_ical_feed_cascade to have search_path set
CREATE OR REPLACE FUNCTION delete_ical_feed_cascade(p_feed_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_feed_record apartment_ical_feeds%ROWTYPE;
  v_availability_count int;
  v_events_count int;
BEGIN
  SELECT * INTO v_feed_record
  FROM apartment_ical_feeds
  WHERE id = p_feed_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Feed not found'
    );
  END IF;

  DELETE FROM apartment_availability
  WHERE apartment_id = v_feed_record.apartment_id
    AND booking_reference = v_feed_record.feed_name;

  GET DIAGNOSTICS v_availability_count = ROW_COUNT;

  DELETE FROM apartment_ical_events
  WHERE apartment_id = v_feed_record.apartment_id
    AND feed_name = v_feed_record.feed_name;

  GET DIAGNOSTICS v_events_count = ROW_COUNT;

  DELETE FROM apartment_ical_feeds
  WHERE id = p_feed_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Feed and all associated data deleted successfully',
    'feed_name', v_feed_record.feed_name,
    'availability_deleted', v_availability_count,
    'events_deleted', v_events_count
  );
END;
$$;
