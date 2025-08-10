-- Migration: Create GNews Sync Cron Job
-- Description: Configure pg_cron to automatically sync country music news every 30 minutes
-- Created: 2025-08-10

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing cron job with the same name (in case of re-deployment)
SELECT cron.unschedule('gnews-country-sync');

-- Create cron job to sync country music news every 30 minutes
-- This will call our sync-gnews-country Edge Function
SELECT cron.schedule(
  'gnews-country-sync',                    -- Job name
  '*/30 * * * *',                         -- Every 30 minutes (cron expression)
  $$
  SELECT
    net.http_post(
      url := 'https://lkrintwlenbmtohilmrs.supabase.co/functions/v1/sync-gnews-country',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'gnews-country-sync';

-- Optional: Create a manual trigger function for testing
CREATE OR REPLACE FUNCTION trigger_gnews_sync()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Call the Edge Function manually
  SELECT net.http_post(
     url := 'https://lkrintwlenbmtohilmrs.supabase.co/functions/v1/sync-gnews-country',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission on the trigger function
GRANT EXECUTE ON FUNCTION trigger_gnews_sync() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION trigger_gnews_sync() IS 'Manual trigger function to sync GNews country music articles. Can be called for testing or manual sync.';

-- Log the cron job creation
INSERT INTO public.automation_logs (
  operation,
  details,
  created_at
) VALUES (
  'cron_job_created',
  'GNews country music sync cron job created - runs every 30 minutes',
  NOW()
) ON CONFLICT DO NOTHING;
