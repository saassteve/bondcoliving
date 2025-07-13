/*
  # Bond Coliving Database Schema

  1. New Tables
    - `apartments`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `price` (integer)
      - `size` (text)
      - `capacity` (text)
      - `image_url` (text)
      - `status` (text)
      - `sort_order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `apartment_features`
      - `id` (uuid, primary key)
      - `apartment_id` (uuid, foreign key)
      - `icon` (text)
      - `label` (text)
      - `sort_order` (integer)

    - `applications`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `arrival_date` (date)
      - `departure_date` (date)
      - `apartment_preference` (text)
      - `about` (text)
      - `heard_from` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `reviews`
      - `id` (uuid, primary key)
      - `text` (text)
      - `author` (text)
      - `rating` (integer)
      - `is_featured` (boolean)
      - `sort_order` (integer)
      - `created_at` (timestamp)

    - `feature_highlights`
      - `id` (uuid, primary key)
      - `icon` (text)
      - `title` (text)
      - `description` (text)
      - `sort_order` (integer)
      - `is_active` (boolean)
      - `created_at` (timestamp)

    - `site_settings`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (jsonb)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin users
    - Public read access for content tables
    - Secure write access for applications
*/

-- Create apartments table
CREATE TABLE IF NOT EXISTS apartments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL,
  size text NOT NULL,
  capacity text NOT NULL,
  image_url text NOT NULL,
  status text DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create apartment_features table
CREATE TABLE IF NOT EXISTS apartment_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  icon text NOT NULL,
  label text NOT NULL,
  sort_order integer DEFAULT 0
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  arrival_date date NOT NULL,
  departure_date date NOT NULL,
  apartment_preference text,
  about text NOT NULL,
  heard_from text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  author text NOT NULL,
  rating integer DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_featured boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create feature_highlights table
CREATE TABLE IF NOT EXISTS feature_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read policies for content
CREATE POLICY "Public can read apartments"
  ON apartments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can read apartment features"
  ON apartment_features FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can read reviews"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (is_featured = true);

CREATE POLICY "Public can read feature highlights"
  ON feature_highlights FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public can read site settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Application policies
CREATE POLICY "Anyone can create applications"
  ON applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

-- Admin policies (assuming admin role)
CREATE POLICY "Admins can manage apartments"
  ON apartments FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage apartment features"
  ON apartment_features FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage applications"
  ON applications FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage reviews"
  ON reviews FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage feature highlights"
  ON feature_highlights FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage site settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Insert sample data
INSERT INTO apartments (title, description, price, size, capacity, image_url, sort_order) VALUES
('The Loft', 'A unique split-level apartment with a cozy mezzanine sleeping area.', 1800, '55m²', '1-2', 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', 1),
('The Skyline', 'Our stunning top-floor apartment with a private roof terrace overlooking Funchal.', 1600, '45m²', '1-2', 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', 2),
('The Hub', 'An efficiently designed space perfect for the focused professional.', 1400, '35m²', '1', 'https://images.pexels.com/photos/439227/pexels-photo-439227.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', 3),
('The Haven', 'A serene and comfortable apartment with a perfect balance of work and relaxation.', 1500, '40m²', '1-2', 'https://images.pexels.com/photos/1743555/pexels-photo-1743555.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', 4);

-- Insert apartment features
DO $$
DECLARE
  loft_id uuid;
  skyline_id uuid;
  hub_id uuid;
  haven_id uuid;
BEGIN
  SELECT id INTO loft_id FROM apartments WHERE title = 'The Loft';
  SELECT id INTO skyline_id FROM apartments WHERE title = 'The Skyline';
  SELECT id INTO hub_id FROM apartments WHERE title = 'The Hub';
  SELECT id INTO haven_id FROM apartments WHERE title = 'The Haven';

  -- Loft features
  INSERT INTO apartment_features (apartment_id, icon, label, sort_order) VALUES
  (loft_id, 'Users', '1-2 people', 1),
  (loft_id, 'Stairs', 'Mezzanine bed', 2),
  (loft_id, 'Coffee', 'Full kitchen', 3),
  (loft_id, 'Bath', 'Private bath', 4);

  -- Skyline features
  INSERT INTO apartment_features (apartment_id, icon, label, sort_order) VALUES
  (skyline_id, 'Users', '1-2 people', 1),
  (skyline_id, 'Palmtree', 'Roof terrace', 2),
  (skyline_id, 'Coffee', 'Full kitchen', 3),
  (skyline_id, 'Sun', 'City views', 4);

  -- Hub features
  INSERT INTO apartment_features (apartment_id, icon, label, sort_order) VALUES
  (hub_id, 'Users', '1 person', 1),
  (hub_id, 'Laptop', 'Work space', 2),
  (hub_id, 'Coffee', 'Kitchenette', 3),
  (hub_id, 'Bath', 'Private bath', 4);

  -- Haven features
  INSERT INTO apartment_features (apartment_id, icon, label, sort_order) VALUES
  (haven_id, 'Users', '1-2 people', 1),
  (haven_id, 'Sofa', 'Reading nook', 2),
  (haven_id, 'Coffee', 'Full kitchen', 3),
  (haven_id, 'Bath', 'Private bath', 4);
END $$;

-- Insert sample reviews
INSERT INTO reviews (text, author, rating, sort_order) VALUES
('Everything was spotless and beautifully designed — it felt like a boutique hotel with soul.', 'Airbnb Guest', 5, 1),
('Fast Wi-Fi, comfy bed, and such a peaceful space. I got more done in a week here than I had in a month.', 'Airbnb Guest', 5, 2),
('Steven was an amazing host. Thoughtful touches everywhere.', 'Airbnb Guest', 5, 3);

-- Insert feature highlights
INSERT INTO feature_highlights (icon, title, description, sort_order) VALUES
('Home', 'Self-contained apartments', 'Your private sanctuary with everything you need, thoughtfully designed for comfort and productivity.', 1),
('Wifi', 'Utilities & fast Wi-Fi', 'All bills included with enterprise-grade internet perfect for remote work.', 2),
('Heart', 'Weekly laundry', 'Fresh linens and towels delivered weekly, because comfort shouldn''t be a luxury.', 3),
('Coffee', 'Indoor coworking', 'A dedicated workspace designed for focus, equipped with everything you need.', 4),
('Map', 'Central Funchal', 'Prime location with cafes, restaurants, and the ocean just steps away.', 5),
('Users', 'Shared values', 'A curated community of like-minded individuals who value independence and connection.', 6);

-- Insert site settings
INSERT INTO site_settings (key, value) VALUES
('hero_settings', '{"title": "Live. Work. Belong.", "subtitle": "Private apartments and shared coworking in Madeira. A space for people who value independence and community.", "background_image": "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1600"}'),
('contact_info', '{"email": "hello@bondcoliving.com", "location": "Funchal, Madeira"}');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_apartments_updated_at BEFORE UPDATE ON apartments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();