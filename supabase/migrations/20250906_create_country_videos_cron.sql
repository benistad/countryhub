-- Migration: Create Country Videos Sync Cron Job
-- Description: Configure pg_cron to automatically sync country videos every 6 hours
-- Created: 2025-09-06
-- Updated: 2025-01-23 - Simplified to call sync-country-videos directly (like gnews)

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing cron job with the same name (in case of re-deployment)
-- Use DO block to handle case where job doesn't exist
DO $$
BEGIN
  PERFORM cron.unschedule('country-videos-sync');
EXCEPTION
  WHEN OTHERS THEN
    -- Job doesn't exist, continue
    NULL;
END $$;

-- Create cron job to sync country videos every 6 hours
-- Appelle directement sync-country-videos (comme pour gnews-country-sync)
SELECT cron.schedule(
  'country-videos-sync',                   -- Job name
  '0 */6 * * *',                          -- Every 6 hours (cron expression)
  $$
  SELECT
    net.http_post(
      url := 'https://lkrintwlenbmtohilmrs.supabase.co/functions/v1/sync-country-videos',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{"trigger": "cron", "source": "pg_cron"}'::jsonb
    ) as request_id;
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'country-videos-sync';

-- Optional: Create a manual trigger function for testing
CREATE OR REPLACE FUNCTION trigger_country_videos_sync()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Call the Edge Function manually (directly sync-country-videos)
  SELECT net.http_post(
    url := 'https://lkrintwlenbmtohilmrs.supabase.co/functions/v1/sync-country-videos',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{"trigger": "manual", "source": "trigger_function"}'::jsonb
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission on the trigger function
GRANT EXECUTE ON FUNCTION trigger_country_videos_sync() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION trigger_country_videos_sync() IS 'Manual trigger function to sync country videos. Calls sync-country-videos directly.';

-- Log the cron job creation (skip if table doesn't exist)
DO $$
BEGIN
  INSERT INTO public.automation_logs (
    operation,
    details,
    created_at
  ) VALUES (
    'cron_job_created',
    'Country videos sync cron job created - runs every 6 hours',
    NOW()
  ) ON CONFLICT DO NOTHING;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist, skip logging
    NULL;
END $$;

-- Also create a backup cron job for mid-day sync (optional, can be enabled later)
-- SELECT cron.schedule(
--   'country-videos-midday-sync',
--   '0 14 * * *',                          -- Daily at 2 PM EST
--   $$
--   SELECT
--     net.http_post(
--       url := 'https://lkrintwlenbmtohilmrs.supabase.co/functions/v1/auto-sync-country-videos',
--       headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
--       body := '{"automated": true}'::jsonb
--     ) as request_id;
--   $$
-- );
