-- Migration: Create Official Videos Daily Sync Cron Job
-- Description: Configure pg_cron to automatically sync official videos daily at 04:00 UTC
-- Created: 2025-08-10

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing cron job with the same name (in case of re-deployment)
SELECT cron.unschedule('official-videos-daily-sync');

-- Create cron job to sync official videos daily at 04:00 UTC
-- This will call our sync-official-videos Edge Function
SELECT cron.schedule(
  'official-videos-daily-sync',               -- Job name
  '0 4 * * *',                               -- Daily at 04:00 UTC (cron expression)
  $$
  SELECT
    net.http_post(
      url := 'https://lkrintwlenbmtohilmrs.supabase.co/functions/v1/sync-official-videos',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{"hours": 24, "maxResultsPerChannel": 10}'::jsonb
    ) as request_id;
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'official-videos-daily-sync';

-- Optional: Create a manual trigger function for testing
CREATE OR REPLACE FUNCTION trigger_official_videos_sync()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Call the Edge Function manually
  SELECT net.http_post(
    url := 'https://lkrintwlenbmtohilmrs.supabase.co/functions/v1/sync-official-videos',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{"hours": 24, "maxResultsPerChannel": 10}'::jsonb
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission on the trigger function
GRANT EXECUTE ON FUNCTION trigger_official_videos_sync() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION trigger_official_videos_sync() IS 'Manual trigger function to sync official videos from YouTube. Can be called for testing or manual sync.';

-- Log the cron job creation (if automation_logs table exists)
INSERT INTO public.automation_logs (
  operation,
  details,
  created_at
) VALUES (
  'cron_job_created',
  'Official videos daily sync cron job created - runs daily at 04:00 UTC',
  NOW()
) ON CONFLICT DO NOTHING;
