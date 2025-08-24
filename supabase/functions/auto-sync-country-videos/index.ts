/*
  # Auto Sync Country Videos Function
  
  Fonction d'automatisation pour synchroniser les vidéos country depuis YouTube
  Déclenchée quotidiennement à 6h EST pour capturer les nouvelles sorties
  Optimisée pour économiser les ressources et éviter les limites de taux
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

  try {
    console.log("🤖 Auto-sync Country Videos triggered at:", new Date().toISOString());
    
    // Vérifier si c'est un appel automatisé (webhook) ou manuel
    const body = await req.json().catch(() => ({}));
    const isAutomated = body.automated === true;
    
    if (isAutomated) {
      console.log("🔄 Automated Country Videos sync initiated");
      
      // Vérifier l'heure pour éviter les syncs trop fréquents
      const now = new Date();
      const hour = now.getHours();
      
      // Sync seulement entre 6h et 22h pour éviter les pics de trafic
      if (hour < 6 || hour > 22) {
        console.log(`⏭️ Skipping sync - Current hour is ${hour}, sync only between 6h-22h`);
        return new Response(
          JSON.stringify({
            success: true,
            message: `Sync skipped - Current hour is ${hour}h, sync only between 6h-22h`,
            skipped: true,
            nextSync: getNextVideosSyncTime(),
            timestamp: new Date().toISOString(),
            optimization: "Évite les pics de trafic YouTube API"
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }
    }

    // Appeler la fonction de synchronisation existante
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Appeler l'Edge Function sync-country-videos
    const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-country-videos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trigger: isAutomated ? 'automated' : 'manual',
        source: 'auto-sync-country-videos'
      })
    });

    if (!syncResponse.ok) {
      throw new Error(`Sync function failed: ${syncResponse.status} ${syncResponse.statusText}`);
    }

    const syncResult = await syncResponse.json();
    
    // Enregistrer dans sync_history
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
      await supabase
        .from('sync_history')
        .upsert({
          sync_type: 'auto_country_videos',
          last_sync_at: new Date().toISOString(),
          sync_count: 1,
          status: syncResult.success ? 'success' : 'error',
          details: `Automatisation: ${syncResult.totalVideos || 0} vidéos synchronisées`
        }, {
          onConflict: 'sync_type'
        });
      
      console.log(`📊 Historique de synchronisation automatique mis à jour`);
    } catch (historyError) {
      console.warn(`⚠️ Erreur mise à jour historique: ${historyError.message}`);
    }

    const result = {
      success: true,
      message: isAutomated 
        ? `Synchronisation automatique réussie: ${syncResult.totalVideos || 0} vidéos`
        : `Synchronisation manuelle réussie: ${syncResult.totalVideos || 0} vidéos`,
      automated: isAutomated,
      timestamp: new Date().toISOString(),
      nextSync: isAutomated ? getNextVideosSyncTime() : null,
      syncDetails: syncResult,
      optimization: "Sync quotidien optimisé pour capturer les nouvelles sorties"
    };

    console.log(`✅ Auto-sync Country Videos completed: ${syncResult.totalVideos || 0} videos`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('❌ Erreur auto-synchronisation vidéos:', error);
    
    // Enregistrer l'erreur dans sync_history
    try {
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('sync_history')
        .upsert({
          sync_type: 'auto_country_videos',
          last_sync_at: new Date().toISOString(),
          sync_count: 1,
          status: 'error',
          details: `Erreur automatisation: ${error.message}`
        }, {
          onConflict: 'sync_type'
        });
    } catch (historyError) {
      console.warn(`⚠️ Erreur enregistrement erreur: ${historyError.message}`);
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      automated: true
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Fonctions utilitaires pour la planification
function getNextVideosSyncTime(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(6, 0, 0, 0); // 6h du matin
  
  return tomorrow.toISOString();
}

function getDayName(dayIndex: number): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[dayIndex];
}
