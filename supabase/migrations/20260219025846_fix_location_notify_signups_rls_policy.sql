/*
  # Fix always-true RLS policy on location_notify_signups

  1. Security Changes
    - Replace unrestricted INSERT policy with one that validates required fields
    - The old policy used `WITH CHECK (true)` which bypassed RLS entirely
    - New policy ensures email and building_slug are non-empty strings
    - Allows both anonymous and authenticated users to sign up (public form)

  2. Modified Policies
    - `Anyone can sign up for notifications` (INSERT) - now validates input data

  3. Important Notes
    - This is a public signup form so anon access is intentional
    - The constraint ensures only meaningful data is inserted
    - Admin SELECT policy remains unchanged
*/

DROP POLICY IF EXISTS "Anyone can sign up for notifications" ON public.location_notify_signups;

CREATE POLICY "Anyone can sign up for notifications"
  ON public.location_notify_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(trim(email)) > 0
    AND building_slug IS NOT NULL
    AND length(trim(building_slug)) > 0
  );
