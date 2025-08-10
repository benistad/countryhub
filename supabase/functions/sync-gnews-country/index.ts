/*
  # GNews API Country Music Integration

  1. Purpose
    - Fetches country music news from GNews API
    - Stores in country_news table with duplicate prevention
    - Provides fresh, high-quality news with images

  2. Features
    - Direct GNews API integration (no RSS parsing needed)
    - Real article images from GNews
    - Comprehensive article metadata
    - Duplicate detection by URL
    - Automatic cleanup of old articles
    - Comprehensive error handling

  3. Data Structure
    - title: Article headline
    - link: Full article URL
    - pub_date: Publication timestamp
    - description: Article summary
    - image_url: Article image from GNews
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface NewsArticle {
  title: string;
  link: string;
  pub_date: string;
  description: string;
  image_url?: string | null;
}

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
    error: null,
    articlesFound: 0,
    articlesImported: 0,
    success: false,
    sourceUsed: 'gnews-api'
  };

  try {
    debugInfo.step = "Initialisation";
    debugInfo.details = "Démarrage de l'import GNews API pour country music";
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Configuration GNews API
    const GNEWS_API_KEY = Deno.env.get('GNEWS_API_KEY') || '51b0d3ddea619a88159c2a793a9dca83';
    const GNEWS_BASE_URL = 'https://gnews.io/api/v4/search';

    // ÉTAPE 1: Récupérer les articles depuis GNews API
    debugInfo.step = "Récupération GNews API";
    debugInfo.details = "Appel à l'API GNews pour country music";
    
    const params = new URLSearchParams({
      q: 'country music',
      lang: 'en',
      country: 'us',
      max: '20', // Récupérer plus d'articles pour avoir du choix
      apikey: GNEWS_API_KEY
    });
    
    const gnewsResponse = await fetch(`${GNEWS_BASE_URL}?${params}`);
    
    if (!gnewsResponse.ok) {
      throw new Error(`GNews API HTTP ${gnewsResponse.status}`);
    }
    
    const gnewsData = await gnewsResponse.json();
    
    if (!gnewsData.articles || !Array.isArray(gnewsData.articles)) {
      throw new Error('Format de réponse GNews invalide');
    }
    
    debugInfo.articlesFound = gnewsData.articles.length;
    console.log(`📰 ${debugInfo.articlesFound} articles trouvés via GNews API`);

    // ÉTAPE 2: Transformer les articles au format Supabase
    const newsArticles: NewsArticle[] = gnewsData.articles.map((article: any) => ({
      title: article.title || '',
      link: article.url || '',
      pub_date: article.publishedAt || new Date().toISOString(),
      description: article.description || '',
      image_url: article.image || null
    }));

    // ÉTAPE 3: Insérer les articles dans Supabase (avec gestion des doublons)
    debugInfo.step = "Insertion Supabase";
    debugInfo.details = "Insertion des articles avec gestion des doublons";
    
    let importedCount = 0;
    
    for (const article of newsArticles) {
      try {
        // Vérifier si l'article existe déjà
        const { data: existing } = await supabase
          .from('country_news')
          .select('id')
          .eq('link', article.link)
          .single();
        
        if (!existing) {
          // Insérer le nouvel article
          const { error: insertError } = await supabase
            .from('country_news')
            .insert([article]);
          
          if (insertError) {
            console.error(`❌ Erreur insertion article: ${insertError.message}`);
          } else {
            importedCount++;
            console.log(`✅ Article importé: ${article.title}`);
          }
        } else {
          console.log(`⏭️ Article déjà existant: ${article.title}`);
        }
      } catch (error) {
        console.error(`❌ Erreur traitement article: ${error}`);
      }
    }
    
    debugInfo.articlesImported = importedCount;

    // ÉTAPE 4: Nettoyer les anciens articles (garder seulement les 50 plus récents)
    debugInfo.step = "Nettoyage";
    debugInfo.details = "Suppression des anciens articles";
    
    const { error: cleanupError } = await supabase
      .from('country_news')
      .delete()
      .not('id', 'in', `(
        SELECT id FROM country_news 
        ORDER BY pub_date DESC 
        LIMIT 50
      )`);
    
    if (cleanupError) {
      console.warn(`⚠️ Erreur nettoyage: ${cleanupError.message}`);
    } else {
      console.log(`🧹 Nettoyage des anciens articles effectué`);
    }

    debugInfo.success = true;
    debugInfo.details = `Import terminé: ${importedCount}/${debugInfo.articlesFound} articles importés`;

    return new Response(JSON.stringify({
      success: true,
      message: `Synchronisation GNews réussie: ${importedCount} nouveaux articles importés`,
      debug: debugInfo
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    debugInfo.error = error.message;
    console.error('❌ Erreur synchronisation GNews:', error);
    
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
