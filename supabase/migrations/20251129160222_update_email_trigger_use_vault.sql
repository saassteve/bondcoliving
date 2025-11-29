/*
  # Update Email Trigger to Use Vault

  ## Overview
  Updates the trigger_access_code_email function to retrieve the service role key
  from Supabase Vault instead of using current_setting which may not be configured.

  ## Changes
  1. Replace current_setting calls with vault secret retrieval
  2. Add proper error handling and logging
  3. Improve HTTP request construction and validation
  4. Add detailed error messages for debugging

  ## Security
  - Uses vault.decrypted_secrets for secure key retrieval
  - Function is SECURITY DEFINER to access vault
  - Only triggers when access code is added (not on every update)
  - Prevents duplicate sends with timestamp check

  ## Testing
  After applying, test by:
  1. Updating a coworking_booking's access_code from NULL to a value
  2. Check PostgreSQL logs for NOTICE messages
  3. Verify email_logs table for sent email record
  4. Check Resend dashboard for delivered email
*/

-- Drop existing trigger to recreate with updated function
DROP TRIGGER IF EXISTS on_access_code_added ON coworking_bookings;

-- Create or replace the improved trigger function
CREATE OR REPLACE FUNCTION trigger_access_code_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  supabase_url text;
  supabase_service_key text;
  response http_response;
  request_body text;
BEGIN
  -- Only proceed if access code was added/changed and email hasn't been sent yet
  IF NEW.access_code IS NOT NULL AND 
     (OLD.access_code IS NULL OR OLD.access_code != NEW.access_code) AND
     NEW.access_code_email_sent_at IS NULL THEN
    
    RAISE NOTICE 'Access code trigger fired for booking %', NEW.id;
    
    BEGIN
      -- Get Supabase URL from database settings
      supabase_url := current_setting('app.settings.supabase_url', true);
      
      -- If not in settings, construct from project ref
      IF supabase_url IS NULL OR supabase_url = '' THEN
        supabase_url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co';
        RAISE NOTICE 'Constructed Supabase URL: %', supabase_url;
      END IF;
      
      -- Get service role key from vault
      SELECT decrypted_secret INTO supabase_service_key
      FROM vault.decrypted_secrets
      WHERE name = 'supabase_service_role_key'
      LIMIT 1;
      
      -- Validate we have the required credentials
      IF supabase_url IS NULL OR supabase_url = '' THEN
        RAISE WARNING 'Missing Supabase URL configuration for booking %', NEW.id;
        RETURN NEW;
      END IF;
      
      IF supabase_service_key IS NULL OR supabase_service_key = '' THEN
        RAISE WARNING 'Missing service role key in vault for booking %. Please add it via: INSERT INTO vault.secrets (name, secret) VALUES (''supabase_service_role_key'', ''YOUR_KEY'')', NEW.id;
        RETURN NEW;
      END IF;
      
      -- Build request body
      request_body := json_build_object(
        'emailType', 'access_code',
        'bookingId', NEW.id::text
      )::text;
      
      RAISE NOTICE 'Sending access code email for booking % to %', NEW.id, NEW.customer_email;
      
      -- Make HTTP request to send-coworking-email edge function
      SELECT * INTO response
      FROM http((
        'POST',
        supabase_url || '/functions/v1/send-coworking-email',
        ARRAY[
          http_header('Content-Type', 'application/json'),
          http_header('Authorization', 'Bearer ' || supabase_service_key)
        ],
        'application/json',
        request_body
      ));
      
      -- Log the response
      RAISE NOTICE 'Email trigger response for booking %: status=%, content=%', 
        NEW.id, response.status, response.content;
      
      -- Update the sent_at timestamp if successful (status 200-299)
      IF response.status >= 200 AND response.status < 300 THEN
        NEW.access_code_email_sent_at := now();
        RAISE NOTICE 'Successfully sent access code email for booking %', NEW.id;
      ELSE
        RAISE WARNING 'Failed to send access code email for booking %. Status: %, Response: %', 
          NEW.id, response.status, response.content;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the booking update
      RAISE WARNING 'Exception while sending access code email for booking %: % (SQLSTATE: %)', 
        NEW.id, SQLERRM, SQLSTATE;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_access_code_added
  BEFORE UPDATE OF access_code ON coworking_bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_access_code_email();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA vault TO postgres, service_role;
GRANT EXECUTE ON FUNCTION trigger_access_code_email() TO postgres, anon, authenticated, service_role;

-- Create a test function to verify the trigger setup
CREATE OR REPLACE FUNCTION test_email_trigger_configuration()
RETURNS TABLE(
  check_name text,
  status text,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  url_val text;
  key_exists boolean;
  trigger_exists boolean;
BEGIN
  -- Check Supabase URL
  url_val := current_setting('app.settings.supabase_url', true);
  IF url_val IS NULL OR url_val = '' THEN
    url_val := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co';
  END IF;
  
  RETURN QUERY
  SELECT
    'Supabase URL'::text,
    CASE WHEN url_val IS NOT NULL AND url_val != '' THEN 'OK' ELSE 'MISSING' END::text,
    COALESCE(url_val, 'Not configured')::text;
  
  -- Check vault secret exists
  key_exists := EXISTS(SELECT 1 FROM vault.secrets WHERE name = 'supabase_service_role_key');
  
  RETURN QUERY
  SELECT
    'Service Role Key'::text,
    CASE WHEN key_exists THEN 'OK' ELSE 'MISSING' END::text,
    CASE WHEN key_exists 
      THEN 'Secret exists in vault' 
      ELSE 'Must be added: INSERT INTO vault.secrets (name, secret) VALUES (''supabase_service_role_key'', ''YOUR_KEY'')'
    END::text;
  
  -- Check trigger exists
  trigger_exists := EXISTS(
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_access_code_added' 
    AND tgrelid = 'coworking_bookings'::regclass
  );
  
  RETURN QUERY
  SELECT
    'Trigger'::text,
    CASE WHEN trigger_exists THEN 'OK' ELSE 'MISSING' END::text,
    CASE WHEN trigger_exists 
      THEN 'Trigger on_access_code_added is active' 
      ELSE 'Trigger not found'
    END::text;
  
  -- Check http extension
  RETURN QUERY
  SELECT
    'HTTP Extension'::text,
    CASE WHEN EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'http') THEN 'OK' ELSE 'MISSING' END::text,
    CASE WHEN EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'http')
      THEN 'HTTP extension is installed'
      ELSE 'Need to enable: CREATE EXTENSION http'
    END::text;
END;
$$;

-- Grant execute on test function
GRANT EXECUTE ON FUNCTION test_email_trigger_configuration() TO postgres, authenticated, service_role;

-- Display test results
DO $$
DECLARE
  test_row RECORD;
BEGIN
  RAISE NOTICE '=== Email Trigger Configuration Test ===';
  FOR test_row IN SELECT * FROM test_email_trigger_configuration() LOOP
    RAISE NOTICE '[%] % - %', test_row.status, test_row.check_name, test_row.details;
  END LOOP;
  RAISE NOTICE '========================================';
END $$;
