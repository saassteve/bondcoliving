/*
  # Fix Availability Check - Handle Unassigned Record Properly

  ## Problem
  Even with v_schedule_found flag, we still access v_schedule.max_capacity
  when v_schedule_found is true, but v_schedule record is NULL/unassigned.
  
  The issue is that FOUND is true after SELECT INTO even if the record is NULL,
  we need to explicitly check for NULL values.

  ## Solution
  Store the schedule max_capacity in a separate variable during the SELECT,
  or use a different approach that doesn't require accessing record fields.
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
  v_schedule_max_capacity integer := NULL;
  v_schedule_found boolean := false;
  v_is_available boolean := true;
  v_reason text := 'available';
  v_next_available_date date := NULL;
  v_max_capacity integer := NULL;
  v_current_capacity integer := 0;
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
      -- Get schedule max_capacity directly to avoid record access issues
      SELECT max_capacity INTO v_schedule_max_capacity
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
      IF EXISTS (
        SELECT 1 FROM coworking_pass_availability_schedules
        WHERE pass_id = p_pass_id 
          AND is_active = true
          AND end_date >= CURRENT_DATE
      ) AND NOT v_schedule_found THEN
        v_is_available := false;
        v_reason := 'outside_schedule';

        -- Find next available schedule (that hasn't expired)
        SELECT start_date INTO v_next_available_date
        FROM coworking_pass_availability_schedules
        WHERE pass_id = p_pass_id
          AND is_active = true
          AND end_date >= CURRENT_DATE
          AND start_date > p_check_date
        ORDER BY start_date ASC
        LIMIT 1;
      END IF;
    END IF;
  END IF;

  -- Check capacity if enabled
  IF v_is_available AND v_pass.is_capacity_limited THEN
    -- Use schedule capacity if available, otherwise use pass capacity
    IF v_schedule_found AND v_schedule_max_capacity IS NOT NULL THEN
      v_max_capacity := v_schedule_max_capacity;
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
  'Checks if a coworking pass is available for booking on a specific date. Extracts only needed fields from schedule to avoid unassigned record errors.';
