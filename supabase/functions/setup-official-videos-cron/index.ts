/*
  # Setup Official Videos Daily Cron Job

  Purpose
  - Configure pg_cron to run `sync-official-videos` once per day
  - Provide a manual trigger function for testing

  Default schedule: daily at 04:00 UTC (cron: `0 4 * * *`)
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const debugInfo: any = {
    step: '',
    details: '',
    error: null,
    success: false,
    cronJobCreated: false,
    manualTriggerCreated: false,
  };

  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseKey) {
      return json({ success: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1) Ensure pg_cron
    debugInfo.step = 'pg_cron';
    debugInfo.details = 'CREATE EXTENSION IF NOT EXISTS pg_cron';

    const { error: extErr } = await supabase.rpc('exec_sql', { sql: 'CREATE EXTENSION IF NOT EXISTS pg_cron;' });
    if (extErr) {
      console.warn('pg_cron extension warning:', extErr.message);
    }

    // 2) Unschedule existing job
    debugInfo.step = 'unschedule';
    const jobName = 'official-videos-daily-sync';
    await supabase.rpc('exec_sql', { sql: `SELECT cron.unschedule('${jobName}');` });

    // 3) Create cron job (04:00 UTC daily)
    debugInfo.step = 'schedule';
    debugInfo.details = 'Create daily cron job at 04:00 UTC';

    const cronSQL = `
      SELECT cron.schedule(
        '${jobName}',
        '0 4 * * *',
        $$
        SELECT net.http_post(
          url := '${supabaseUrl}/functions/v1/sync-official-videos',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${supabaseKey}"}'::jsonb,
          body := '{}'::jsonb
        ) as request_id;
        $$
      );
    `;

    const { error: cronErr } = await supabase.rpc('exec_sql', { sql: cronSQL });
    if (cronErr) throw new Error(`Erreur création cron: ${cronErr.message}`);
    debugInfo.cronJobCreated = true;

    // 4) Manual trigger SQL function
    debugInfo.step = 'manual-trigger';

    const triggerSQL = `
      CREATE OR REPLACE FUNCTION trigger_official_videos_sync()
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result jsonb;
      BEGIN
        SELECT net.http_post(
          url := '${supabaseUrl}/functions/v1/sync-official-videos',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${supabaseKey}"}'::jsonb,
          body := '{}'::jsonb
        ) INTO result;
        RETURN result;
      END;
      $$;

      GRANT EXECUTE ON FUNCTION trigger_official_videos_sync() TO authenticated;

      COMMENT ON FUNCTION trigger_official_videos_sync() IS 'Manual trigger for daily official videos sync';
    `;

    const { error: trigErr } = await supabase.rpc('exec_sql', { sql: triggerSQL });
    if (trigErr) {
      console.warn('Trigger function warning:', trigErr.message);
    } else {
      debugInfo.manualTriggerCreated = true;
    }

    // 5) Verify and kick off first sync
    debugInfo.step = 'verify';
    await supabase.rpc('exec_sql', { sql: `SELECT * FROM cron.job WHERE jobname = '${jobName}';` });

    debugInfo.step = 'initial-sync';
    const initResp = await fetch(`${supabaseUrl}/functions/v1/sync-official-videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({ hours: 24, maxResultsPerChannel: 10 })
    });
    if (!initResp.ok) console.warn('Initial sync failed with status', initResp.status);

    debugInfo.success = true;

    return json({
      success: true,
      message: 'Official videos daily cron configured (04:00 UTC). Manual trigger created.',
      job: { name: jobName, schedule: '0 4 * * *' },
      debug: debugInfo
    });

  } catch (error) {
    console.error('❌ Cron setup error:', error);
    debugInfo.error = error?.message || String(error);
    return json({ success: false, error: debugInfo.error, debug: debugInfo }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
