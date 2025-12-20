/*
  # Backfill Analytics Data and Add Automatic Triggers

  ## Purpose
  This migration populates the analytics tables with data from existing bookings
  and adds triggers to automatically update analytics when bookings change.

  ## Actions
  1. Backfill Data
    - Calls populate_revenue_analytics() to generate revenue data from bookings
    - Calls populate_occupancy_analytics() to generate occupancy data
    - Calls populate_booking_analytics() to generate booking metrics

  2. Create Triggers
    - Trigger on bookings table to update revenue_analytics
    - Trigger on bookings table to update occupancy_analytics
    - Trigger on coworking_bookings table for coworking revenue

  ## Notes
  - Safe to run multiple times (uses upsert logic)
  - Analytics will now auto-update as bookings are created/modified
*/

-- First, run the backfill functions to populate from existing data
DO $$
DECLARE
  revenue_result RECORD;
  occupancy_count INTEGER;
  booking_count INTEGER;
BEGIN
  -- Populate revenue analytics
  SELECT * INTO revenue_result FROM populate_revenue_analytics();
  RAISE NOTICE 'Revenue analytics: % records created, total revenue: %', 
    revenue_result.records_created, revenue_result.total_revenue;

  -- Populate occupancy analytics
  SELECT populate_occupancy_analytics() INTO occupancy_count;
  RAISE NOTICE 'Occupancy analytics: % records created', occupancy_count;

  -- Populate booking analytics
  SELECT populate_booking_analytics() INTO booking_count;
  RAISE NOTICE 'Booking analytics: % records created', booking_count;
END $$;

-- Create function to update analytics when a booking is created or updated
CREATE OR REPLACE FUNCTION update_booking_analytics_trigger()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_date date;
  v_building_id uuid;
BEGIN
  -- Get building_id from apartment
  SELECT building_id INTO v_building_id
  FROM apartments
  WHERE id = COALESCE(NEW.apartment_id, OLD.apartment_id);

  -- Handle INSERT or UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Only process paid, non-cancelled bookings
    IF NEW.payment_status = 'paid' AND NEW.status != 'cancelled' AND NEW.total_amount > 0 THEN
      -- Update revenue analytics for each day of the booking
      FOR v_date IN 
        SELECT generate_series::date
        FROM generate_series(NEW.check_in_date, NEW.check_out_date - interval '1 day', '1 day'::interval)
      LOOP
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
          v_building_id,
          NEW.apartment_id,
          'apartment',
          NEW.total_amount / GREATEST((NEW.check_out_date - NEW.check_in_date), 1),
          1,
          NEW.booking_source
        )
        ON CONFLICT (date, COALESCE(building_id, '00000000-0000-0000-0000-000000000000'::uuid), 
                     COALESCE(apartment_id, '00000000-0000-0000-0000-000000000000'::uuid), 
                     revenue_type, COALESCE(source, ''))
        DO UPDATE SET
          amount = revenue_analytics.amount + EXCLUDED.amount,
          booking_count = revenue_analytics.booking_count + 1;

        -- Update occupancy analytics
        INSERT INTO occupancy_analytics (
          date,
          apartment_id,
          building_id,
          is_occupied,
          booking_id
        ) VALUES (
          v_date,
          NEW.apartment_id,
          v_building_id,
          true,
          NEW.id
        )
        ON CONFLICT (date, COALESCE(apartment_id, '00000000-0000-0000-0000-000000000000'::uuid))
        DO UPDATE SET
          is_occupied = true,
          booking_id = EXCLUDED.booking_id;
      END LOOP;

      -- Update booking analytics aggregation
      INSERT INTO booking_analytics (
        date,
        booking_source,
        booking_type,
        count,
        total_revenue,
        average_length
      ) VALUES (
        NEW.check_in_date::date,
        NEW.booking_source,
        'apartment',
        1,
        NEW.total_amount,
        NEW.check_out_date - NEW.check_in_date
      )
      ON CONFLICT (date, booking_source, booking_type)
      DO UPDATE SET
        count = booking_analytics.count + 1,
        total_revenue = booking_analytics.total_revenue + EXCLUDED.total_revenue,
        average_length = (booking_analytics.average_length * booking_analytics.count + EXCLUDED.average_length) / (booking_analytics.count + 1);
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create function to update analytics for coworking bookings
CREATE OR REPLACE FUNCTION update_coworking_analytics_trigger()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_date date;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.payment_status = 'paid' AND NEW.booking_status != 'cancelled' AND NEW.total_amount > 0 THEN
      FOR v_date IN 
        SELECT generate_series::date
        FROM generate_series(NEW.start_date, NEW.end_date, '1 day'::interval)
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
          NEW.total_amount / GREATEST((NEW.end_date - NEW.start_date + 1), 1),
          1,
          'direct'
        )
        ON CONFLICT (date, COALESCE(building_id, '00000000-0000-0000-0000-000000000000'::uuid), 
                     COALESCE(apartment_id, '00000000-0000-0000-0000-000000000000'::uuid), 
                     revenue_type, COALESCE(source, ''))
        DO UPDATE SET
          amount = revenue_analytics.amount + EXCLUDED.amount,
          booking_count = revenue_analytics.booking_count + 1;
      END LOOP;

      INSERT INTO booking_analytics (
        date,
        booking_source,
        booking_type,
        count,
        total_revenue,
        average_length
      ) VALUES (
        NEW.start_date::date,
        'direct',
        'coworking',
        1,
        NEW.total_amount,
        NEW.end_date - NEW.start_date + 1
      )
      ON CONFLICT (date, booking_source, booking_type)
      DO UPDATE SET
        count = booking_analytics.count + 1,
        total_revenue = booking_analytics.total_revenue + EXCLUDED.total_revenue,
        average_length = (booking_analytics.average_length * booking_analytics.count + EXCLUDED.average_length) / (booking_analytics.count + 1);
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS booking_analytics_trigger ON bookings;
DROP TRIGGER IF EXISTS coworking_analytics_trigger ON coworking_bookings;

-- Create triggers on bookings table
CREATE TRIGGER booking_analytics_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_analytics_trigger();

-- Create triggers on coworking_bookings table
CREATE TRIGGER coworking_analytics_trigger
  AFTER INSERT OR UPDATE ON coworking_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_coworking_analytics_trigger();
