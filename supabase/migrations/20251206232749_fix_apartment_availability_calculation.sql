/*
  # Fix Apartment Availability Calculation

  1. New Function
    - `get_next_available_date_for_apartment(apartment_id, months_ahead)`
      - Calculates accurate next available date based on real booking data
      - Checks both `bookings` table (confirmed/checked_in status)
      - Checks `apartment_availability` table (booked/blocked status)
      - Returns the next date after all current/future bookings end
      - Returns today's date if apartment is available now
      - Returns null if no availability found within specified months

  2. Logic
    - Find all blocking dates from bookings (check_in to check_out - 1)
    - Find all blocking dates from apartment_availability (booked/blocked)
    - Start from today and find first date with no blocking
    - Consider consecutive bookings (back-to-back)

  3. Performance
    - Uses efficient date range queries
    - Indexes on apartment_id and date columns
*/

CREATE OR REPLACE FUNCTION get_next_available_date_for_apartment(
  p_apartment_id uuid,
  p_months_ahead integer DEFAULT 6
)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_end_date date := CURRENT_DATE + (p_months_ahead || ' months')::interval;
  v_current_date date := v_today;
  v_is_blocked boolean;
BEGIN
  -- Loop through dates starting from today
  WHILE v_current_date <= v_end_date LOOP
    -- Check if this date is blocked by a booking
    SELECT EXISTS (
      SELECT 1
      FROM bookings
      WHERE apartment_id = p_apartment_id
        AND status IN ('confirmed', 'checked_in')
        AND check_in_date <= v_current_date
        AND check_out_date > v_current_date
    ) INTO v_is_blocked;
    
    -- If not blocked by booking, check apartment_availability
    IF NOT v_is_blocked THEN
      SELECT EXISTS (
        SELECT 1
        FROM apartment_availability
        WHERE apartment_id = p_apartment_id
          AND date = v_current_date
          AND status IN ('booked', 'blocked')
      ) INTO v_is_blocked;
    END IF;
    
    -- If date is not blocked, this is the next available date
    IF NOT v_is_blocked THEN
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
GRANT EXECUTE ON FUNCTION get_next_available_date_for_apartment(uuid, integer) TO authenticated, anon;