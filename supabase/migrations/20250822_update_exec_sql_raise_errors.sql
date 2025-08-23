-- Migration: Update exec_sql to bubble up errors
-- Description: Redefine exec_sql to return void and allow exceptions to propagate so RPC calls report errors properly
-- Created: 2025-08-22

-- Drop the previous version first (it returned jsonb), otherwise Postgres forbids changing return type
DROP FUNCTION IF EXISTS public.exec_sql(text);

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Permissions unchanged
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

COMMENT ON FUNCTION public.exec_sql(text) IS 'Execute arbitrary SQL (errors propagate). Intended for service role only.';
