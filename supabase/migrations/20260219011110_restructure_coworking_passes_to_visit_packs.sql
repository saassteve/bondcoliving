/*
  # Restructure Coworking Passes - Visit Packs

  ## Summary
  Removes the daily pass and restructures the weekly pass into visit-based packages.

  ## Changes

  ### New Columns on coworking_passes
  - `visit_count` (integer, nullable) - Number of visits included in the pass (null = unlimited)
  - `expiry_months` (integer, nullable) - Months until pass expires from purchase date (null = no expiry)

  ### Pass Updates
  1. **Day Pass** - Deactivated (no longer shown publicly)
  2. **Weekly Pass** → renamed to **7 Visit Pack** - 7 visits, expires after 2 months
  3. **14 Visit Pack** - New pass, 14 visits, expires after 2 months
  4. **Monthly Hot Desk** → renamed to **Monthly Unlimited** - Unlimited visits for 30 days
  5. **Monthly Dedicated Desk** - Unchanged

  ### Pricing
  - 7 Visit Pack: keep existing price (€65)
  - 14 Visit Pack: new at €115
  - Monthly Unlimited: keep existing price (€160)
  - Dedicated Desk: unchanged (€199)
*/

-- Step 1: Add new columns to coworking_passes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coworking_passes' AND column_name = 'visit_count'
  ) THEN
    ALTER TABLE coworking_passes ADD COLUMN visit_count integer DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coworking_passes' AND column_name = 'expiry_months'
  ) THEN
    ALTER TABLE coworking_passes ADD COLUMN expiry_months integer DEFAULT NULL;
  END IF;
END $$;

-- Step 2: Deactivate the Day Pass
UPDATE coworking_passes
SET is_active = false
WHERE slug = 'day-pass';

-- Step 3: Update Weekly Pass → 7 Visit Pack
UPDATE coworking_passes
SET
  name = '7 Visit Pack',
  slug = '7-visit-pack',
  description = 'Flexible visits, use at your own pace',
  visit_count = 7,
  expiry_months = 2,
  features = '["7 individual visits", "Valid for 2 months from purchase", "Access to hot desks", "High-speed WiFi", "Coffee & tea"]'::jsonb,
  sort_order = 1
WHERE slug = 'weekly-pass';

-- Step 4: Insert 14 Visit Pack (only if it doesn't exist)
INSERT INTO coworking_passes (
  name, slug, price, duration_days, duration_type, description,
  visit_count, expiry_months, features, is_active, sort_order,
  current_capacity, is_capacity_limited, is_date_restricted
)
SELECT
  '14 Visit Pack',
  '14-visit-pack',
  115.00,
  60,
  'month',
  'Best value for regular visitors',
  14,
  2,
  '["14 individual visits", "Valid for 2 months from purchase", "Access to hot desks", "High-speed WiFi", "Coffee & tea"]'::jsonb,
  true,
  2,
  0,
  false,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM coworking_passes WHERE slug = '14-visit-pack'
);

-- Step 5: Update Monthly Hot Desk → Monthly Unlimited
UPDATE coworking_passes
SET
  name = 'Monthly Unlimited',
  slug = 'monthly-unlimited',
  description = 'Unlimited access for the whole month',
  visit_count = NULL,
  features = '["Unlimited visits for 30 days", "Access to hot desks", "High-speed WiFi", "Coffee & tea", "Mail handling"]'::jsonb,
  sort_order = 3
WHERE slug = 'monthly-hot-desk';

-- Step 6: Update Dedicated Desk sort order
UPDATE coworking_passes
SET sort_order = 4
WHERE slug = 'monthly-dedicated-desk';
