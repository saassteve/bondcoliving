/*
  # Create API Keys System

  ## Overview
  Creates a secure API key management system that allows external AI agents
  and integrations to access read-only data from the platform.

  ## New Tables

  ### api_keys
  Stores hashed API keys for external access.
  - `id` - UUID primary key
  - `name` - Human-readable label (e.g., "AI Agent - Production")
  - `key_hash` - SHA-256 hash of the plaintext key (never store plaintext)
  - `key_prefix` - First 8 chars of key for identification without exposing full key
  - `scopes` - Array of permitted scopes: bookings:read, passes:read, stats:read, customers:read
  - `is_active` - Whether the key is currently valid
  - `last_used_at` - Timestamp of most recent successful use
  - `request_count` - Total number of requests made with this key
  - `created_by` - admin_users.id who created the key
  - `created_at` / `updated_at` - Audit timestamps

  ### api_request_logs
  Immutable log of all API requests for audit and monitoring.
  - `id` - UUID primary key
  - `api_key_id` - FK to api_keys
  - `endpoint` - Which endpoint was called (e.g., /bookings)
  - `method` - HTTP method
  - `query_params` - JSONB of query parameters used
  - `response_status` - HTTP status code returned
  - `ip_address` - Caller IP for audit
  - `requested_at` - When the request was made

  ## Security
  - RLS enabled on both tables
  - Only admins can SELECT, INSERT, UPDATE, DELETE api_keys
  - Only admins can SELECT api_request_logs
  - Service role can INSERT api_request_logs (for edge functions)
  - key_hash column ensures plaintext keys are never stored
*/

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  scopes text[] NOT NULL DEFAULT ARRAY['bookings:read'],
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  request_count bigint NOT NULL DEFAULT 0,
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES api_keys(id) ON DELETE SET NULL,
  endpoint text NOT NULL,
  method text NOT NULL DEFAULT 'GET',
  query_params jsonb DEFAULT '{}',
  response_status integer NOT NULL,
  ip_address text,
  requested_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_api_key_id ON api_request_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_requested_at ON api_request_logs(requested_at DESC);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view api keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert api keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update api keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete api keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can view api request logs"
  ON api_request_logs FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Service role can insert api request logs"
  ON api_request_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_api_key_usage(p_key_hash text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE api_keys
  SET
    last_used_at = now(),
    request_count = request_count + 1,
    updated_at = now()
  WHERE key_hash = p_key_hash AND is_active = true;
END;
$$;

CREATE OR REPLACE FUNCTION validate_api_key(p_key_hash text)
RETURNS TABLE(
  id uuid,
  name text,
  scopes text[],
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ak.id,
    ak.name,
    ak.scopes,
    ak.is_active
  FROM api_keys ak
  WHERE ak.key_hash = p_key_hash AND ak.is_active = true;
END;
$$;
