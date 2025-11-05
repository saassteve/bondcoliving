/*
  # Fix booking_reference default value

  ## Problem
  The booking_reference column is NOT NULL but has no default value.
  The trigger only fires BEFORE INSERT, but if no value is provided,
  the insert fails before the trigger can run.

  ## Solution
  Add a default empty string so the trigger can always set the value.

  ## Changes
  - Alter booking_reference column to have default empty string
  - This ensures the trigger always has a chance to generate the reference
*/

ALTER TABLE coworking_bookings 
ALTER COLUMN booking_reference SET DEFAULT '';
