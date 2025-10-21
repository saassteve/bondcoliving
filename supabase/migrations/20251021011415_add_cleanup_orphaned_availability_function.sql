/*
  # Add Function to Clean Up Orphaned Availability Records

  1. Problem
    - When iCal feeds are deleted manually (not through cascade function),
      availability blocks remain in the database
    - These orphaned blocks show as phantom bookings in calendars

  2. Solution
    - Create a function to identify and remove orphaned availability records
    - Orphaned = booking_reference exists but no matching feed exists
    
  3. Usage
    - Call cleanup_orphaned_availability() to remove all orphaned blocks
    - Call cleanup_orphaned_availability(apartment_id) to clean for specific apartment
*/

-- Function to clean up orphaned availability records
CREATE OR REPLACE FUNCTION cleanup_orphaned_availability(
  p_apartment_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count int;
  v_orphaned_feeds text[];
BEGIN
  -- Find all unique orphaned feed names
  SELECT array_agg(DISTINCT aa.booking_reference)
  INTO v_orphaned_feeds
  FROM apartment_availability aa
  WHERE aa.booking_reference IS NOT NULL
    AND aa.status = 'booked'
    AND (p_apartment_id IS NULL OR aa.apartment_id = p_apartment_id)
    AND NOT EXISTS (
      SELECT 1 FROM apartment_ical_feeds aif
      WHERE aif.feed_name = aa.booking_reference
        AND aif.apartment_id = aa.apartment_id
    );

  -- Delete orphaned availability records
  WITH deleted AS (
    DELETE FROM apartment_availability aa
    WHERE aa.booking_reference IS NOT NULL
      AND aa.status = 'booked'
      AND (p_apartment_id IS NULL OR aa.apartment_id = p_apartment_id)
      AND NOT EXISTS (
        SELECT 1 FROM apartment_ical_feeds aif
        WHERE aif.feed_name = aa.booking_reference
          AND aif.apartment_id = aa.apartment_id
      )
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'orphaned_feeds', COALESCE(v_orphaned_feeds, ARRAY[]::text[]),
    'message', format('Cleaned up %s orphaned availability records', v_deleted_count)
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_orphaned_availability TO authenticated;