/*
  # Create Apartment iCal Export System

  1. New Table
    - `apartment_ical_exports`
      - `id` (uuid, primary key)
      - `apartment_id` (uuid, foreign key to apartments, unique)
      - `export_token` (text, unique token for secure access)
      - `is_active` (boolean, whether export is enabled)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on apartment_ical_exports
    - Only admins can manage export tokens
    - Public access via token is handled in edge function
  
  3. Functions
    - `get_or_create_export_token` - generates or retrieves export token for an apartment
  
  4. Purpose
    - Allows exporting Bond bookings to external calendar systems
    - Supports syncing with Airbnb, Booking.com, and other platforms
    - Exports confirmed and checked-in bookings only
    - Includes manual availability blocks
*/

-- Create apartment_ical_exports table
CREATE TABLE IF NOT EXISTS apartment_ical_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  export_token text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(apartment_id)
);

-- Enable RLS
ALTER TABLE apartment_ical_exports ENABLE ROW LEVEL SECURITY;

-- Admin can manage exports
CREATE POLICY "Admins can manage ical exports"
  ON apartment_ical_exports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Create index
CREATE INDEX IF NOT EXISTS idx_apartment_ical_exports_token 
  ON apartment_ical_exports(export_token) WHERE is_active = true;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_apartment_ical_exports_updated_at ON apartment_ical_exports;
CREATE TRIGGER update_apartment_ical_exports_updated_at
  BEFORE UPDATE ON apartment_ical_exports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate or get export token for apartment
CREATE OR REPLACE FUNCTION get_or_create_export_token(p_apartment_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
BEGIN
  -- Try to get existing token
  SELECT export_token INTO v_token
  FROM apartment_ical_exports
  WHERE apartment_id = p_apartment_id AND is_active = true;
  
  -- If not found, create one
  IF v_token IS NULL THEN
    v_token := encode(gen_random_bytes(32), 'base64');
    v_token := replace(replace(replace(v_token, '/', '_'), '+', '-'), '=', '');
    
    INSERT INTO apartment_ical_exports (apartment_id, export_token)
    VALUES (p_apartment_id, v_token)
    ON CONFLICT (apartment_id) 
    DO UPDATE SET 
      export_token = EXCLUDED.export_token,
      is_active = true,
      updated_at = now();
      
    RETURN v_token;
  END IF;
  
  RETURN v_token;
END;
$$;