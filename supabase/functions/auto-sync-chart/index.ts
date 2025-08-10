/*
  # Auto Sync Chart Function
  
  Fonction d'automatisation pour synchroniser le classement country
  Déclenchée 2 fois par semaine: Lundi et Jeudi à 9h EST
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
    console.log("🤖 Auto-sync chart triggered at:", new Date().toISOString());
    
    // Vérifier si c'est un appel automatisé (webhook) ou manuel
    const body = await req.json().catch(() => ({}));
    const isAutomated = body.automated === true;
    
    if (isAutomated) {
      console.log("🔄 Automated chart sync initiated");
      
      // Vérifier si c'est le bon jour (Lundi = 1, Jeudi = 4)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
      
      if (dayOfWeek !== 1 && dayOfWeek !== 4) {
        console.log(`⏭️ Skipping sync - Today is ${getDayName(dayOfWeek)}, sync only on Monday and Thursday`);
        return new Response(
          JSON.stringify({
            success: true,
            message: `Sync skipped - Today is ${getDayName(dayOfWeek)}, next sync on ${getNextSyncDay()}`,
            skipped: true,
            nextSync: getNextChartSyncTime(),
            timestamp: new Date().toISOString()
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
    } else {
      console.log("👤 Manual chart sync initiated");
    }

    // Appeler la fonction de scraping PopVortex existante
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const syncResponse = await fetch(`${supabaseUrl}/functions/v1/scrape-popvortex-chart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        automated: isAutomated,
        syncType: isAutomated ? 'Automatique' : 'Manuel'
      })
    });

    const syncResult = await syncResponse.json();
    
    // Log pour monitoring
    console.log("📊 Chart sync result:", {
      success: syncResult.success,
      entriesProcessed: syncResult.entriesProcessed,
      entriesSaved: syncResult.entriesSaved,
      timestamp: new Date().toISOString(),
      automated: isAutomated
    });

    // Retourner le résultat
    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto-sync chart completed: ${syncResult.entriesSaved || 0} entries updated`,
        automated: isAutomated,
        syncResult: syncResult,
        timestamp: new Date().toISOString(),
        nextSync: getNextChartSyncTime()
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('❌ Auto-sync chart error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});

/**
 * Calcule la prochaine synchronisation du classement
 * 2 fois par semaine: Lundi et Jeudi à 9h EST
 */
function getNextChartSyncTime(): string {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
  
  // Jours de sync: Lundi (1) et Jeudi (4)
  const syncDays = [1, 4];
  
  // Heure de sync: 9h EST
  const syncHour = 9;
  
  // Convertir en UTC (EST = UTC-5, EDT = UTC-4)
  const isDST = isDaylightSavingTime(now);
  const utcOffset = isDST ? 4 : 5;
  const syncHourUTC = (syncHour + utcOffset) % 24;
  
  // Trouver le prochain jour de sync
  let nextSyncDay = syncDays.find(day => {
    if (day > currentDay) return true;
    if (day === currentDay && now.getUTCHours() < syncHourUTC) return true;
    return false;
  });
  
  if (!nextSyncDay) {
    // Si aucun jour cette semaine, prendre le lundi suivant
    nextSyncDay = syncDays[0];
    now.setUTCDate(now.getUTCDate() + (7 - currentDay + nextSyncDay));
  } else {
    // Calculer les jours à ajouter
    const daysToAdd = nextSyncDay - currentDay;
    if (daysToAdd > 0) {
      now.setUTCDate(now.getUTCDate() + daysToAdd);
    }
  }
  
  now.setUTCHours(syncHourUTC, 0, 0, 0);
  return now.toISOString();
}

/**
 * Retourne le nom du jour
 */
function getDayName(dayNumber: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber];
}

/**
 * Retourne le prochain jour de sync
 */
function getNextSyncDay(): string {
  const now = new Date();
  const currentDay = now.getDay();
  
  if (currentDay < 1 || (currentDay === 1 && now.getHours() >= 9)) {
    return currentDay < 4 ? 'Thursday' : 'Monday';
  } else if (currentDay < 4 || (currentDay === 4 && now.getHours() >= 9)) {
    return 'Monday';
  } else {
    return 'Monday';
  }
}

/**
 * Vérifie si on est en heure d'été (DST)
 */
function isDaylightSavingTime(date: Date): boolean {
  const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  return Math.max(jan, jul) !== date.getTimezoneOffset();
}