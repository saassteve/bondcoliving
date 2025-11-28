/*
  # Fix Availability Check Record Assignment Error

  ## Problem
  The `check_pass_availability` function throws error:
  "record v_schedule is not assigned yet"
  
  This happens when trying to access `v_schedule.id` when no schedule was found.
  In PostgreSQL, you cannot check properties of an unassigned RECORD variable.

  ## Solution
  Use FOUND variable to check if the SELECT INTO assigned a value, rather than
  checking v_schedule.id directly.

  ## Changes
  - Replace `v_schedule.id IS NOT NULL` with `v_schedule_found` boolean flag
  - Set flag based on FOUND after the SELECT INTO statement
  - This prevents accessing unassigned record properties
*/

CREATE OR REPLACE FUNCTION check_pass_availability(
  p_pass_id uuid,
  p_check_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_pass RECORD;
  v_schedule RECORD;
  v_schedule_found boolean := false;
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
      
      -- Store whether we found a schedule
      v_schedule_found := FOUND;

      -- If schedules exist (that haven't expired) but none cover this date, pass is not available
      -- This is the key fix: only check for non-expired schedules
      IF EXISTS (
        SELECT 1 FROM coworking_pass_availability_schedules
        WHERE pass_id = p_pass_id 
          AND is_active = true
          AND end_date >= CURRENT_DATE  -- Only count non-expired schedules
      ) AND NOT v_schedule_found THEN
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
      IF v_schedule_found AND v_schedule.max_capacity IS NOT NULL THEN
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

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION check_pass_availability(uuid, date) TO anon, authenticated;

COMMENT ON FUNCTION check_pass_availability(uuid, date) IS 
  'Checks if a coworking pass is available for booking on a specific date. Filters out expired schedules and uses boolean flag to safely check if schedule was found.';
