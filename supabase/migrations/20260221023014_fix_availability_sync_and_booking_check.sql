/*
  # Fix Availability Sync and Booking Availability Check

  ## Problem
  The frontend `checkAvailability` function only queries the `apartment_availability`
  table. However, some confirmed bookings were never backfilled into that table,
  causing those apartments to appear available to new customers even when booked.

  ## Changes

  ### 1. Backfill missing availability records
  Inserts 'booked' records into `apartment_availability` for every confirmed/checked_in
  booking that currently has no coverage in that table.

  ### 2. New RPC function: `check_apartment_available_for_dates`
  A fast, reliable function that checks BOTH sources of truth:
  - `bookings` table: confirmed/checked_in bookings overlapping the requested range
  - `apartment_availability` table: booked/blocked records in the range
  This is the authoritative check and is used by the frontend.

  ### 3. Trigger: `sync_booking_to_availability`
  Automatically keeps `apartment_availability` in sync whenever a booking's status
  changes to confirmed/checked_in, or when a booking is cancelled. This prevents
  the desync issue from recurring.

  ### 4. Security
  - RPC function granted to anon and authenticated (needed for public booking flow)
  - Trigger runs as SECURITY DEFINER to bypass RLS when writing availability records
*/

-- ============================================================
-- STEP 1: Backfill missing apartment_availability records
-- ============================================================
-- Generate a series of dates for each confirmed booking that has no availability records
INSERT INTO apartment_availability (apartment_id, date, status, booking_reference)
SELECT
  b.apartment_id,
  d::date AS date,
  'booked' AS status,
  b.booking_reference AS booking_reference
FROM bookings b
CROSS JOIN LATERAL generate_series(b.check_in_date, b.check_out_date - interval '1 day', interval '1 day') AS d
WHERE b.status IN ('confirmed', 'checked_in')
  AND b.check_out_date >= CURRENT_DATE
  AND NOT EXISTS (
    SELECT 1 FROM apartment_availability aa
    WHERE aa.apartment_id = b.apartment_id
      AND aa.date = d::date
      AND aa.status IN ('booked', 'blocked')
  )
ON CONFLICT (apartment_id, date)
DO UPDATE SET
  status = 'booked',
  booking_reference = EXCLUDED.booking_reference,
  updated_at = now()
WHERE apartment_availability.status = 'available';

-- ============================================================
-- STEP 2: Create authoritative availability check function
-- ============================================================
CREATE OR REPLACE FUNCTION check_apartment_available_for_dates(
  p_apartment_id uuid,
  p_check_in date,
  p_check_out date,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict_count integer;
BEGIN
  -- Check for overlapping confirmed/checked_in bookings
  SELECT COUNT(*) INTO v_conflict_count
  FROM bookings
  WHERE apartment_id = p_apartment_id
    AND status IN ('confirmed', 'checked_in')
    AND check_in_date < p_check_out
    AND check_out_date > p_check_in
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id);

  IF v_conflict_count > 0 THEN
    RETURN false;
  END IF;

  -- Check for booked/blocked dates in apartment_availability table
  SELECT COUNT(*) INTO v_conflict_count
  FROM apartment_availability
  WHERE apartment_id = p_apartment_id
    AND date >= p_check_in
    AND date < p_check_out
    AND status IN ('booked', 'blocked');

  RETURN v_conflict_count = 0;
END;
$$;

GRANT EXECUTE ON FUNCTION check_apartment_available_for_dates(uuid, date, date, uuid) TO authenticated, anon;

-- ============================================================
-- STEP 3: Trigger to keep apartment_availability in sync
-- ============================================================
CREATE OR REPLACE FUNCTION sync_booking_availability_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date date;
BEGIN
  -- When a booking becomes confirmed or checked_in, mark dates as booked
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE')
     AND NEW.status IN ('confirmed', 'checked_in')
     AND NEW.check_in_date IS NOT NULL
     AND NEW.check_out_date IS NOT NULL
  THEN
    -- Only sync if status changed to confirmed/checked_in (or new insert with that status)
    IF TG_OP = 'INSERT' OR OLD.status NOT IN ('confirmed', 'checked_in') THEN
      FOR v_date IN
        SELECT generate_series(NEW.check_in_date, NEW.check_out_date - interval '1 day', interval '1 day')::date
      LOOP
        INSERT INTO apartment_availability (apartment_id, date, status, booking_reference)
        VALUES (NEW.apartment_id, v_date, 'booked', NEW.booking_reference)
        ON CONFLICT (apartment_id, date)
        DO UPDATE SET
          status = 'booked',
          booking_reference = EXCLUDED.booking_reference,
          updated_at = now()
        WHERE apartment_availability.status = 'available';
      END LOOP;
    END IF;
  END IF;

  -- When a booking is cancelled, free up the dates
  IF TG_OP = 'UPDATE'
     AND NEW.status IN ('cancelled', 'no_show')
     AND OLD.status IN ('confirmed', 'checked_in')
  THEN
    UPDATE apartment_availability
    SET status = 'available',
        booking_reference = NULL,
        updated_at = now()
    WHERE apartment_id = NEW.apartment_id
      AND date >= NEW.check_in_date
      AND date < NEW.check_out_date
      AND booking_reference = NEW.booking_reference
      AND status = 'booked';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_booking_availability ON bookings;

CREATE TRIGGER trg_sync_booking_availability
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_booking_availability_on_status_change();
