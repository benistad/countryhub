/*
  # RSS Proxy Edge Function
  
  Proxy simple pour contourner les problèmes CORS avec les flux RSS
  Récupère le flux RSS et le retourne avec les headers CORS appropriés
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    // Récupérer l'URL du flux RSS depuis les paramètres
    const url = new URL(req.url);
    const rssUrl = url.searchParams.get('url') || 'https://musicrow.com/rss-feed/';
    
    console.log(`📡 Proxy RSS pour: ${rssUrl}`);

    // Récupérer le flux RSS avec des headers appropriés
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log(`✅ RSS récupéré: ${xmlText.length} caractères`);

    // Retourner le XML avec les headers CORS
    return new Response(xmlText, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('❌ Erreur proxy RSS:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Erreur proxy RSS',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
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