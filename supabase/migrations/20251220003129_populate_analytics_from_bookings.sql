/*
  # Populate Analytics from Existing Bookings

  This migration creates functions to populate analytics tables from existing booking data.

  1. Functions Created
    - `populate_revenue_analytics()` - Generates revenue analytics from apartment and coworking bookings
    - `populate_occupancy_analytics()` - Generates occupancy data for each date with active bookings
    - `populate_booking_analytics()` - Generates booking source and type analytics

  2. Usage
    - These functions can be called to backfill analytics data from existing bookings
    - They are safe to run multiple times (uses upsert logic)
    - Useful for initial data population and periodic refresh
*/

-- Function to populate revenue analytics from apartment bookings
CREATE OR REPLACE FUNCTION populate_revenue_analytics()
RETURNS TABLE(
  records_created integer,
  total_revenue numeric
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_records_created integer := 0;
  v_total_revenue numeric := 0;
  v_booking record;
  v_date date;
BEGIN
  -- Process apartment bookings
  FOR v_booking IN 
    SELECT 
      b.id,
      b.apartment_id,
      b.check_in_date,
      b.check_out_date,
      b.total_amount,
      b.booking_source,
      b.payment_status,
      a.building_id
    FROM bookings b
    JOIN apartments a ON a.id = b.apartment_id
    WHERE b.payment_status = 'paid'
      AND b.status NOT IN ('cancelled')
      AND b.total_amount > 0
  LOOP
    -- Generate a record for each day of the booking
    FOR v_date IN 
      SELECT generate_series::date
      FROM generate_series(v_booking.check_in_date, v_booking.check_out_date - interval '1 day', '1 day'::interval)
    LOOP
      -- Calculate daily revenue (split total across days)
      INSERT INTO revenue_analytics (
        date,
        building_id,
        apartment_id,
        revenue_type,
        amount,
        booking_count,
        source
      ) VALUES (
        v_date,
        v_booking.building_id,
        v_booking.apartment_id,
        'apartment',
        v_booking.total_amount / GREATEST((v_booking.check_out_date - v_booking.check_in_date), 1),
        1,
        v_booking.booking_source
      )
      ON CONFLICT (date, COALESCE(building_id, '00000000-0000-0000-0000-000000000000'::uuid), 
                   COALESCE(apartment_id, '00000000-0000-0000-0000-000000000000'::uuid), 
                   revenue_type, COALESCE(source, ''))
      DO UPDATE SET
        amount = revenue_analytics.amount + EXCLUDED.amount,
        booking_count = revenue_analytics.booking_count + 1;
      
      v_records_created := v_records_created + 1;
      v_total_revenue := v_total_revenue + (v_booking.total_amount / GREATEST((v_booking.check_out_date - v_booking.check_in_date), 1));
    END LOOP;
  END LOOP;

  -- Process coworking bookings
  FOR v_booking IN 
    SELECT 
      id,
      start_date,
      end_date,
      total_amount,
      payment_status
    FROM coworking_bookings
    WHERE payment_status = 'paid'
      AND booking_status NOT IN ('cancelled')
      AND total_amount > 0
  LOOP
    FOR v_date IN 
      SELECT generate_series::date
      FROM generate_series(v_booking.start_date, v_booking.end_date, '1 day'::interval)
    LOOP
      INSERT INTO revenue_analytics (
        date,
        revenue_type,
        amount,
        booking_count,
        source
      ) VALUES (
        v_date,
        'coworking',
        v_booking.total_amount / GREATEST((v_booking.end_date - v_booking.start_date + 1), 1),
        1,
        'direct'
      )
      ON CONFLICT (date, COALESCE(building_id, '00000000-0000-0000-0000-000000000000'::uuid), 
                   COALESCE(apartment_id, '00000000-0000-0000-0000-000000000000'::uuid), 
                   revenue_type, COALESCE(source, ''))
      DO UPDATE SET
        amount = revenue_analytics.amount + EXCLUDED.amount,
        booking_count = revenue_analytics.booking_count + 1;
      
      v_records_created := v_records_created + 1;
      v_total_revenue := v_total_revenue + (v_booking.total_amount / GREATEST((v_booking.end_date - v_booking.start_date + 1), 1));
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT v_records_created, v_total_revenue;
END;
$$;

-- Function to populate occupancy analytics
CREATE OR REPLACE FUNCTION populate_occupancy_analytics()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_records_created integer := 0;
  v_booking record;
  v_date date;
BEGIN
  FOR v_booking IN 
    SELECT 
      b.id,
      b.apartment_id,
      b.check_in_date,
      b.check_out_date,
      a.building_id
    FROM bookings b
    JOIN apartments a ON a.id = b.apartment_id
    WHERE b.status NOT IN ('cancelled')
  LOOP
    FOR v_date IN 
      SELECT generate_series::date
      FROM generate_series(v_booking.check_in_date, v_booking.check_out_date - interval '1 day', '1 day'::interval)
    LOOP
      INSERT INTO occupancy_analytics (
        date,
        apartment_id,
        building_id,
        is_occupied,
        booking_id
      ) VALUES (
        v_date,
        v_booking.apartment_id,
        v_booking.building_id,
        true,
        v_booking.id
      )
      ON CONFLICT (date, COALESCE(apartment_id, '00000000-0000-0000-0000-000000000000'::uuid))
      DO UPDATE SET
        is_occupied = true,
        booking_id = EXCLUDED.booking_id;
      
      v_records_created := v_records_created + 1;
    END LOOP;
  END LOOP;

  RETURN v_records_created;
END;
$$;

-- Function to populate booking analytics
CREATE OR REPLACE FUNCTION populate_booking_analytics()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_records_created integer := 0;
  v_rows integer;
BEGIN
  -- Aggregate apartment bookings by date and source
  INSERT INTO booking_analytics (
    date,
    booking_source,
    booking_type,
    count,
    total_revenue,
    average_length
  )
  SELECT 
    b.check_in_date::date as date,
    b.booking_source,
    'apartment' as booking_type,
    COUNT(*) as count,
    SUM(b.total_amount) as total_revenue,
    AVG(b.check_out_date - b.check_in_date) as average_length
  FROM bookings b
  WHERE b.payment_status = 'paid'
    AND b.status NOT IN ('cancelled')
  GROUP BY b.check_in_date::date, b.booking_source
  ON CONFLICT (date, booking_source, booking_type)
  DO UPDATE SET
    count = EXCLUDED.count,
    total_revenue = EXCLUDED.total_revenue,
    average_length = EXCLUDED.average_length;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_records_created := v_rows;

  -- Aggregate coworking bookings
  INSERT INTO booking_analytics (
    date,
    booking_source,
    booking_type,
    count,
    total_revenue,
    average_length
  )
  SELECT 
    cb.start_date::date as date,
    'direct' as booking_source,
    'coworking' as booking_type,
    COUNT(*) as count,
    SUM(cb.total_amount) as total_revenue,
    AVG(cb.end_date - cb.start_date + 1) as average_length
  FROM coworking_bookings cb
  WHERE cb.payment_status = 'paid'
    AND cb.booking_status NOT IN ('cancelled')
  GROUP BY cb.start_date::date
  ON CONFLICT (date, booking_source, booking_type)
  DO UPDATE SET
    count = EXCLUDED.count,
    total_revenue = EXCLUDED.total_revenue,
    average_length = EXCLUDED.average_length;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_records_created := v_records_created + v_rows;

  RETURN v_records_created;
END;
$$;

-- Add unique constraint for proper upsert behavior
ALTER TABLE revenue_analytics 
DROP CONSTRAINT IF EXISTS revenue_analytics_date_building_id_apartment_id_revenue_ty_key;

CREATE UNIQUE INDEX IF NOT EXISTS revenue_analytics_unique_idx 
ON revenue_analytics (
  date, 
  COALESCE(building_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(apartment_id, '00000000-0000-0000-0000-000000000000'::uuid),
  revenue_type,
  COALESCE(source, '')
);

-- Add unique constraint for occupancy analytics
CREATE UNIQUE INDEX IF NOT EXISTS occupancy_analytics_unique_idx 
ON occupancy_analytics (
  date, 
  COALESCE(apartment_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Add unique constraint for booking analytics
CREATE UNIQUE INDEX IF NOT EXISTS booking_analytics_unique_idx 
ON booking_analytics (date, booking_source, booking_type);
