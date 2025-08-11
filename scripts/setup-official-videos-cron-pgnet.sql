-- Setup automatic cron job for official videos sync using pg_net
-- Run this in the Supabase SQL Editor after pg_net extension is enabled

-- 1. Enable pg_cron extension if not already enabled
SELECT cron.schedule(
  'official-videos-sync',
  '0 4 * * *', -- Daily at 4:00 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://qhzjqxwvxrxfuaxtqyto.supabase.co/functions/v1/sync-official-videos',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000 -- 5 minutes timeout
  );
  $$
);

-- 2. Create manual trigger function for testing
CREATE OR REPLACE FUNCTION trigger_official_videos_sync()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result text;
BEGIN
  SELECT net.http_post(
    url := 'https://qhzjqxwvxrxfuaxtqyto.supabase.co/functions/v1/sync-official-videos',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  ) INTO result;
  
  RETURN 'Sync triggered: ' || result;
END;
$$;

-- 3. Grant execute permission
GRANT EXECUTE ON FUNCTION trigger_official_videos_sync() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_official_videos_sync() TO service_role;

-- 4. Test the manual trigger (uncomment to test)
-- SELECT trigger_official_videos_sync();
