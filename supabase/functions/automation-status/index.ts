/*
  # Automation Status Function
  
  Fonction pour vérifier le statut des automatisations
  et afficher les prochaines synchronisations
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
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer les dernières synchronisations
    const [videosData, chartData, newsData] = await Promise.all([
      supabase.from('videos').select('created_at').order('created_at', { ascending: false }).limit(1),
      supabase.from('country_chart').select('created_at').order('created_at', { ascending: false }).limit(1),
      supabase.from('country_news').select('created_at').order('created_at', { ascending: false }).limit(1)
    ]);

    const now = new Date();
    
    // Calculer les prochaines synchronisations
    const nextVideoSync = getNextVideoSyncTime();
    const nextChartSync = getNextChartSyncTime();
    
    const status = {
      timestamp: now.toISOString(),
      timezone: 'EST/EDT',
      automations: {
        videos: {
          frequency: '1 time per day',
          schedule: '9h EST',
          lastSync: videosData.data?.[0]?.created_at || null,
          nextSync: nextVideoSync,
          status: 'active'
        },
        chart: {
          frequency: '2 times per week',
          schedule: 'Monday and Thursday at 9h EST',
          lastSync: chartData.data?.[0]?.created_at || null,
          nextSync: nextChartSync,
          status: 'active'
        },
        news: {
          frequency: 'RSS widget (real-time)',
          schedule: 'Continuous via RSS.app',
          lastSync: newsData.data?.[0]?.created_at || null,
          nextSync: 'Real-time',
          status: 'active'
        }
      },
      webhookUrls: {
        videos: `${supabaseUrl}/functions/v1/auto-sync-videos`,
        chart: `${supabaseUrl}/functions/v1/auto-sync-chart`,
        status: `${supabaseUrl}/functions/v1/automation-status`
      },
      instructions: {
        setup: 'Use external cron service (cron-job.org, EasyCron, etc.)',
        videosCron: '0 9 * * * (daily at 9 AM EST)',
        chartCron: '0 9 * * 1,4 (Monday and Thursday at 9 AM)'
      }
    };

    return new Response(
      JSON.stringify(status),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('❌ Automation status error:', error);
    
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
 * Calcule la prochaine synchronisation des vidéos
 */
function getNextVideoSyncTime(): string {
  const now = new Date();
  const syncHour = 9; // EST - une seule synchronisation par jour
  
  // Convertir en UTC
  const isDST = isDaylightSavingTime(now);
  const utcOffset = isDST ? 4 : 5;
  const syncHourUTC = (syncHour + utcOffset) % 24;
  
  const currentHourUTC = now.getUTCHours();
  
  // Si l'heure de sync n'est pas encore passée aujourd'hui
  if (currentHourUTC < syncHourUTC) {
    now.setUTCHours(syncHourUTC, 0, 0, 0);
  } else {
    // Sinon, programmer pour demain
    now.setUTCDate(now.getUTCDate() + 1);
    now.setUTCHours(syncHourUTC, 0, 0, 0);
  }
  
  return now.toISOString();
}

/**
 * Calcule la prochaine synchronisation du classement
 */
function getNextChartSyncTime(): string {
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

/**
 * Vérifie si on est en heure d'été
 */
function isDaylightSavingTime(date: Date): boolean {
  const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  return Math.max(jan, jul) !== date.getTimezoneOffset();
}