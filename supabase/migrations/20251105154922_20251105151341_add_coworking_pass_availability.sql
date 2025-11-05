/*
  # Add Coworking Pass Availability and Capacity Management

  ## Overview
  This migration adds comprehensive availability and capacity management to coworking passes.
  Admins can now control when passes are available for booking and limit the number of concurrent passes.

  ## Changes to Existing Tables

  ### coworking_passes
  - `max_capacity` (integer, nullable) - Maximum number of this pass type that can be active at once
  - `current_capacity` (integer, default 0) - Current number of active passes of this type
  - `is_capacity_limited` (boolean, default false) - Whether capacity limits are enforced
  - `available_from` (date, nullable) - Date when pass becomes available for booking
  - `available_until` (date, nullable) - Date when pass stops being available for booking
  - `is_date_restricted` (boolean, default false) - Whether date restrictions are enforced

  ## New Tables

  ### coworking_pass_availability_schedules
  Creates complex availability schedules for passes (e.g., available Jan-Feb, then April-May)
  - `id` (uuid, primary key)
  - `pass_id` (uuid, foreign key to coworking_passes)
  - `schedule_name` (text) - Descriptive name for this schedule
  - `start_date` (date) - When this availability period starts
  - `end_date` (date) - When this availability period ends
  - `max_capacity` (integer, nullable) - Capacity override for this period
  - `priority` (integer, default 0) - Priority when schedules overlap (higher wins)
  - `is_active` (boolean, default true) - Whether this schedule is active
  - `notes` (text, nullable) - Admin notes about this schedule
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## New Functions

  ### check_pass_availability(pass_id, check_date)
  Checks if a pass is available for booking on a specific date

  ### get_pass_capacity(pass_id, start_date, end_date)
  Calculates available capacity for a pass during a date range

  ### update_pass_capacity()
  Trigger function to automatically update current_capacity when bookings change

  ## Security
  - RLS enabled on coworking_pass_availability_schedules table
  - Admin-only access for managing schedules
  - Public read access for checking availability

  ## Indexes
  - Index on pass_id and date ranges for performance
  - Index on is_active for filtering active schedules
*/

-- Add capacity and date availability columns to coworking_passes
DO $$
BEGIN
  -- Add max_capacity column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coworking_passes' AND column_name = 'max_capacity'
  ) THEN
    ALTER TABLE coworking_passes ADD COLUMN max_capacity integer;
    COMMENT ON COLUMN coworking_passes.max_capacity IS 'Maximum number of this pass type that can be active concurrently';
  END IF;

  -- Add current_capacity column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coworking_passes' AND column_name = 'current_capacity'
  ) THEN
    ALTER TABLE coworking_passes ADD COLUMN current_capacity integer DEFAULT 0 NOT NULL;
    COMMENT ON COLUMN coworking_passes.current_capacity IS 'Current number of active passes of this type';
  END IF;

  -- Add is_capacity_limited column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coworking_passes' AND column_name = 'is_capacity_limited'
  ) THEN
    ALTER TABLE coworking_passes ADD COLUMN is_capacity_limited boolean DEFAULT false NOT NULL;
    COMMENT ON COLUMN coworking_passes.is_capacity_limited IS 'Whether capacity limits are enforced for this pass';
  END IF;

  -- Add available_from column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coworking_passes' AND column_name = 'available_from'
  ) THEN
    ALTER TABLE coworking_passes ADD COLUMN available_from date;
    COMMENT ON COLUMN coworking_passes.available_from IS 'Date when pass becomes available for booking';
  END IF;

  -- Add available_until column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coworking_passes' AND column_name = 'available_until'
  ) THEN
    ALTER TABLE coworking_passes ADD COLUMN available_until date;
    COMMENT ON COLUMN coworking_passes.available_until IS 'Date when pass stops being available for booking';
  END IF;

  -- Add is_date_restricted column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coworking_passes' AND column_name = 'is_date_restricted'
  ) THEN
    ALTER TABLE coworking_passes ADD COLUMN is_date_restricted boolean DEFAULT false NOT NULL;
    COMMENT ON COLUMN coworking_passes.is_date_restricted IS 'Whether date restrictions are enforced for this pass';
  END IF;
END $$;

-- Create coworking_pass_availability_schedules table
CREATE TABLE IF NOT EXISTS coworking_pass_availability_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_id uuid NOT NULL REFERENCES coworking_passes(id) ON DELETE CASCADE,
  schedule_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  max_capacity integer,
  priority integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_capacity CHECK (max_capacity IS NULL OR max_capacity > 0)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_coworking_pass_availability_schedules_pass_id
  ON coworking_pass_availability_schedules(pass_id);

