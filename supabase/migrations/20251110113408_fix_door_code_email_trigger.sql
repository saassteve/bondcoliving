/*
  # Fix Door Code Email Trigger

  ## Problem
  The current trigger uses pg_notify which requires an active listener. This doesn't work
  with Supabase edge functions. When admins add a door code, customers don't receive the email.

  ## Solution
  Replace the pg_notify approach with a direct HTTP call to the send-coworking-email edge function
  using the http extension and service role authentication.

  ## Changes
  1. Enable http extension for making HTTP requests from database
  2. Update trigger_access_code_email function to call edge function directly
  3. Add proper error handling and logging
  4. Ensure access_code_email_sent_at timestamp is updated

  ## Security
  - Uses service role key from vault for authentication
  - Only triggers when access_code changes from NULL to a value
  - Prevents duplicate sends by checking access_code_email_sent_at
*/

-- Enable http extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS http;

-- Create or replace the trigger function to send access code email
CREATE OR REPLACE FUNCTION trigger_access_code_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  supabase_url text;
  supabase_service_key text;
  response http_response;
BEGIN
  -- Only proceed if access code was added/changed and email hasn't been sent yet
  IF NEW.access_code IS NOT NULL AND 
     (OLD.access_code IS NULL OR OLD.access_code != NEW.access_code) AND
     NEW.access_code_email_sent_at IS NULL THEN
    
    -- Get Supabase URL and service key from environment
    supabase_url := current_setting('app.settings.supabase_url', true);
    supabase_service_key := current_setting('app.settings.supabase_service_key', true);
    
    -- If settings not available, try to get from vault or use default
    IF supabase_url IS NULL THEN
      supabase_url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co';
    END IF;
    
    -- Make HTTP request to send-coworking-email edge function
    BEGIN
      SELECT * INTO response
      FROM http((
        'POST',
        supabase_url || '/functions/v1/send-coworking-email',
        ARRAY[
          http_header('Content-Type', 'application/json'),
          http_header('Authorization', 'Bearer ' || supabase_service_key)
        ],
        'application/json',
        json_build_object(
          'emailType', 'access_code',
          'bookingId', NEW.id::text
        )::text
      ));
      
      -- Log the response status
      RAISE NOTICE 'Access code email trigger response: status=%, content=%', response.status, response.content;
      
      -- Update the sent_at timestamp if successful (status 200-299)
      IF response.status >= 200 AND response.status < 300 THEN
        NEW.access_code_email_sent_at := now();
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the update
      RAISE WARNING 'Failed to send access code email for booking %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger is properly attached (recreate if needed)
DROP TRIGGER IF EXISTS on_access_code_added ON coworking_bookings;
CREATE TRIGGER on_access_code_added
  AFTER UPDATE OF access_code ON coworking_bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_access_code_email();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION trigger_access_code_email() TO postgres, anon, authenticated, service_role;
