/*
  # Add apartment availability dates

  1. Schema Changes
    - Add `available_from` column to apartments table (date)
    - Add `available_until` column to apartments table (date, nullable)
    - Add indexes for better query performance

  2. Security
    - No changes to RLS policies needed
    - Existing policies will cover the new columns

  3. Data Migration
    - Set default availability for existing apartments
*/

-- Add availability columns to apartments table
DO $$
BEGIN
  -- Add available_from column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'apartments' AND column_name = 'available_from'
  ) THEN
    ALTER TABLE apartments ADD COLUMN available_from date DEFAULT CURRENT_DATE;
  END IF;

  -- Add available_until column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'apartments' AND column_name = 'available_until'
  ) THEN
    ALTER TABLE apartments ADD COLUMN available_until date;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_apartments_availability 
ON apartments(available_from, available_until) 
WHERE status = 'available';

-- Update existing apartments to have availability from current date
UPDATE apartments 
SET available_from = CURRENT_DATE 
WHERE available_from IS NULL;

-- Add a comment to document the new columns
COMMENT ON COLUMN apartments.available_from IS 'Date when the apartment becomes available for booking';
COMMENT ON COLUMN apartments.available_until IS 'Optional date when the apartment is no longer available (null means indefinitely available)';