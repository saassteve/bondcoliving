/*
  # Fix Available Now Logic - 14 Night Minimum

  1. Changes
    - Updates `get_next_available_date_for_apartment` function
    - Now checks for 14 consecutive available nights (minimum stay requirement)
    - Previously checked for just 1 available night
    - Returns date only if 14+ consecutive nights are available starting from that date

  2. Logic
    - Start from today and check each date
    - For each potential start date, verify next 14 days are all available
    - Check both bookings table (confirmed/checked_in status)
    - Check apartment_availability table (booked/blocked status)
    - Return first date where 14 consecutive nights are available
    - Return null if no 14-night window found within search period

  3. Business Rules
    - Minimum stay: 14 nights
    - "Available Now" badge only shows if apartment has 14+ consecutive nights available
    - More accurate representation of actual availability
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_next_available_date_for_apartment(uuid, integer);

-- Create updated function with 14-night minimum check
CREATE OR REPLACE FUNCTION get_next_available_date_for_apartment(
  p_apartment_id uuid,
  p_months_ahead integer DEFAULT 6,
  p_min_nights integer DEFAULT 14
)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_end_date date := CURRENT_DATE + (p_months_ahead || ' months')::interval;
  v_current_date date := v_today;
  v_check_date date;
  v_is_blocked boolean;
  v_consecutive_available integer;
BEGIN
  -- Loop through dates starting from today
  WHILE v_current_date <= v_end_date LOOP
    -- Reset consecutive counter
    v_consecutive_available := 0;
    
    -- Check if we can get p_min_nights consecutive available nights starting from v_current_date
    FOR i IN 0..(p_min_nights - 1) LOOP
      v_check_date := v_current_date + i;
      
      -- Check if this date is blocked by a booking
      SELECT EXISTS (
        SELECT 1
        FROM bookings
        WHERE apartment_id = p_apartment_id
          AND status IN ('confirmed', 'checked_in')
          AND check_in_date <= v_check_date
          AND check_out_date > v_check_date
      ) INTO v_is_blocked;
      
      -- If not blocked by booking, check apartment_availability
      IF NOT v_is_blocked THEN
        SELECT EXISTS (
          SELECT 1
          FROM apartment_availability
          WHERE apartment_id = p_apartment_id
            AND date = v_check_date
            AND status IN ('booked', 'blocked')
        ) INTO v_is_blocked;
      END IF;
      
      -- If any day in the range is blocked, break out of this check
      IF v_is_blocked THEN
        EXIT;
      END IF;
      
      -- Increment consecutive available counter
      v_consecutive_available := v_consecutive_available + 1;
    END LOOP;
    
    -- If we found enough consecutive available nights, return this date
    IF v_consecutive_available >= p_min_nights THEN
      RETURN v_current_date;
    END IF;
    
    -- Move to next date
    v_current_date := v_current_date + 1;
  END LOOP;
  
  -- No availability found within the time window
  RETURN NULL;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_next_available_date_for_apartment(uuid, integer, integer) TO authenticated, anon;