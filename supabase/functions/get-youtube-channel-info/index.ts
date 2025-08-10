/*
  # Get YouTube Channel Info Function
  
  Récupère les informations d'une chaîne YouTube (nom, Channel ID) 
  à partir de son URL en utilisant l'API YouTube Data v3
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface YouTubeChannelInfo {
  channelId: string;
  title: string;
  description?: string;
  subscriberCount?: string;
  videoCount?: string;
  customUrl?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      throw new Error('URL YouTube requise');
    }

    console.log('🔍 Récupération des infos pour:', url);

    const youtubeApiKeys: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const key = Deno.env.get(`YOUTUBE_API_KEY_${i}`);
      if (key) {
        youtubeApiKeys.push(key);
      }
    }
    if (youtubeApiKeys.length === 0) {
      throw new Error('Aucune clé API YouTube trouvée dans les variables d\'environnement (YOUTUBE_API_KEY_1, YOUTUBE_API_KEY_2, etc.)');
    }

    console.log(`🔑 ${youtubeApiKeys.length} clés API YouTube disponibles`);

    // Extraire l'identifiant de la chaîne depuis l'URL
    const channelIdentifier = extractChannelIdentifier(url);
    if (!channelIdentifier) {
      throw new Error('Format d\'URL YouTube non reconnu');
    }

    console.log('📋 Identifiant extrait:', channelIdentifier);

    // Récupérer les informations via l'API YouTube
    const channelInfo = await getChannelInfo(youtubeApiKeys, channelIdentifier);

    return new Response(
      JSON.stringify({
        success: true,
        channelInfo,
        message: 'Informations récupérées avec succès'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('❌ Erreur:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Erreur lors de la récupération des informations'
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
 * Extrait l'identifiant de chaîne depuis une URL YouTube
 */
function extractChannelIdentifier(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Format: youtube.com/channel/UCxxxxx
    if (urlObj.pathname.startsWith('/channel/')) {
      return urlObj.pathname.replace('/channel/', '');
    }
    
    // Format: youtube.com/@username
    if (urlObj.pathname.startsWith('/@')) {
      return urlObj.pathname.replace('/@', '');
    }
    
    // Format: youtube.com/c/username
    if (urlObj.pathname.startsWith('/c/')) {
      return urlObj.pathname.replace('/c/', '');
    }
    
    // Format: youtube.com/user/username
    if (urlObj.pathname.startsWith('/user/')) {
      return urlObj.pathname.replace('/user/', '');
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Récupère les informations de la chaîne via l'API YouTube
 */
async function getChannelInfo(apiKeys: string[], identifier: string): Promise<YouTubeChannelInfo> {
  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    console.log(`🔑 Tentative avec la clé API ${i + 1}/${apiKeys.length}`);
    
    try {
      let apiUrl = '';
      
      // Si l'identifiant commence par UC, c'est un Channel ID
      if (identifier.startsWith('UC')) {
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${identifier}&key=${apiKey}`;
      } else {
        // Sinon, c'est un nom d'utilisateur ou handle
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${identifier}&key=${apiKey}`;
      }

      console.log('🌐 Appel API YouTube:', apiUrl.replace(apiKey, 'API_KEY_HIDDEN'));

      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
          // Si forHandle n'a pas fonctionné, essayer avec search API
          if (!identifier.startsWith('UC')) {
            const fallbackUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${identifier}&key=${apiKey}`;
            
            console.log('🔄 Tentative avec search API...');
            
            const searchResponse = await fetch(fallbackUrl);
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              if (searchData.items && searchData.items.length > 0) {
                const channelId = searchData.items[0].snippet.channelId;
                // Appel récursif avec le channelId trouvé et la même clé API
                return await getChannelInfo([apiKey], channelId);
              }
            }
          }
          // Si toujours aucun résultat, essayer la clé suivante
          continue;
        }

        console.log(`✅ Succès avec la clé API ${i + 1}`);
        
        const channel = data.items[0];
        const snippet = channel.snippet;
        const statistics = channel.statistics;

        return {
          channelId: channel.id,
          title: snippet.title,
          description: snippet.description,
          subscriberCount: statistics?.subscriberCount,
          videoCount: statistics?.videoCount,
          customUrl: snippet.customUrl
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur API YouTube:', errorData);
        
        if (response.status === 403 && (errorData.error?.errors?.[0]?.reason === 'quotaExceeded' || errorData.error?.message?.includes('quota'))) {
          console.warn(`🚫 Quota dépassé pour la clé API ${i + 1}, tentative avec la clé suivante...`);
          continue; // Essayer la clé suivante
        } else if (response.status === 404) {
          throw new Error('Chaîne YouTube introuvable');
        } else {
          console.warn(`❌ Erreur avec la clé API ${i + 1}: HTTP ${response.status}`);
          continue; // Essayer la clé suivante
        }
      }
    } catch (error) {
      console.warn(`❌ Erreur avec la clé API ${i + 1}:`, error);
      if (i === apiKeys.length - 1) {
        // Si c'est la dernière clé, relancer l'erreur
        throw error;
      }
      continue; // Essayer la clé suivante
    }
  }
  
  throw new Error('🚫 Toutes les clés API YouTube sont épuisées ou invalides');
}