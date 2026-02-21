/*
  # Add get_unavailable_dates_for_apartment function

  Creates an RPC function that returns all booked/blocked dates for an apartment
  by checking BOTH the bookings table and the apartment_availability table.
  This is the authoritative source for unavailable dates used by the split-stay finder.

  1. New function: `get_unavailable_dates_for_apartment`
    - Queries bookings table for confirmed/checked_in bookings in range
    - Queries apartment_availability table for booked/blocked records in range
    - Returns combined set of unavailable dates as an array of date strings

  2. Security
    - SECURITY DEFINER to bypass RLS for internal logic
    - Granted to authenticated and anon for the public booking flow
*/

CREATE OR REPLACE FUNCTION get_unavailable_dates_for_apartment(
  p_apartment_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE(unavailable_date date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    -- Dates blocked by confirmed bookings
    SELECT d::date
    FROM bookings b
    CROSS JOIN LATERAL generate_series(
      GREATEST(b.check_in_date, p_start_date),
      LEAST(b.check_out_date - interval '1 day', p_end_date - interval '1 day'),
      interval '1 day'
    ) AS d
    WHERE b.apartment_id = p_apartment_id
      AND b.status IN ('confirmed', 'checked_in')
      AND b.check_in_date < p_end_date
      AND b.check_out_date > p_start_date

    UNION

    -- Dates blocked in apartment_availability table
    SELECT aa.date
    FROM apartment_availability aa
    WHERE aa.apartment_id = p_apartment_id
      AND aa.date >= p_start_date
      AND aa.date < p_end_date
      AND aa.status IN ('booked', 'blocked');
END;
$$;

GRANT EXECUTE ON FUNCTION get_unavailable_dates_for_apartment(uuid, date, date) TO authenticated, anon;
