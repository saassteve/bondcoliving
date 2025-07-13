/*
  # Add apartment images table

  1. New Tables
    - `apartment_images`
      - `id` (uuid, primary key)
      - `apartment_id` (uuid, foreign key)
      - `image_url` (text)
      - `is_featured` (boolean)
      - `sort_order` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on apartment_images table
    - Add policies for admin management and public read access
*/

-- Create apartment_images table
CREATE TABLE IF NOT EXISTS apartment_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE apartment_images ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Public can read apartment images"
  ON apartment_images FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin management policy
CREATE POLICY "Authenticated admins can manage apartment images"
  ON apartment_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND is_active = true
    )
  );

-- Migrate existing apartment images to new table
INSERT INTO apartment_images (apartment_id, image_url, is_featured, sort_order)
SELECT id, image_url, true, 0
FROM apartments
WHERE image_url IS NOT NULL AND image_url != '';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_apartment_images_apartment_id ON apartment_images(apartment_id);
CREATE INDEX IF NOT EXISTS idx_apartment_images_featured ON apartment_images(apartment_id, is_featured);