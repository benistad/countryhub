/*
  # Populate Uploads Playlist IDs Function
  
  One-time function to populate uploads_playlist_id for existing channels
  This should be run once after the migration to avoid repeated API calls
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
    console.log('🚀 Démarrage de la population des uploads playlist IDs');
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const youtubeApiKeys: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const key = Deno.env.get(`YOUTUBE_API_KEY_${i}`);
      if (key) youtubeApiKeys.push(key);
    }
    
    if (youtubeApiKeys.length === 0) {
      throw new Error('Aucune clé API YouTube trouvée');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer les chaînes sans uploads_playlist_id
    const { data: channels, error } = await supabase
      .from('youtube_channels')
      .select('*')
      .is('uploads_playlist_id', null);

    if (error) {
      throw new Error(`Erreur récupération chaînes: ${error.message}`);
    }

    if (!channels || channels.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Toutes les chaînes ont déjà leur uploads playlist ID',
          processed: 0
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    console.log(`📺 ${channels.length} chaînes à traiter`);

    let processed = 0;
    let errors = 0;

    for (const channel of channels) {
      try {
        console.log(`🔍 Traitement: ${channel.artist}`);
        
        const uploadsPlaylistId = await getUploadsPlaylistId(youtubeApiKeys, channel.channel_id);
        
        await supabase
          .from('youtube_channels')
          .update({ uploads_playlist_id: uploadsPlaylistId })
          .eq('id', channel.id);
        
        processed++;
        console.log(`✅ ${channel.artist}: ${uploadsPlaylistId}`);
        
        // Pause pour éviter rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errors++;
        console.error(`❌ Erreur ${channel.artist}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Population terminée: ${processed} chaînes traitées, ${errors} erreurs`,
        processed,
        errors,
        total: channels.length
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
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

async function getUploadsPlaylistId(apiKeys: string[], channelId: string): Promise<string> {
  for (const apiKey of apiKeys) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) continue;
      
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].contentDetails.relatedPlaylists.uploads;
      }
    } catch (error) {
      continue;
    }
  }
  
  throw new Error('Impossible de récupérer l\'uploads playlist ID');
}