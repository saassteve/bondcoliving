/*
  # Add Cascade Delete Function for iCal Feeds

  1. Problem
    - When an iCal feed is deleted, the associated data remains:
      - Raw events in apartment_ical_events
      - Availability blocks in apartment_availability
    - This causes phantom blocks to persist in calendars

  2. Solution
    - Create a function to properly cascade delete all feed-related data
    - Delete availability blocks where booking_reference matches feed_name
    - Delete raw events where feed_name matches
    - Delete the feed itself

  3. Usage
    - Call delete_ical_feed_cascade(feed_id) to properly remove a feed and all its data
*/

-- Function to cascade delete an iCal feed and all its associated data
CREATE OR REPLACE FUNCTION delete_ical_feed_cascade(p_feed_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_feed_record apartment_ical_feeds%ROWTYPE;
  v_availability_count int;
  v_events_count int;
BEGIN
  -- Get the feed details before deletion
  SELECT * INTO v_feed_record
  FROM apartment_ical_feeds
  WHERE id = p_feed_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Feed not found'
    );
  END IF;
  
  -- Delete availability blocks that were created by this feed
  DELETE FROM apartment_availability
  WHERE apartment_id = v_feed_record.apartment_id
    AND booking_reference = v_feed_record.feed_name;
  
  GET DIAGNOSTICS v_availability_count = ROW_COUNT;
  
  -- Delete raw iCal events for this feed
  DELETE FROM apartment_ical_events
  WHERE apartment_id = v_feed_record.apartment_id
    AND feed_name = v_feed_record.feed_name;
  
  GET DIAGNOSTICS v_events_count = ROW_COUNT;
  
  -- Delete the feed itself
  DELETE FROM apartment_ical_feeds
  WHERE id = p_feed_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Feed and all associated data deleted successfully',
    'feed_name', v_feed_record.feed_name,
    'availability_deleted', v_availability_count,
    'events_deleted', v_events_count
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_ical_feed_cascade TO authenticated;