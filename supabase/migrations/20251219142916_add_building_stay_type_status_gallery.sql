/*
  # Add Stay Type, Status, and Gallery to Buildings

  This migration extends the buildings table to support the multi-location 
  architecture with different stay types and coming-soon states.

  1. New Columns
    - `stay_type` (text) - Either 'short_term' or 'long_term' to indicate booking type
    - `status` (text) - Either 'active' or 'coming_soon' for location availability
    - `gallery_images` (jsonb) - Array of image URLs for bento gallery display
    - `hero_image_url` (text) - Primary hero image for the location page
    - `tagline` (text) - Short marketing tagline for the building

  2. Default Values
    - stay_type defaults to 'long_term' (existing behavior)
    - status defaults to 'active' (existing behavior)
    - gallery_images defaults to empty array

  3. Data Updates
    - Sets Carreira to 'long_term' and 'active'
    - Sets Sao Joao to 'long_term' and 'coming_soon'
    - Sets Pretas to 'short_term' and 'coming_soon'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'buildings' AND column_name = 'stay_type'
  ) THEN
    ALTER TABLE buildings ADD COLUMN stay_type text DEFAULT 'long_term';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'buildings' AND column_name = 'status'
  ) THEN
    ALTER TABLE buildings ADD COLUMN status text DEFAULT 'active';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'buildings' AND column_name = 'gallery_images'
  ) THEN
    ALTER TABLE buildings ADD COLUMN gallery_images jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'buildings' AND column_name = 'hero_image_url'
  ) THEN
    ALTER TABLE buildings ADD COLUMN hero_image_url text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'buildings' AND column_name = 'tagline'
  ) THEN
    ALTER TABLE buildings ADD COLUMN tagline text DEFAULT '';
  END IF;
END $$;

UPDATE buildings 
SET 
  stay_type = 'long_term',
  status = 'active',
  tagline = 'Our flagship coliving space with coworking on-site'
WHERE slug = 'carreira';

UPDATE buildings 
SET 
  stay_type = 'long_term',
  status = 'coming_soon',
  tagline = 'Monthly living in the heart of Funchal'
WHERE slug = 'sao_joao';

UPDATE buildings 
SET 
  stay_type = 'short_term',
  status = 'coming_soon',
  tagline = 'Short stays for digital nomads passing through'
WHERE slug = 'pretas';

ALTER TABLE buildings 
ADD CONSTRAINT buildings_stay_type_check 
CHECK (stay_type IN ('short_term', 'long_term'));

ALTER TABLE buildings 
ADD CONSTRAINT buildings_status_check 
CHECK (status IN ('active', 'coming_soon'));