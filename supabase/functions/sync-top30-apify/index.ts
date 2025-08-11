/*
  # Sync Top30 from Apify Function
  
  Synchronise le Top 30 Country depuis Apify vers Supabase
  Économise les coûts en ne synchronisant que 2x/semaine (Lundi & Jeudi)
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface Top30Item {
  rank: number;
  title: string;
  artist: string;
  appleMusicUrl?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("🎵 Démarrage de la synchronisation Top30 depuis Apify...");
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apifyToken = Deno.env.get('VITE_APIFY_API_TOKEN');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Vérifier si c'est un appel automatisé
    const body = await req.json().catch(() => ({}));
    const isAutomated = body.automated === true;
    
    if (isAutomated) {
      // Vérifier si c'est le bon jour (Lundi = 1, Jeudi = 4)
      const now = new Date();
      const dayOfWeek = now.getDay();
      
      if (dayOfWeek !== 1 && dayOfWeek !== 4) {
        console.log(`⏭️ Sync ignorée - Aujourd'hui c'est ${getDayName(dayOfWeek)}, sync seulement Lundi et Jeudi`);
        return new Response(
          JSON.stringify({
            success: true,
            message: `Sync ignorée - Aujourd'hui c'est ${getDayName(dayOfWeek)}, prochaine sync ${getNextSyncDay()}`,
            skipped: true,
            nextSync: getNextTop30SyncTime(),
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
    }

    // ÉTAPE 1: Déclencher un nouvel Actor run Apify pour scraper les données fraîches
    console.log("🚀 Déclenchement d'un nouvel Actor run Apify...");
    
    if (!apifyToken) {
      throw new Error('Token Apify requis pour déclencher un actor run');
    }

    // Configuration de l'Actor input pour scraper PopVortex
    const actorInput = {
      "runMode": "PRODUCTION",
      "startUrls": [
        {
          "url": "https://www.popvortex.com/music/charts/top-country-songs.php"
        }
      ],
      "waitUntil": ["networkidle2"],
      "navigationTimeoutSecs": 30,
      "keepUrlFragments": false,
      "respectRobotsTxtFile": true,
      "linkSelector": "a[href]",
      "globs": [],
      "pseudoUrls": [],
      "excludes": [],
      "pageFunction": `
        async function pageFunction(context) {
          const { request } = context;

          // 1) Chaque entrée a une image avec alt = "Titre - Artiste Cover Art"
          const imgs = Array.from(document.querySelectorAll('img[alt$="Cover Art"]'));
          const items = [];

          for (let i = 0; i < imgs.length && items.length < 30; i++) {
            const img = imgs[i];

            // Titre / artiste depuis l'attribut alt
            const alt = img.getAttribute('alt') || '';
            const m = alt.match(/^(.*?)\\s*-\\s*(.*?)\\s+Cover Art$/);
            const title = (m && m[1]) ? m[1].trim() : '';
            const artist = (m && m[2]) ? m[2].trim() : '';

            // 2) Remonter à un conteneur raisonnable puis chercher le lien Apple
            // (sur la page, c'est l'ancre "Apple Music / iTunes" vers music.apple.com)
            let appleMusicUrl = '';
            let node = img;
            // On monte un peu dans le DOM pour tomber sur le bloc qui contient l'ancre
            for (let up = 0; up < 5 && node; up++) {
              const link = node.querySelector && node.querySelector('a[href*="music.apple.com"]');
              if (link && link.href) {
                appleMusicUrl = link.href;
                break;
              }
              node = node.parentElement;
            }

            if (title) {
              items.push({
                rank: items.length + 1,
                title,
                artist,
                appleMusicUrl
              });
            }
          }

          return {
            url: request.url,
            extractedAt: new Date().toISOString(),
            items
          };
        }
      `,
      "injectJQuery": true,
      "proxyConfiguration": {
        "useApifyProxy": true
      },
      "maxPagesPerCrawl": 1,
      "maxConcurrency": 1,
      "pageLoadTimeoutSecs": 30
    };

    // Déclencher l'Actor run
    const runResponse = await fetch(`https://api.apify.com/v2/acts/moJRLRc85AitArpNN/runs?token=${apifyToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(actorInput)
    });

    if (!runResponse.ok) {
      throw new Error(`Erreur lors du déclenchement de l'Actor: ${runResponse.status} ${runResponse.statusText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    console.log(`🎯 Actor run démarré: ${runId}`);

    // Attendre que le run se termine (polling)
    let runStatus = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max

    while (runStatus === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Attendre 10 secondes
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/moJRLRc85AitArpNN/runs/${runId}?token=${apifyToken}`);
      const statusData = await statusResponse.json();
      runStatus = statusData.data.status;
      attempts++;
      
      console.log(`⏳ Status du run: ${runStatus} (tentative ${attempts}/${maxAttempts})`);
    }

    if (runStatus !== 'SUCCEEDED') {
      throw new Error(`Actor run échoué ou timeout. Status: ${runStatus}`);
    }

    // Récupérer les résultats du dataset
    console.log("📥 Récupération des résultats du scraping...");
    
    // D'abord récupérer les infos du run pour obtenir le defaultDatasetId
    const runInfoResponse = await fetch(`https://api.apify.com/v2/acts/moJRLRc85AitArpNN/runs/${runId}?token=${apifyToken}`);
    if (!runInfoResponse.ok) {
      throw new Error(`Erreur lors de la récupération des infos du run: ${runInfoResponse.status}`);
    }
    
    const runInfo = await runInfoResponse.json();
    const datasetId = runInfo.data.defaultDatasetId;
    console.log(`📊 Dataset ID: ${datasetId}`);
    
    // Maintenant récupérer les résultats du dataset
    const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?format=json&token=${apifyToken}`);
    
    if (!resultsResponse.ok) {
      throw new Error(`Erreur lors de la récupération des résultats: ${resultsResponse.status}`);
    }

    const data = await resultsResponse.json();
    console.log('📊 Données reçues:', data);

    // Si aucune donnée, récupérer les logs pour debug
    if (!data || data.length === 0) {
      console.log("🔍 Aucune donnée récupérée, récupération des logs pour debug...");
      
      try {
        const logsResponse = await fetch(`https://api.apify.com/v2/acts/moJRLRc85AitArpNN/runs/${runId}/log?token=${apifyToken}`);
        if (logsResponse.ok) {
          const logs = await logsResponse.text();
          console.log("📋 Logs Apify (dernières 2000 chars):");
          console.log(logs.slice(-2000)); // Derniers 2000 caractères des logs
        }
      } catch (logError) {
        console.log("❌ Impossible de récupérer les logs:", logError);
      }
    }

    // Vérifier la structure des données
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Aucune donnée récupérée du scraping');
    }

    const firstObject = data[0];
    if (!firstObject || !Array.isArray(firstObject.items)) {
      throw new Error('Format de données invalide: propriété "items" manquante');
    }

    const top30Items: Top30Item[] = firstObject.items.map((item: any, index: number) => ({
      rank: item.rank || index + 1,
      title: item.title || 'Titre inconnu',
      artist: item.artist || 'Artiste inconnu',
      appleMusicUrl: item.appleMusicUrl || undefined
    }));

    console.log(`✅ ${top30Items.length} éléments du Top 30 récupérés depuis Apify`);

    // ÉTAPE 2: Supprimer TOUTES les anciennes données (remplacement complet)
    const today = new Date().toISOString().split('T')[0];
    
    console.log("🗑️ Suppression de toutes les anciennes données Top30...");
    
    // Méthode plus robuste : supprimer par chunks si nécessaire
    const { data: existingData, error: selectError } = await supabase
      .from('top30_country')
      .select('id')
      .limit(1000);

    if (selectError) {
      console.warn("⚠️ Erreur lors de la vérification des données existantes:", selectError);
    }

    if (existingData && existingData.length > 0) {
      console.log(`📊 ${existingData.length} entrées existantes trouvées, suppression en cours...`);
      
      const { error: deleteError } = await supabase
        .from('top30_country')
        .delete()
        .not('id', 'is', null); // Supprime toutes les entrées (compatible UUID)

      if (deleteError) {
        console.error("❌ Erreur lors de la suppression des anciennes données:", deleteError);
        throw new Error(`Impossible de supprimer les anciennes données: ${deleteError.message}`);
      } else {
        console.log("✅ Toutes les anciennes données supprimées avec succès");
      }
    } else {
      console.log("ℹ️ Aucune donnée existante à supprimer");
    }

    // ÉTAPE 3: Insérer les nouvelles données
    const dataToInsert = top30Items.map(item => ({
      rank: item.rank,
      title: item.title.trim(),
      artist: item.artist.trim(),
      apple_music_url: item.appleMusicUrl || null,
      chart_date: today,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data: insertedData, error: insertError } = await supabase
      .from('top30_country')
      .insert(dataToInsert)
      .select();

    if (insertError) {
      throw new Error(`Erreur Supabase: ${insertError.message}`);
    }

    console.log(`✅ ${insertedData?.length || 0} entrées sauvegardées dans Supabase`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Top30 synchronisé avec succès: ${insertedData?.length || 0} entrées mises à jour`,
        entriesProcessed: top30Items.length,
        entriesSaved: insertedData?.length || 0,
        automated: isAutomated,
        timestamp: new Date().toISOString(),
        nextSync: getNextTop30SyncTime(),
        costSaving: "Sync 2x/semaine pour économiser les coûts Apify"
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation Top30:', error);
    
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
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[dayNumber];
}

function getNextSyncDay(): string {
  const now = new Date();
  const currentDay = now.getDay();
  
  if (currentDay < 1 || (currentDay === 1 && now.getHours() >= 9)) {
    return currentDay < 4 ? 'Jeudi' : 'Lundi';
  } else if (currentDay < 4 || (currentDay === 4 && now.getHours() >= 9)) {
    return 'Lundi';
  } else {
    return 'Lundi';
  }
}

function isDaylightSavingTime(date: Date): boolean {
  const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  return Math.max(jan, jul) !== date.getTimezoneOffset();
}