/*
  # Configure Vault for Email Trigger

  ## Overview
  Sets up Supabase Vault to securely store the service role key needed by the
  email trigger function. Also configures database settings for Supabase URL.

  ## Changes
  1. Insert service role key into vault.secrets (encrypted storage)
  2. Configure database settings for Supabase URL and project ref
  3. Grant necessary permissions for vault access

  ## Security
  - Service role key is encrypted in vault
  - Only SECURITY DEFINER functions can access decrypted secrets
  - Database settings store non-sensitive configuration values

  ## Manual Steps Required
  After running this migration, you must manually insert the service role key:

  1. Go to Supabase Dashboard → SQL Editor
  2. Run this query (replace YOUR_SERVICE_ROLE_KEY with actual key):

     INSERT INTO vault.secrets (name, secret)
     VALUES (
       'supabase_service_role_key',
       'YOUR_SERVICE_ROLE_KEY_HERE'
     )
     ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;

  3. The key will be automatically encrypted by Supabase
*/

-- Ensure vault extension is available
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- Configure database settings for Supabase URL
-- Replace 'eaccyitssgrkrrqgdojy' with your actual project ref if different
DO $$
BEGIN
  -- Set the Supabase URL
  EXECUTE 'ALTER DATABASE postgres SET app.settings.supabase_url = ''https://eaccyitssgrkrrqgdojy.supabase.co''';

  -- Set the project reference for fallback URL construction
  EXECUTE 'ALTER DATABASE postgres SET app.settings.project_ref = ''eaccyitssgrkrrqgdojy''';

  RAISE NOTICE 'Database settings configured successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to set database settings: %', SQLERRM;
END $$;

-- Grant necessary permissions on vault schema
GRANT USAGE ON SCHEMA vault TO postgres, service_role;

-- Note: The actual service role key must be inserted manually via SQL Editor
-- This cannot be done automatically in migrations for security reasons
-- See the manual steps in the header comment above

-- Create a helper function to verify vault configuration
CREATE OR REPLACE FUNCTION check_vault_configuration()
RETURNS TABLE(
  setting_name text,
  is_configured boolean,
  note text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    'supabase_url'::text,
    (current_setting('app.settings.supabase_url', true) IS NOT NULL)::boolean,
    current_setting('app.settings.supabase_url', true)::text;

  RETURN QUERY
  SELECT
    'project_ref'::text,
    (current_setting('app.settings.project_ref', true) IS NOT NULL)::boolean,
    current_setting('app.settings.project_ref', true)::text;

  RETURN QUERY
  SELECT
    'service_role_key_in_vault'::text,
    EXISTS(SELECT 1 FROM vault.secrets WHERE name = 'supabase_service_role_key')::boolean,
    CASE
      WHEN EXISTS(SELECT 1 FROM vault.secrets WHERE name = 'supabase_service_role_key')
      THEN 'Secret exists in vault'
      ELSE 'SECRET NOT FOUND - Must be added manually'
    END::text;
END;
$$;

-- Grant execute permission on helper function
GRANT EXECUTE ON FUNCTION check_vault_configuration() TO postgres, authenticated, service_role;

-- Display configuration status
DO $$
DECLARE
  config_row RECORD;
BEGIN
  RAISE NOTICE '=== Vault Configuration Status ===';
  FOR config_row IN SELECT * FROM check_vault_configuration() LOOP
    RAISE NOTICE '% : % - %', config_row.setting_name, config_row.is_configured, config_row.note;
  END LOOP;
  RAISE NOTICE '===================================';
END $$;
