-- Migration: Create Chart Sync Cron Job
-- Description: Configure pg_cron to automatically sync PopVortex chart twice a week (Monday & Thursday at 9 AM EST)
-- Created: 2025-09-06

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing cron job with the same name (in case of re-deployment)
-- Use DO block to handle case where job doesn't exist
DO $$
BEGIN
  PERFORM cron.unschedule('chart-sync');
EXCEPTION
  WHEN OTHERS THEN
    -- Job doesn't exist, continue
    NULL;
END $$;

-- Create cron job to sync chart twice a week: Monday and Thursday at 9 AM EST
-- This will call our auto-sync-chart Edge Function
SELECT cron.schedule(
  'chart-sync',                            -- Job name
  '0 9 * * 1,4',                          -- Monday and Thursday at 9 AM (cron expression)
  $$
  SELECT
    net.http_post(
      url := 'https://lkrintwlenbmtohilmrs.supabase.co/functions/v1/auto-sync-chart',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{"automated": true}'::jsonb
    ) as request_id;
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'chart-sync';

-- Optional: Create a manual trigger function for testing
CREATE OR REPLACE FUNCTION trigger_chart_sync()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Call the Edge Function manually
  SELECT net.http_post(
    url := 'https://lkrintwlenbmtohilmrs.supabase.co/functions/v1/auto-sync-chart',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{"automated": false}'::jsonb
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission on the trigger function
GRANT EXECUTE ON FUNCTION trigger_chart_sync() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION trigger_chart_sync() IS 'Manual trigger function to sync chart. Can be called for testing or manual sync.';

-- Log the cron job creation (skip if table doesn't exist)
DO $$
BEGIN
  INSERT INTO public.automation_logs (
    operation,
    details,
    created_at
  ) VALUES (
    'cron_job_created',
    'Chart sync cron job created - runs Monday and Thursday at 9 AM EST',
    NOW()
  ) ON CONFLICT DO NOTHING;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist, skip logging
    NULL;
END $$;
