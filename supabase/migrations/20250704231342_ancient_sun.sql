/*
  # Add seventh feature highlight

  1. Changes
    - Add "Flexible stays" feature to make an even number of cards
    - This will improve the desktop grid layout

  2. Security
    - No changes to RLS policies
*/

-- Add the seventh feature highlight for better grid layout
INSERT INTO feature_highlights (icon, title, description, sort_order, is_active)
VALUES ('Calendar', 'Flexible stays', 'From one month to one year - stay as long as your journey requires.', 7, true)
ON CONFLICT DO NOTHING;