/*
  # Create Password Reset Tokens System

  1. New Tables
    - `password_reset_tokens`
      - `id` (uuid, primary key) - Unique identifier for the token
      - `user_id` (uuid, references auth.users) - User requesting password reset
      - `user_type` (text) - Either 'admin' or 'guest' to distinguish user types
      - `token_hash` (text, unique, indexed) - SHA-256 hashed token for security
      - `expires_at` (timestamptz) - Token expiration time (default 6 hours from creation)
      - `used` (boolean) - Whether token has been used (single-use tokens)
      - `used_at` (timestamptz, nullable) - When the token was used
      - `created_at` (timestamptz) - When the token was created

  2. Security
    - Enable RLS on `password_reset_tokens` table
    - Restrict all access to service_role only (managed by Edge Functions)
    - Add indexes on token_hash and expires_at for performance
    - Tokens are single-use and expire after 6 hours

  3. Cleanup Function
    - Automated cleanup of expired tokens older than 24 hours
    - Runs periodically to maintain database hygiene
*/

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('admin', 'guest')),
  token_hash text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '6 hours'),
  used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS (restrict to service_role only)
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for service_role only access
CREATE POLICY "Service role can manage password reset tokens"
  ON password_reset_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash 
  ON password_reset_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at 
  ON password_reset_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id 
  ON password_reset_tokens(user_id);

-- Create function to cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete tokens that expired more than 24 hours ago
  DELETE FROM password_reset_tokens
  WHERE expires_at < (now() - interval '24 hours');
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION cleanup_expired_password_reset_tokens() TO service_role;