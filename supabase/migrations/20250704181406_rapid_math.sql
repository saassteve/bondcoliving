/*
  # Update Feature Highlights

  1. Changes
    - Replace "Shared values" feature with "Weekly cleaning"
    - Update the description to be more specific about the cleaning service

  2. Security
    - No changes to RLS policies
*/

-- Update the "Shared values" feature to "Weekly cleaning"
UPDATE feature_highlights 
SET 
  icon = 'Heart',
  title = 'Weekly cleaning',
  description = 'Fresh linens, spotless spaces, and restocked essentials delivered weekly.'
WHERE title = 'Shared values' OR title LIKE '%values%' OR title LIKE '%community%';

-- If the above doesn't find the record, insert it as a new feature
INSERT INTO feature_highlights (icon, title, description, sort_order, is_active)
SELECT 'Heart', 'Weekly cleaning', 'Fresh linens, spotless spaces, and restocked essentials delivered weekly.', 6, true
WHERE NOT EXISTS (
  SELECT 1 FROM feature_highlights 
  WHERE title = 'Weekly cleaning'
);

-- Ensure we don't have duplicate cleaning-related features
DELETE FROM feature_highlights 
WHERE title = 'Weekly laundry' 
AND EXISTS (SELECT 1 FROM feature_highlights WHERE title = 'Weekly cleaning');