CREATE INDEX IF NOT EXISTS idx_coworking_pass_availability_schedules_dates
  ON coworking_pass_availability_schedules(start_date, end_date)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_coworking_pass_availability_schedules_active
  ON coworking_pass_availability_schedules(is_active)
  WHERE is_active = true;

-- Enable RLS
ALTER TABLE coworking_pass_availability_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coworking_pass_availability_schedules
CREATE POLICY "Public can view active schedules"
  ON coworking_pass_availability_schedules
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage schedules"
  ON coworking_pass_availability_schedules
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.email = (select auth.jwt() ->> 'email'::text)
    AND admin_users.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.email = (select auth.jwt() ->> 'email'::text)
    AND admin_users.is_active = true
  ));

-- Add updated_at trigger for schedules
DROP TRIGGER IF EXISTS update_coworking_pass_availability_schedules_updated_at
  ON coworking_pass_availability_schedules;

CREATE TRIGGER update_coworking_pass_availability_schedules_updated_at
  BEFORE UPDATE ON coworking_pass_availability_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check if a pass is available on a specific date
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
    -- Check simple date range first
    IF v_pass.available_from IS NOT NULL AND p_check_date < v_pass.available_from THEN
      v_is_available := false;
      v_reason := 'not_yet_available';
      v_next_available_date := v_pass.available_from;
    END IF;

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
      WHEN 'not_yet_available' THEN 'Pass not yet available'
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

-- Function to get available capacity for a date range
CREATE OR REPLACE FUNCTION get_pass_capacity(
  p_pass_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_pass RECORD;
  v_max_capacity integer := NULL;
  v_current_capacity integer := 0;
  v_available_capacity integer := NULL;
BEGIN
  -- Get pass details
  SELECT * INTO v_pass
  FROM coworking_passes
  WHERE id = p_pass_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'error', 'pass_not_found',
      'message', 'Pass not found or inactive'
    );
  END IF;

  -- Only calculate capacity if limits are enabled
  IF v_pass.is_capacity_limited AND v_pass.max_capacity IS NOT NULL THEN
    v_max_capacity := v_pass.max_capacity;

    -- Count bookings that overlap with the date range
    SELECT COUNT(*) INTO v_current_capacity
    FROM coworking_bookings
    WHERE pass_id = p_pass_id
      AND booking_status IN ('confirmed', 'active')
      AND NOT (end_date < p_start_date OR start_date > p_end_date);

    v_available_capacity := GREATEST(0, v_max_capacity - v_current_capacity);
  END IF;

  RETURN jsonb_build_object(
    'pass_id', p_pass_id,
    'max_capacity', v_max_capacity,
    'current_capacity', v_current_capacity,
    'available_capacity', v_available_capacity,
    'is_capacity_limited', v_pass.is_capacity_limited,
    'date_range', jsonb_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date
    )
  );
END;
$$;

-- Function to recalculate current capacity for all passes
CREATE OR REPLACE FUNCTION recalculate_pass_capacities()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE coworking_passes
  SET current_capacity = (
    SELECT COUNT(*)
    FROM coworking_bookings
    WHERE coworking_bookings.pass_id = coworking_passes.id
      AND coworking_bookings.booking_status IN ('confirmed', 'active')
      AND coworking_bookings.end_date >= CURRENT_DATE
  );
END;
$$;

-- Trigger function to update pass capacity when bookings change
CREATE OR REPLACE FUNCTION update_pass_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_pass_id uuid;
  v_capacity_change integer := 0;
BEGIN
  -- Determine which pass_id to update
  IF TG_OP = 'DELETE' THEN
    v_pass_id := OLD.pass_id;
  ELSE
    v_pass_id := NEW.pass_id;
  END IF;

  -- Recalculate capacity for the affected pass
  UPDATE coworking_passes
  SET current_capacity = (
    SELECT COUNT(*)
    FROM coworking_bookings
    WHERE pass_id = v_pass_id
      AND booking_status IN ('confirmed', 'active')
      AND end_date >= CURRENT_DATE
  )
  WHERE id = v_pass_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger to automatically update capacity
DROP TRIGGER IF EXISTS update_pass_capacity_on_booking ON coworking_bookings;

CREATE TRIGGER update_pass_capacity_on_booking
  AFTER INSERT OR UPDATE OR DELETE ON coworking_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_pass_capacity();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_pass_availability(uuid, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_pass_capacity(uuid, date, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION recalculate_pass_capacities() TO authenticated;

-- Initialize current_capacity for existing passes
UPDATE coworking_passes
SET current_capacity = (
  SELECT COUNT(*)
  FROM coworking_bookings
  WHERE coworking_bookings.pass_id = coworking_passes.id
    AND coworking_bookings.booking_status IN ('confirmed', 'active')
    AND coworking_bookings.end_date >= CURRENT_DATE
)
WHERE current_capacity = 0;