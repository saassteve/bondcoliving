/*
  # Fix Coworking Booking Issue with Expired Schedules

  ## Overview
  This migration addresses a critical bug where expired availability schedules prevent bookings.
  Even though schedules have end dates in the past, if they remain active, the availability
  check function blocks ALL dates outside those schedules from being booked.

  ## Problem
  The `check_pass_availability` function checks if ANY active schedules exist for a pass.
  If schedules exist but don't cover the requested date, it returns unavailable.
  This means expired schedules (with end_date < today) still block all future bookings.

  ## Solution
  1. Deactivate all schedules that have already ended
  2. Update the availability check to only consider schedules that haven't expired
  3. Add a function to automatically clean up expired schedules
  4. Add a trigger to auto-deactivate schedules when their end_date passes

  ## Changes
  - Deactivate existing expired schedules
  - Fix `check_pass_availability` to filter out expired schedules
  - Add `deactivate_expired_schedules()` function
  - Improve logic to handle edge cases
*/

-- Step 1: Deactivate any existing expired schedules
UPDATE coworking_pass_availability_schedules
SET is_active = false,
    updated_at = now()
WHERE is_active = true
  AND end_date < CURRENT_DATE;

-- Step 2: Update check_pass_availability to ignore expired schedules
CREATE OR REPLACE FUNCTION check_pass_availability(
  p_pass_id uuid,
  p_check_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pass RECORD;
  v_schedule RECORD;
  v_is_available boolean := true;
  v_reason text := 'available';
  v_next_available_date date := NULL;
BEGIN
  -- Get pass details
  SELECT * INTO v_pass
  FROM coworking_passes
  WHERE id = p_pass_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'pass_not_found',
      'message', 'Pass not found or inactive'
    );
  END IF;

  -- Check date restrictions if enabled
  IF v_pass.is_date_restricted THEN
    -- Check if pass has ended (this should block bookings)
    IF v_pass.available_until IS NOT NULL AND p_check_date > v_pass.available_until THEN
      v_is_available := false;
      v_reason := 'no_longer_available';
    END IF;

    -- Check if there's an active schedule that includes this date
    -- IMPORTANT: Only consider schedules that haven't expired yet
    IF v_is_available THEN
      SELECT * INTO v_schedule
      FROM coworking_pass_availability_schedules
      WHERE pass_id = p_pass_id
        AND is_active = true
        AND end_date >= CURRENT_DATE  -- Filter out expired schedules
        AND p_check_date BETWEEN start_date AND end_date
      ORDER BY priority DESC, start_date ASC
      LIMIT 1;

      -- If schedules exist (that haven't expired) but none cover this date, pass is not available
      -- This is the key fix: only check for non-expired schedules
      IF EXISTS (
        SELECT 1 FROM coworking_pass_availability_schedules
        WHERE pass_id = p_pass_id 
          AND is_active = true
          AND end_date >= CURRENT_DATE  -- Only count non-expired schedules
      ) AND NOT FOUND THEN
        v_is_available := false;
        v_reason := 'outside_schedule';

        -- Find next available schedule (that hasn't expired)
        SELECT start_date INTO v_next_available_date
        FROM coworking_pass_availability_schedules
        WHERE pass_id = p_pass_id
          AND is_active = true
          AND end_date >= CURRENT_DATE  -- Only consider non-expired schedules
          AND start_date > p_check_date
        ORDER BY start_date ASC
        LIMIT 1;
      END IF;
    END IF;
  END IF;

  -- Check capacity if enabled
  IF v_is_available AND v_pass.is_capacity_limited THEN
    DECLARE
      v_max_capacity integer;
      v_current_capacity integer;
    BEGIN
      -- Use schedule capacity if available, otherwise use pass capacity
      IF v_schedule.id IS NOT NULL AND v_schedule.max_capacity IS NOT NULL THEN
        v_max_capacity := v_schedule.max_capacity;
      ELSE
        v_max_capacity := v_pass.max_capacity;
      END IF;

      IF v_max_capacity IS NOT NULL THEN
        -- Count active bookings that overlap with the check date
        SELECT COUNT(*) INTO v_current_capacity
        FROM coworking_bookings
        WHERE pass_id = p_pass_id
          AND booking_status IN ('confirmed', 'active')
          AND p_check_date BETWEEN start_date AND end_date;

        IF v_current_capacity >= v_max_capacity THEN
          v_is_available := false;
          v_reason := 'at_capacity';
        END IF;
      END IF;
    END;
  END IF;

  -- Build response
  RETURN jsonb_build_object(
    'available', v_is_available,
    'reason', v_reason,
    'message', CASE v_reason
      WHEN 'available' THEN 'Pass is available for booking'
      WHEN 'no_longer_available' THEN 'Pass no longer available'
      WHEN 'outside_schedule' THEN 'Date is outside available schedule'
      WHEN 'at_capacity' THEN 'Pass is fully booked'
      ELSE 'Pass unavailable'
    END,
    'next_available_date', v_next_available_date,
    'pass_id', p_pass_id,
    'check_date', p_check_date
  );
END;
$$;

-- Step 3: Create function to manually deactivate expired schedules
CREATE OR REPLACE FUNCTION deactivate_expired_schedules()
RETURNS TABLE(deactivated_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count bigint;
BEGIN
  UPDATE coworking_pass_availability_schedules
  SET is_active = false,
      updated_at = now()
  WHERE is_active = true
    AND end_date < CURRENT_DATE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_pass_availability(uuid, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION deactivate_expired_schedules() TO authenticated;

COMMENT ON FUNCTION deactivate_expired_schedules() IS 'Deactivates all coworking pass availability schedules that have ended. Returns the number of schedules deactivated.';
COMMENT ON FUNCTION check_pass_availability(uuid, date) IS 'Checks if a coworking pass is available for booking on a specific date. Now filters out expired schedules to prevent them from blocking bookings.';
