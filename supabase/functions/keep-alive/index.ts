/*
  # Keep-Alive Function pour Supabase
  
  Fonction qui maintient Supabase actif en effectuant des requêtes légères
  Empêche la mise en pause automatique pour inactivité
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
    console.log("🔄 Keep-alive ping at:", new Date().toISOString());
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Effectuer des requêtes légères sur chaque table pour maintenir l'activité
    const keepAliveQueries = await Promise.allSettled([
      // Compter les vidéos (requête très légère)
      supabase.from('videos').select('id', { count: 'exact', head: true }),
      
      // Compter les actualités
      supabase.from('country_news').select('id', { count: 'exact', head: true }),
      
      // Compter le classement
      supabase.from('country_chart').select('id', { count: 'exact', head: true }),
      
      // Compter les news générales
      supabase.from('news').select('id', { count: 'exact', head: true }),
      
      // Compter les charts songs
      supabase.from('chart_songs').select('id', { count: 'exact', head: true }),
      
      // Compter billboard chart
      supabase.from('billboard_chart').select('id', { count: 'exact', head: true })
    ]);

    // Analyser les résultats
    const results = keepAliveQueries.map((result, index) => {
      const tableNames = ['videos', 'country_news', 'country_chart', 'news', 'chart_songs', 'billboard_chart'];
      
      if (result.status === 'fulfilled') {
        return {
          table: tableNames[index],
          status: 'success',
          count: result.value.count || 0
        };
      } else {
        return {
          table: tableNames[index],
          status: 'error',
          error: result.reason?.message || 'Unknown error'
        };
      }
    });

    const successCount = results.filter(r => r.status === 'success').length;
    const totalTables = results.length;

    console.log(`✅ Keep-alive completed: ${successCount}/${totalTables} tables pinged successfully`);

    // Log des détails pour monitoring
    results.forEach(result => {
      if (result.status === 'success') {
        console.log(`📊 ${result.table}: ${result.count} records`);
      } else {
        console.warn(`⚠️ ${result.table}: ${result.error}`);
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Keep-alive ping successful: ${successCount}/${totalTables} tables active`,
        timestamp: new Date().toISOString(),
        results: results,
        uptime: {
          database: successCount > 0 ? 'active' : 'inactive',
          tablesChecked: totalTables,
          tablesActive: successCount
        }
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('❌ Keep-alive error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        message: 'Keep-alive ping failed'
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