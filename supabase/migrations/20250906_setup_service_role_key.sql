-- Migration: Setup Service Role Key for Cron Jobs
-- Description: Configure the service_role_key setting required by pg_cron jobs
-- Created: 2025-09-06
-- IMPORTANT: This migration requires manual configuration in Supabase Dashboard

-- Create a function to set the service role key
-- This needs to be called with the actual service role key from Supabase Dashboard
CREATE OR REPLACE FUNCTION setup_service_role_key(key_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set the service role key in the app.settings namespace
  PERFORM set_config('app.settings.service_role_key', key_value, false);
  
  -- Log the setup
  RAISE NOTICE 'Service role key configured successfully';
END;
$$;

-- Grant execute permission to postgres role
GRANT EXECUTE ON FUNCTION setup_service_role_key(text) TO postgres;

-- Add comment for documentation
COMMENT ON FUNCTION setup_service_role_key(text) IS 'Setup function to configure service role key for cron jobs. Must be called manually with the actual key from Supabase Dashboard.';

-- Create a table to store the service role key securely (alternative approach)
CREATE TABLE IF NOT EXISTS private.service_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text UNIQUE NOT NULL,
  key_value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on the table
ALTER TABLE private.service_keys ENABLE ROW LEVEL SECURITY;

-- Only allow postgres role to access
CREATE POLICY "Only postgres can access service keys"
  ON private.service_keys
  FOR ALL
  TO postgres
  USING (true);

-- Create a function to get the service role key from the table
CREATE OR REPLACE FUNCTION get_service_role_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  key_val text;
BEGIN
  SELECT key_value INTO key_val
  FROM private.service_keys
  WHERE key_name = 'service_role_key'
  LIMIT 1;
  
  RETURN key_val;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_service_role_key() TO postgres;

-- Add comment
COMMENT ON FUNCTION get_service_role_key() IS 'Retrieves the service role key from secure storage for use in cron jobs.';

-- Instructions for manual setup:
-- 1. Get your service_role_key from Supabase Dashboard > Settings > API
-- 2. Run this SQL command in Supabase SQL Editor:
--    INSERT INTO private.service_keys (key_name, key_value) 
--    VALUES ('service_role_key', 'YOUR_SERVICE_ROLE_KEY_HERE')
--    ON CONFLICT (key_name) DO UPDATE SET key_value = EXCLUDED.key_value;
