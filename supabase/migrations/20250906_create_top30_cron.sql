-- Migration: Create Top30 Sync Cron Job
-- Description: Configure pg_cron to automatically sync Top30 twice a week (Monday & Thursday at 9 AM EST)
-- Created: 2025-09-06

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing cron job with the same name (in case of re-deployment)
-- Use DO block to handle case where job doesn't exist
DO $$
BEGIN
  PERFORM cron.unschedule('top30-sync');
EXCEPTION
  WHEN OTHERS THEN
    -- Job doesn't exist, continue
    NULL;
END $$;

-- Create cron job to sync Top30 twice a week: Monday and Thursday at 9 AM EST
-- This will call our auto-sync-top30 Edge Function
SELECT cron.schedule(
  'top30-sync',                            -- Job name
  '0 9 * * 1,4',                          -- Monday and Thursday at 9 AM (cron expression)
  $$
  SELECT
    net.http_post(
      url := 'https://lkrintwlenbmtohilmrs.supabase.co/functions/v1/auto-sync-top30',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{"automated": true}'::jsonb
    ) as request_id;
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'top30-sync';

-- Optional: Create a manual trigger function for testing
CREATE OR REPLACE FUNCTION trigger_top30_sync()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Call the Edge Function manually
  SELECT net.http_post(
    url := 'https://lkrintwlenbmtohilmrs.supabase.co/functions/v1/auto-sync-top30',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{"automated": false}'::jsonb
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission on the trigger function
GRANT EXECUTE ON FUNCTION trigger_top30_sync() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION trigger_top30_sync() IS 'Manual trigger function to sync Top30. Can be called for testing or manual sync.';

-- Log the cron job creation (skip if table doesn't exist)
DO $$
BEGIN
  INSERT INTO public.automation_logs (
    operation,
    details,
    created_at
  ) VALUES (
    'cron_job_created',
    'Top30 sync cron job created - runs Monday and Thursday at 9 AM EST',
    NOW()
  ) ON CONFLICT DO NOTHING;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist, skip logging
    NULL;
END $$;
