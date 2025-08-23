-- Migration: Enable pg_net and create exec_sql RPC
-- Description: Ensures HTTP capabilities for pg_cron via pg_net and provides a generic RPC to execute SQL from Edge Functions
-- Created: 2025-08-12

-- 1) Enable pg_net (provides net.http_post)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2) Create a safe-ish exec_sql RPC used by setup cron functions
-- Note: This executes arbitrary SQL and therefore is SECURITY DEFINER and intended to be called
--       only with the service role. Grant EXECUTE only to service_role.
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result jsonb := jsonb_build_object('ok', true);
BEGIN
  EXECUTE sql;
  RETURN _result;
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object(
    'ok', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE
  );
END;
$$;

-- Restrict permissions
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
-- Optional: allow authenticated if needed for admin UI/triggers
-- GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;

-- 3) Document the function
COMMENT ON FUNCTION public.exec_sql(text) IS 'Execute arbitrary SQL. Intended for use by Edge Functions with service role to manage cron and admin tasks.';
