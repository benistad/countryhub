-- Migration: Remove Official Videos integration (tables, triggers, functions, cron)
-- Description: Drops tables official_videos, official_videos_sync_metadata, official_videos_blacklist
--              Unschedules cron jobs and drops helper/trigger functions
-- Created: 2025-08-23

-- 1) Unschedule pg_cron jobs if pg_cron is available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Try to unschedule both possible job names used historically
    PERFORM cron.unschedule('official-videos-daily-sync');
    PERFORM cron.unschedule('official-videos-sync');
  END IF;
END $$;

-- 2) Drop manual trigger SQL function if present
DROP FUNCTION IF EXISTS trigger_official_videos_sync();

-- 3) Drop trigger updating updated_at (if table still exists)
DO $$
BEGIN
  IF to_regclass('public.official_videos') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS update_official_videos_updated_at ON public.official_videos';
  END IF;
END $$;

-- 4) Drop helper function created for updated_at (only used by official_videos in this project)
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 5) Drop tables (indexes, policies and dependent objects on these tables will be removed as well)
DROP TABLE IF EXISTS public.official_videos_blacklist CASCADE;
DROP TABLE IF EXISTS public.official_videos_sync_metadata CASCADE;
DROP TABLE IF EXISTS public.official_videos CASCADE;

-- 6) Optional: document removal in automation logs if the table exists
DO $$
BEGIN
  IF to_regclass('public.automation_logs') IS NOT NULL THEN
    INSERT INTO public.automation_logs(operation, details, created_at)
    VALUES ('cleanup', 'Removed Official Videos integration (tables, cron, functions)', NOW());
  END IF;
END $$;
