/*
  # Create Promotion Banners Table

  ## Overview
  Creates a table to manage promotional banners that appear at the top of the website.
  Admins can create, edit, and schedule banners with custom styling.

  ## New Tables
  - `promotion_banners`
    - `id` (uuid, primary key)
    - `title` (text) - Short title for admin reference
    - `message` (text) - The message to display
    - `is_active` (boolean) - Whether banner is currently active
    - `start_date` (timestamptz) - When to start showing banner (optional)
    - `end_date` (timestamptz) - When to stop showing banner (optional)
    - `background_color` (text) - Hex color for background
    - `text_color` (text) - Hex color for text
    - `link_url` (text) - Optional link URL
    - `link_text` (text) - Optional link text
    - `sort_order` (integer) - Display order (lower first)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on `promotion_banners` table
  - Public can view active banners within date range
  - Only authenticated admins can create/update/delete banners
*/

-- Create promotion_banners table
CREATE TABLE IF NOT EXISTS promotion_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL,
  background_color text NOT NULL DEFAULT '#1E1F1E',
  text_color text NOT NULL DEFAULT '#FFFFFF',
  link_url text DEFAULT NULL,
  link_text text DEFAULT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE promotion_banners ENABLE ROW LEVEL SECURITY;

-- Public can view active banners within their date range
CREATE POLICY "Anyone can view active promotion banners"
  ON promotion_banners
  FOR SELECT
  TO public
  USING (
    is_active = true
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

-- Authenticated users can view all banners (for admin panel)
CREATE POLICY "Authenticated users can view all promotion banners"
  ON promotion_banners
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert banners
CREATE POLICY "Authenticated users can create promotion banners"
  ON promotion_banners
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update banners
CREATE POLICY "Authenticated users can update promotion banners"
  ON promotion_banners
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete banners
CREATE POLICY "Authenticated users can delete promotion banners"
  ON promotion_banners
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for efficient querying of active banners
CREATE INDEX IF NOT EXISTS idx_promotion_banners_active 
  ON promotion_banners(is_active, start_date, end_date, sort_order);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_promotion_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_promotion_banners_updated_at
  BEFORE UPDATE ON promotion_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_promotion_banners_updated_at();

-- Grant permissions
GRANT SELECT ON promotion_banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON promotion_banners TO authenticated;
