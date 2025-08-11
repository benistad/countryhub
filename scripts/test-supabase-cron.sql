-- Test script to verify pg_net extension and cron job functionality
-- Run this in the Supabase SQL Editor

-- 1. Verify pg_net extension is installed
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'pg_net';

-- 2. Check if net.http_post function is available
SELECT proname, pronargs 
FROM pg_proc 
WHERE proname = 'http_post' AND pronamespace = (
  SELECT oid FROM pg_namespace WHERE nspname = 'net'
);

-- 3. Check existing cron jobs
SELECT jobname, schedule, active, command 
FROM cron.job 
WHERE jobname LIKE '%official%' OR jobname LIKE '%sync%';

-- 4. Test manual trigger function (if exists)
-- SELECT trigger_official_videos_sync();

-- 5. Test a simple HTTP call to verify pg_net works
SELECT net.http_post(
  url := 'https://httpbin.org/post',
  headers := '{"Content-Type": "application/json"}'::jsonb,
  body := '{"test": "pg_net_working", "timestamp": "' || now()::text || '"}'::jsonb
) as test_result;
