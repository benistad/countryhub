/*
  # Auto Sync Top30 Function
  
  Fonction d'automatisation pour synchroniser le Top30 depuis Apify
  Déclenchée 2 fois par semaine: Lundi et Jeudi à 9h EST
  Économise les coûts Apify en limitant les appels
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
    console.log("🤖 Auto-sync Top30 triggered at:", new Date().toISOString());
    
    // Vérifier si c'est un appel automatisé (webhook) ou manuel
    const body = await req.json().catch(() => ({}));
    const isAutomated = body.automated === true;
    
    if (isAutomated) {
      console.log("🔄 Automated Top30 sync initiated");
      
      // Vérifier si c'est le bon jour (Lundi = 1, Jeudi = 4)
      const now = new Date();
      const dayOfWeek = now.getDay();
      
      if (dayOfWeek !== 1 && dayOfWeek !== 4) {
        console.log(`⏭️ Skipping sync - Today is ${getDayName(dayOfWeek)}, sync only on Monday and Thursday`);
        return new Response(
          JSON.stringify({
            success: true,
            message: `Sync skipped - Today is ${getDayName(dayOfWeek)}, next sync on ${getNextSyncDay()}`,
            skipped: true,
            nextSync: getNextTop30SyncTime(),
            timestamp: new Date().toISOString(),
            costSaving: "Économie de coûts Apify - sync 2x/semaine seulement"
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
      console.log("👤 Manual Top30 sync initiated");
    }

    // Appeler la fonction de synchronisation Apify existante
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-top30-apify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        automated: isAutomated
      })
    });

    const syncResult = await syncResponse.json();
    
    // Log pour monitoring
    console.log("📊 Top30 sync result:", {
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
        message: `Auto-sync Top30 completed: ${syncResult.entriesSaved || 0} entries updated`,
        automated: isAutomated,
        syncResult: syncResult,
        timestamp: new Date().toISOString(),
        nextSync: getNextTop30SyncTime(),
        costSaving: "Économie de coûts Apify - sync 2x/semaine seulement"
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('❌ Auto-sync Top30 error:', error);
    
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
 * Calcule la prochaine synchronisation du Top30
 * 2 fois par semaine: Lundi et Jeudi à 9h EST
 */
function getNextTop30SyncTime(): string {
  const now = new Date();
  const currentDay = now.getDay();
  const syncDays = [1, 4]; // Lundi et Jeudi
  const syncHour = 9; // 9h EST
  
  const isDST = isDaylightSavingTime(now);
  const utcOffset = isDST ? 4 : 5;
  const syncHourUTC = (syncHour + utcOffset) % 24;
  
  let nextSyncDay = syncDays.find(day => {
    if (day > currentDay) return true;
    if (day === currentDay && now.getUTCHours() < syncHourUTC) return true;
    return false;
  });
  
  if (!nextSyncDay) {
    nextSyncDay = syncDays[0];
    now.setUTCDate(now.getUTCDate() + (7 - currentDay + nextSyncDay));
  } else {
    const daysToAdd = nextSyncDay - currentDay;
    if (daysToAdd > 0) {
      now.setUTCDate(now.getUTCDate() + daysToAdd);
    }
  }
  
  now.setUTCHours(syncHourUTC, 0, 0, 0);
  return now.toISOString();
}

function getDayName(dayNumber: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber];
}

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

function isDaylightSavingTime(date: Date): boolean {
  const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  return Math.max(jan, jul) !== date.getTimezoneOffset();
}