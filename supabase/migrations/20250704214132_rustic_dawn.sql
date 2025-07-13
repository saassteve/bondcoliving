/*
  # Add The Pod apartment

  1. Changes
    - Insert "The Pod" as the first apartment (sort_order 0)
    - Update existing apartments' sort_order to accommodate the new first apartment
    - Add features for The Pod apartment

  2. New Apartment Details
    - The Pod: A compact, efficient studio perfect for solo professionals
    - Price: €1200/month
    - Size: 25m²
    - Capacity: 1 person
    - Features: Compact design, Murphy bed, Work nook, Kitchenette
*/

-- Update existing apartments' sort_order to make room for The Pod
UPDATE apartments SET sort_order = sort_order + 1;

-- Insert The Pod as the first apartment
INSERT INTO apartments (title, description, price, size, capacity, image_url, sort_order, status) VALUES
('The Pod', 'A brilliantly designed compact studio that maximizes every square meter. Perfect for the minimalist professional who values efficiency and style.', 1200, '25m²', '1', 'https://images.pexels.com/photos/2029667/pexels-photo-2029667.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', 0, 'available');

-- Add features for The Pod
DO $$
DECLARE
  pod_id uuid;
BEGIN
  SELECT id INTO pod_id FROM apartments WHERE title = 'The Pod';

  -- Pod features
  INSERT INTO apartment_features (apartment_id, icon, label, sort_order) VALUES
  (pod_id, 'Users', '1 person', 1),
  (pod_id, 'Home', 'Murphy bed', 2),
  (pod_id, 'Laptop', 'Work nook', 3),
  (pod_id, 'Coffee', 'Kitchenette', 4);
END $$;

-- Add main image to apartment_images table for The Pod
DO $$
DECLARE
  pod_id uuid;
BEGIN
  SELECT id INTO pod_id FROM apartments WHERE title = 'The Pod';
  
  INSERT INTO apartment_images (apartment_id, image_url, is_featured, sort_order) VALUES
  (pod_id, 'https://images.pexels.com/photos/2029667/pexels-photo-2029667.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', true, 0);
END $$;