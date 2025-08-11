-- Test script to check if 'net' extension can be enabled in Supabase
-- Run this in the Supabase SQL Editor

-- 1. Check if net extension is available
SELECT name, installed_version, default_version, comment 
FROM pg_available_extensions 
WHERE name = 'net';

-- 2. Try to create the extension (if available)
-- CREATE EXTENSION IF NOT EXISTS net;

-- 3. Test if net.http_post function exists
-- SELECT proname, pronargs 
-- FROM pg_proc 
-- WHERE proname LIKE '%http_post%';

-- 4. If extension works, test a simple HTTP call
-- SELECT net.http_post(
--   url := 'https://httpbin.org/post',
--   headers := '{"Content-Type": "application/json"}'::jsonb,
--   body := '{"test": "supabase-net-extension"}'::jsonb
-- );
