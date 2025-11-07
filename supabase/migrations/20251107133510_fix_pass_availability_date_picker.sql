/*
  # Fix Pass Availability to Allow Booking with Date Restrictions

  ## Overview
  This migration updates the availability check logic to distinguish between date picker restrictions
  and booking validation. When a pass has an available_from date, the frontend date picker will be
  restricted, but the booking itself won't be blocked if a valid date is selected.

  ## Changes

  ### Updated Functions
  - `check_pass_availability`: Modified to not return unavailable for dates before available_from
    - The available_from check now only provides information, not blocking
    - The date picker on frontend handles the restriction
    - Only capacity and schedule checks can block bookings

  ## Behavior
  - available_from dates are enforced by the frontend date picker min attribute
  - Backend validation focuses on capacity and schedule constraints
  - Users can still complete bookings once they select a valid date from the picker
*/

-- Update the check_pass_availability function to handle available_from as UI guidance, not blocking
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
    IF v_is_available THEN
      SELECT * INTO v_schedule
      FROM coworking_pass_availability_schedules
      WHERE pass_id = p_pass_id
        AND is_active = true
        AND p_check_date BETWEEN start_date AND end_date
      ORDER BY priority DESC, start_date ASC
      LIMIT 1;

      -- If schedules exist but none cover this date, pass is not available
      IF EXISTS (
        SELECT 1 FROM coworking_pass_availability_schedules
        WHERE pass_id = p_pass_id AND is_active = true
      ) AND NOT FOUND THEN
        v_is_available := false;
        v_reason := 'outside_schedule';

        -- Find next available schedule
        SELECT start_date INTO v_next_available_date
        FROM coworking_pass_availability_schedules
        WHERE pass_id = p_pass_id
          AND is_active = true
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
