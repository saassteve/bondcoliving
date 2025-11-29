/*
  # Fix Email Trigger - Use Hardcoded URL

  ## Problem
  Database settings cannot be configured due to permission restrictions.
  The trigger function needs the Supabase URL but can't get it from settings.

  ## Solution
  Hardcode the Supabase URL in the trigger function since it doesn't change.
  Still retrieve the service role key from vault for security.

  ## Changes
  1. Remove dependency on app.settings for URL
  2. Hardcode Supabase URL directly in function
  3. Keep vault secret retrieval for service role key
  4. Add better error messages if vault secret missing
*/

-- Drop and recreate the trigger function with hardcoded URL
CREATE OR REPLACE FUNCTION trigger_access_code_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  supabase_url text := 'https://eaccyitssgrkrrqgdojy.supabase.co';
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
      -- Get service role key from vault
      SELECT decrypted_secret INTO supabase_service_key
      FROM vault.decrypted_secrets
      WHERE name = 'supabase_service_role_key'
      LIMIT 1;
      
      -- Validate we have the service role key
      IF supabase_service_key IS NULL OR supabase_service_key = '' THEN
        RAISE WARNING 'Missing service role key in vault for booking %. Run: INSERT INTO vault.secrets (name, secret) VALUES (''supabase_service_role_key'', ''YOUR_KEY'')', NEW.id;
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

-- No need to recreate trigger as function signature hasn't changed
-- But let's verify it exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_access_code_added' 
    AND tgrelid = 'coworking_bookings'::regclass
  ) THEN
    CREATE TRIGGER on_access_code_added
      BEFORE UPDATE OF access_code ON coworking_bookings
      FOR EACH ROW
      EXECUTE FUNCTION trigger_access_code_email();
    RAISE NOTICE 'Created trigger on_access_code_added';
  ELSE
    RAISE NOTICE 'Trigger on_access_code_added already exists';
  END IF;
END $$;

-- Test the configuration
DO $$
DECLARE
  key_exists boolean;
BEGIN
  RAISE NOTICE '=== Email Trigger Configuration Test ===';
  
  -- Check if vault secret exists
  SELECT EXISTS(SELECT 1 FROM vault.secrets WHERE name = 'supabase_service_role_key')
  INTO key_exists;
  
  IF key_exists THEN
    RAISE NOTICE '[OK] Service Role Key - Secret exists in vault';
  ELSE
    RAISE WARNING '[MISSING] Service Role Key - Must add: INSERT INTO vault.secrets (name, secret) VALUES (''supabase_service_role_key'', ''YOUR_KEY'')';
  END IF;
  
  RAISE NOTICE '[OK] Supabase URL - Hardcoded in function';
  RAISE NOTICE '[OK] Trigger - on_access_code_added exists';
  RAISE NOTICE '========================================';
END $$;
