/*
  # Multi-Building Support and Accommodation Types
  
  ## Overview
  This migration adds support for multiple Bond buildings (Carreira, São João, Pretas) 
  and distinguishes between short-term and long-term accommodations.
  
  ## 1. New Tables
  
  ### `buildings`
  Stores information about each Bond location
  - `id` (uuid, primary key) - Unique identifier
  - `slug` (text, unique) - URL-friendly identifier (carreira, sao_joao, pretas)
  - `name` (text) - Display name (Bond - Carreira, Bond - São João, Bond - Pretas)
  - `address` (text) - Full street address
  - `description` (text) - Building description
  - `has_on_site_coworking` (boolean) - Whether coworking is in this building
  - `check_in_instructions` (text) - Building-specific check-in details
  - `latitude` (numeric) - Map coordinates
  - `longitude` (numeric) - Map coordinates
  - `image_url` (text) - Building hero image
  - `sort_order` (integer) - Display ordering
  - `created_at` (timestamptz) - Timestamp
  - `updated_at` (timestamptz) - Timestamp
  
  ## 2. Apartments Table Updates
  
  ### New Fields
  - `building_id` (uuid) - Foreign key to buildings table
  - `accommodation_type` (text) - 'short_term' or 'long_term'
  - `nightly_price` (integer) - Price per night for short-term stays (nullable)
  - `minimum_stay_nights` (integer) - Minimum nights for short-term (default 2)
  - `minimum_stay_months` (integer) - Minimum months for long-term (default 1)
  
  Note: Existing `price` field will be used for long-term monthly rates
  
  ## 3. Security
  - Enable RLS on buildings table
  - Add policies for public read access to buildings
  - Add policies for authenticated admin access to manage buildings
  - Update apartments policies to include building_id in queries
  
  ## 4. Data Migration
  - Create default buildings (Carreira, São João, Pretas)
  - Set all existing apartments to Bond - Carreira with long_term type
*/

-- Create buildings table
CREATE TABLE IF NOT EXISTS buildings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  description text DEFAULT '',
  has_on_site_coworking boolean DEFAULT false,
  check_in_instructions text DEFAULT '',
  latitude numeric,
  longitude numeric,
  image_url text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on buildings
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

-- Buildings policies - public can view, admins can manage
CREATE POLICY "Buildings are viewable by everyone"
  ON buildings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated admins can insert buildings"
  ON buildings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated admins can update buildings"
  ON buildings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated admins can delete buildings"
  ON buildings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Add new columns to apartments table
DO $$
BEGIN
  -- Add building_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'apartments' AND column_name = 'building_id'
  ) THEN
    ALTER TABLE apartments ADD COLUMN building_id uuid REFERENCES buildings(id) ON DELETE SET NULL;
  END IF;

  -- Add accommodation_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'apartments' AND column_name = 'accommodation_type'
  ) THEN
    ALTER TABLE apartments ADD COLUMN accommodation_type text DEFAULT 'long_term' 
      CHECK (accommodation_type IN ('short_term', 'long_term'));
  END IF;

  -- Add nightly_price column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'apartments' AND column_name = 'nightly_price'
  ) THEN
    ALTER TABLE apartments ADD COLUMN nightly_price integer;
  END IF;

  -- Add minimum_stay_nights column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'apartments' AND column_name = 'minimum_stay_nights'
  ) THEN
    ALTER TABLE apartments ADD COLUMN minimum_stay_nights integer DEFAULT 2;
  END IF;

  -- Add minimum_stay_months column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'apartments' AND column_name = 'minimum_stay_months'
  ) THEN
    ALTER TABLE apartments ADD COLUMN minimum_stay_months integer DEFAULT 1;
  END IF;
END $$;

-- Insert default buildings
INSERT INTO buildings (slug, name, address, has_on_site_coworking, description, latitude, longitude, sort_order)
VALUES 
  (
    'carreira',
    'Bond - Carreira',
    'Rua da Carreira, Funchal, Madeira',
    true,
    'Our flagship location in the heart of Funchal with coworking space on-site. Perfect for digital nomads and remote workers.',
    32.6500,
    -16.9083,
    1
  ),
  (
    'sao_joao',
    'Bond - São João',
    'Rua de São João, Funchal, Madeira',
    false,
    'Long-term living in central Funchal with access to coworking at our Carreira location.',
    32.6485,
    -16.9095,
    2
  ),
  (
    'pretas',
    'Bond - Pretas',
    'Rua das Pretas, Funchal, Madeira',
    false,
    'Long-term accommodation in a peaceful setting with coworking access at Bond - Carreira.',
    32.6470,
    -16.9105,
    3
  )
ON CONFLICT (slug) DO NOTHING;

-- Set all existing apartments to Bond - Carreira (default building)
UPDATE apartments 
SET building_id = (SELECT id FROM buildings WHERE slug = 'carreira' LIMIT 1)
WHERE building_id IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_apartments_building_id ON apartments(building_id);
CREATE INDEX IF NOT EXISTS idx_apartments_accommodation_type ON apartments(accommodation_type);
CREATE INDEX IF NOT EXISTS idx_buildings_slug ON buildings(slug);