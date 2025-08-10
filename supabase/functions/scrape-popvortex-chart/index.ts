/*
  # PopVortex Country Chart Parser avec API GPT

  1. Télécharge le HTML de PopVortex
  2. Utilise l'API GPT pour parser et extraire le classement
  3. Sauvegarde les données dans Supabase
  4. Retourne le résultat formaté
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ChartEntry {
  position: number;
  title: string;
  artist: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Déterminer si c'est un appel automatisé ou manuel
    const body = await req.json().catch(() => ({}));
    const isAutomated = body.automated === true;
    const syncType = isAutomated ? 'Automatique' : 'Manuel';
    
    console.log("🚀 Démarrage du parsing PopVortex avec GPT");
    console.log(`📋 Type de synchronisation: ${syncType}`);
    
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const { OpenAI } = await import("npm:openai@4");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      throw new Error("Clé API OpenAI manquante dans les variables d'environnement");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const openai = new OpenAI({ apiKey: openaiKey });

    // ÉTAPE 1: Télécharger le contenu HTML
    console.log("📥 Téléchargement du HTML depuis PopVortex...");
    const htmlContent = await downloadHTML();

    // ÉTAPE 2: Parser avec GPT
    console.log("🤖 Parsing du HTML avec l'API GPT...");
    const chartData = await parseWithGPT(openai, htmlContent);

    // ÉTAPE 3: Sauvegarder dans Supabase
    console.log("💾 Sauvegarde dans Supabase...");
    const savedCount = await saveToSupabase(supabase, chartData, syncType);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Classement mis à jour avec succès (${syncType})`,
        entriesProcessed: chartData.length,
        entriesSaved: savedCount,
        syncType: syncType,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('❌ Erreur lors du parsing:', error);
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
 * ÉTAPE 1: Télécharge le contenu HTML complet de PopVortex
 * @returns {Promise<string>} Le contenu HTML brut
 */
async function downloadHTML(): Promise<string> {
  const url = "https://www.popvortex.com/music/charts/top-country-songs.php";
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    }
  });

  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} lors du téléchargement`);
  }

  const html = await response.text();
  console.log(`✅ HTML téléchargé (${html.length} caractères)`);
  
  return html;
}

/**
 * ÉTAPE 2: Utilise l'API GPT pour parser le HTML et extraire le classement
 * @param {OpenAI} openai - Instance OpenAI
 * @param {string} htmlContent - Contenu HTML brut
 * @returns {Promise<ChartEntry[]>} Données du classement parsées
 */
async function parseWithGPT(openai: any, htmlContent: string): Promise<ChartEntry[]> {
  const prompt = `Voici une page HTML contenant le classement des chansons Country depuis PopVortex. Peux-tu extraire les 50 premières positions et me retourner un JSON au format :
[
  {
    "position": 1,
    "title": "Titre de la chanson",
    "artist": "Nom de l'artiste"
  }
]

Règles importantes :
- Retourne UNIQUEMENT le JSON, aucun autre texte
- Assure-toi que les titres et artistes sont propres (sans informations supplémentaires)
- Ignore toute autre information comme les genres, dates, liens d'achat
- Si tu ne trouves pas 50 entrées, retourne ce que tu peux trouver
- Les positions doivent être des nombres entiers

Voici le HTML :

${htmlContent}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1, // Faible température pour plus de précision
      max_tokens: 4000,
    });

    const gptResponse = completion.choices[0]?.message?.content;
    
    if (!gptResponse) {
      throw new Error("Aucune réponse de GPT");
    }

    console.log("🤖 Réponse GPT reçue, parsing JSON...");
    
    // Nettoyer la réponse au cas où GPT ajoute du texte avant/après le JSON
    const jsonMatch = gptResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Aucun JSON valide trouvé dans la réponse GPT");
    }

    const chartData = JSON.parse(jsonMatch[0]) as ChartEntry[];
    
    // Validation des données
    const validEntries = chartData.filter(entry => 
      entry.position && 
      entry.title && 
      entry.artist &&
      typeof entry.position === 'number' &&
      typeof entry.title === 'string' &&
      typeof entry.artist === 'string'
    );

    console.log(`✅ ${validEntries.length} entrées valides extraites par GPT`);
    
    return validEntries;

  } catch (error) {
    console.error("❌ Erreur lors du parsing GPT:", error);
    throw new Error(`Erreur parsing GPT: ${error.message}`);
  }
}

/**
 * ÉTAPE 3: Sauvegarde les données dans Supabase
 * @param {any} supabase - Client Supabase
 * @param {ChartEntry[]} chartData - Données du classement
 * @param {string} syncType - Type de synchronisation (Manuel/Automatique)
 * @returns {Promise<number>} Nombre d'entrées sauvegardées
 */
async function saveToSupabase(supabase: any, chartData: ChartEntry[], syncType: string): Promise<number> {
  try {
    // Supprimer les anciennes données du jour
    const today = new Date().toISOString().split('T')[0];
    
    const { error: deleteError } = await supabase
      .from('country_chart')
      .delete()
      .eq('chart_date', today);

    if (deleteError) {
      console.warn("⚠️ Erreur lors de la suppression des anciennes données:", deleteError);
    }

    // Préparer les données pour l'insertion
    const dataToInsert = chartData.map(entry => ({
      position: entry.position,
      title: entry.title.trim(),
      artist: entry.artist.trim(),
      chart_date: today,
      sync_type: syncType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Insérer les nouvelles données
    const { data, error } = await supabase
      .from('country_chart')
      .insert(dataToInsert)
      .select();

    if (error) {
      throw new Error(`Erreur Supabase: ${error.message}`);
    }

    console.log(`✅ ${data?.length || 0} entrées sauvegardées dans Supabase`);
    
    return data?.length || 0;

  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde:", error);
    throw error;
  }
}