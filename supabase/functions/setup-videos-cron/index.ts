/*
  # Setup Country Videos Sync Cron Job

  1. Purpose
    - Configures pg_cron to automatically sync country videos
    - Sets up a cron job that runs every 6 hours
    - Provides manual trigger capability for testing

  2. Features
    - Automatic cron job creation with pg_cron
    - Error handling and validation
    - Manual sync trigger function
    - Logging and monitoring

  3. Usage
    - Call this function once to set up the cron job
    - The cron job will then run automatically every 6 hours
    - Use the manual trigger for testing
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const debugInfo = {
    step: '',
    details: '',
    error: null as string | null,
    success: false,
    cronJobCreated: false,
    manualTriggerCreated: false
  };

  try {
    debugInfo.step = "Initialisation";
    debugInfo.details = "Configuration du cron job Country Videos sync";
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ÉTAPE 1: Activer l'extension pg_cron si nécessaire
    debugInfo.step = "Extension pg_cron";
    debugInfo.details = "Activation de l'extension pg_cron";
    
    const { error: extensionError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE EXTENSION IF NOT EXISTS pg_cron;'
    });
    
    if (extensionError) {
      console.warn('⚠️ Extension pg_cron:', extensionError.message);
    } else {
      console.log('✅ Extension pg_cron activée');
    }

    // ÉTAPE 2: Supprimer le cron job existant s'il existe
    debugInfo.step = "Nettoyage";
    debugInfo.details = "Suppression du cron job existant";
    
    const { error: unscheduleError } = await supabase.rpc('exec_sql', {
      sql: "SELECT cron.unschedule('country-videos-sync');"
    });
    
    if (unscheduleError) {
      console.log('ℹ️ Aucun cron job existant à supprimer');
    } else {
      console.log('🗑️ Ancien cron job supprimé');
    }

    // ÉTAPE 3: Créer le nouveau cron job (toutes les 6 heures)
    debugInfo.step = "Création cron job";
    debugInfo.details = "Configuration du cron job toutes les 6 heures";
    
    const cronJobSQL = `
      SELECT cron.schedule(
        'country-videos-sync',
        '0 */6 * * *',
        $$
        SELECT
          net.http_post(
            url := '${supabaseUrl}/functions/v1/sync-country-videos',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${supabaseKey}"}'::jsonb,
            body := '{"trigger": "cron", "source": "pg_cron"}'::jsonb
          ) as request_id;
        $$
      );
    `;
    
    const { error: cronError } = await supabase.rpc('exec_sql', {
      sql: cronJobSQL
    });
    
    if (cronError) {
      throw new Error(`Erreur création cron job: ${cronError.message}`);
    }
    
    debugInfo.cronJobCreated = true;
    console.log('⏰ Cron job créé: sync toutes les 6 heures');

    // ÉTAPE 4: Créer la fonction de trigger manuel
    debugInfo.step = "Fonction trigger manuel";
    debugInfo.details = "Création de la fonction de test manuel";
    
    const triggerFunctionSQL = `
      CREATE OR REPLACE FUNCTION trigger_country_videos_sync()
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result jsonb;
      BEGIN
        SELECT net.http_post(
          url := '${supabaseUrl}/functions/v1/sync-country-videos',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${supabaseKey}"}'::jsonb,
          body := '{"trigger": "manual", "source": "trigger_function"}'::jsonb
        ) INTO result;
        
        RETURN result;
      END;
      $$;
      
      GRANT EXECUTE ON FUNCTION trigger_country_videos_sync() TO authenticated;
      
      COMMENT ON FUNCTION trigger_country_videos_sync() IS 'Manual trigger for Country Videos sync';
    `;
    
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: triggerFunctionSQL
    });
    
    if (triggerError) {
      console.warn('⚠️ Erreur fonction trigger:', triggerError.message);
    } else {
      debugInfo.manualTriggerCreated = true;
      console.log('🔧 Fonction trigger manuel créée');
    }

    // ÉTAPE 5: Vérifier que le cron job est bien créé
    debugInfo.step = "Vérification";
    debugInfo.details = "Vérification du cron job créé";
    
    const { data: cronJobs, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: "SELECT * FROM cron.job WHERE jobname = 'country-videos-sync';"
    });
    
    if (verifyError) {
      console.warn('⚠️ Impossible de vérifier le cron job:', verifyError.message);
    } else {
      console.log('✅ Cron job vérifié:', cronJobs);
    }

    // ÉTAPE 6: Déclencher une première synchronisation
    debugInfo.step = "Synchronisation initiale";
    debugInfo.details = "Déclenchement de la première synchronisation";
    
    const initialSyncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-country-videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ trigger: 'setup', source: 'setup-videos-cron' })
    });
    
    if (initialSyncResponse.ok) {
      const syncResult = await initialSyncResponse.json();
      console.log('🚀 Synchronisation initiale déclenchée:', syncResult);
    } else {
      console.warn('⚠️ Erreur synchronisation initiale:', initialSyncResponse.status);
    }

    debugInfo.success = true;
    debugInfo.details = "Cron job Country Videos configuré avec succès";

    return new Response(JSON.stringify({
      success: true,
      message: "Cron job Country Videos configuré avec succès - synchronisation automatique toutes les 6 heures",
      debug: debugInfo,
      cronJob: {
        name: 'country-videos-sync',
        schedule: '0 */6 * * *',
        description: 'Sync country videos every 6 hours'
      },
      manualTrigger: {
        function: 'trigger_country_videos_sync()',
        description: 'Call this function to manually trigger sync'
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    debugInfo.error = error.message;
    console.error('❌ Erreur configuration cron job:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      debug: debugInfo
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
