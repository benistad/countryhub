/*
  # Test simple RSS Music Row
  
  Version simplifiée pour diagnostiquer le problème
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
    error: null,
    xmlPreview: '',
    itemsFound: 0,
    success: false
  };

  try {
    debugInfo.step = "Initialisation";
    debugInfo.details = "Démarrage du test RSS Music Row";
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test 1: Télécharger le RSS
    debugInfo.step = "Téléchargement RSS";
    debugInfo.details = "Tentative de téléchargement depuis plusieurs sources RSS";
    
    // Essayons plusieurs sources RSS country
    const rssSources = [
      "https://feeds.feedburner.com/TasteOfCountry",
      "https://musicrow.com/feed/",
      "https://musicrow.com/rss-feed/",
      "https://www.countryairplay.com/feed/"
    ];
    
    let xmlText = '';
    let successUrl = '';
    
    for (const rssUrl of rssSources) {
      try {
        debugInfo.details += ` | Essai: ${rssUrl}`;
        
        const response = await fetch(rssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache'
          }
        });

        if (response.ok) {
          xmlText = await response.text();
          successUrl = rssUrl;
          debugInfo.details += ` | Succès avec: ${rssUrl}`;
          break;
        } else {
          debugInfo.details += ` | Échec ${response.status}`;
        }
      } catch (error) {
        debugInfo.details += ` | Erreur: ${error.message}`;
        continue;
      }
    }

    if (!xmlText) {
      debugInfo.error = "Aucune source RSS accessible";
      throw new Error(debugInfo.error);
    }
    
    debugInfo.step = "Analyse du contenu";
    debugInfo.details = `RSS téléchargé depuis ${successUrl}: ${xmlText.length} caractères`;
    debugInfo.xmlPreview = xmlText.substring(0, 500);
    
    // Test 2: Vérifier le contenu
    const patterns = [
      /<item[\s\S]*?<\/item>/gi,
      /<entry[\s\S]*?<\/entry>/gi,
      /<article[\s\S]*?<\/article>/gi,
      /<post[\s\S]*?<\/post>/gi
    ];
    
    let itemMatches = [];
    let patternUsed = '';
    
    for (let i = 0; i < patterns.length; i++) {
      const matches = xmlText.match(patterns[i]) || [];
      if (matches.length > 0) {
        itemMatches = matches;
        patternUsed = ['item', 'entry', 'article', 'post'][i];
        break;
      }
    }
    
    debugInfo.details += ` | Pattern utilisé: ${patternUsed} | Items trouvés: ${itemMatches.length}`;
    
    if (itemMatches.length === 0) {
      debugInfo.error = "Aucun item trouvé dans le XML";
      debugInfo.details += ` | Aperçu XML: ${xmlText.substring(0, 1000)}`;
    }

    debugInfo.itemsFound = itemMatches.length;
    debugInfo.step = "Extraction des articles";

    let articles = [];
    
    if (itemMatches.length > 0) {
      // Prendre seulement le premier item pour test
      const firstItem = itemMatches[0];
      debugInfo.details += ` | Premier ${patternUsed}: ${firstItem.substring(0, 200)}...`;
      
      // Extraction améliorée avec plusieurs patterns
      const titlePatterns = [
        /<title[^>]*>(.*?)<\/title>/i,
        /<dc:title[^>]*>(.*?)<\/dc:title>/i,
        /<name[^>]*>(.*?)<\/name>/i
      ];
      
      const descPatterns = [
        /<description[^>]*>(.*?)<\/description>/i,
        /<summary[^>]*>(.*?)<\/summary>/i,
        /<content[^>]*>(.*?)<\/content>/i,
        /<dc:description[^>]*>(.*?)<\/dc:description>/i
      ];
      
      let title = '';
      let description = '';
      
      // Essayer tous les patterns pour le titre
      for (const pattern of titlePatterns) {
        const match = firstItem.match(pattern);
        if (match) {
          title = match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
          break;
        }
      }
      
      // Essayer tous les patterns pour la description
      for (const pattern of descPatterns) {
        const match = firstItem.match(pattern);
        if (match) {
          description = match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
          break;
        }
      }
      
      if (title && description) {
        debugInfo.details += ` | Titre: "${title.substring(0, 50)}..." | Description: "${description.substring(0, 50)}..."`;
        
        articles.push({
          title: title,
          summary: description.substring(0, 300),
          content: description,
          image_url: null,
          published_at: new Date().toISOString()
        });
      } else {
        debugInfo.details += ` | Extraction échouée - Titre: "${title}" | Description: "${description}"`;
      }
    }

    // Test 4: Insertion en base
    debugInfo.step = "Insertion en base";
    let imported = 0;
    if (articles.length > 0) {
      debugInfo.details += " | Tentative d'insertion en base";
      
      const { error } = await supabase
        .from('news')
        .insert(articles[0]);

      if (error) {
        debugInfo.error = `Erreur insertion: ${error.message}`;
      } else {
        imported = 1;
        debugInfo.success = true;
        debugInfo.details += " | Article inséré avec succès";
      }
    }

    return new Response(
      JSON.stringify({
        success: debugInfo.success,
        message: debugInfo.success ? "Test réussi" : `Test échoué: ${debugInfo.error}`,
        totalImported: imported,
        timestamp: new Date().toISOString(),
        debug: debugInfo,
        error: debugInfo.error
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    debugInfo.error = error instanceof Error ? error.message : String(error);
    debugInfo.step = debugInfo.step || "Erreur inconnue";
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erreur: ${debugInfo.error}`,
        totalImported: 0,
        timestamp: new Date().toISOString(),
        debug: debugInfo,
        error: debugInfo.error
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