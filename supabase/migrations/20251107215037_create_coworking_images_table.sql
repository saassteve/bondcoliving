/*
  # Create Coworking Space Images Table

  1. New Table
    - `coworking_images`
      - `id` (uuid, primary key)
      - `image_url` (text, URL to the image)
      - `caption` (text, optional caption for the image)
      - `alt_text` (text, alt text for accessibility)
      - `sort_order` (integer, for ordering images)
      - `is_active` (boolean, whether image is displayed)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on the table
    - Allow public read access to active images
    - Allow admins to manage all images

  3. Indexes
    - Index on sort_order and is_active for fast queries
*/

-- Create coworking_images table
CREATE TABLE IF NOT EXISTS coworking_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  caption text,
  alt_text text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coworking_images ENABLE ROW LEVEL SECURITY;

-- RLS Policy for public read access (active images only)
CREATE POLICY "Public can read active coworking images"
  ON coworking_images
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- RLS Policy for admins to manage all images
CREATE POLICY "Admins can manage coworking images"
  ON coworking_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = (auth.jwt() ->> 'email') 
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = (auth.jwt() ->> 'email') 
      AND admin_users.is_active = true
    )
  );

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_coworking_images_active_sort 
  ON coworking_images(is_active, sort_order) 
  WHERE is_active = true;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_coworking_images_updated_at ON coworking_images;
CREATE TRIGGER update_coworking_images_updated_at
  BEFORE UPDATE ON coworking_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON coworking_images TO anon, authenticated;
GRANT ALL ON coworking_images TO authenticated;