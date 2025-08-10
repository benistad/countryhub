/*
  # Music Row RSS Feed Integration avec rss-parser

  1. Purpose
    - Fetches RSS feed from https://musicrow.com/rss-feed/
    - Uses rss-parser library to handle all RSS edge cases
    - Stores in country_news table with duplicate prevention

  2. Features
    - rss-parser handles all RSS formats automatically
    - Internal RSS proxy to bypass CORS
    - HTML sanitization with sanitize-html
    - Date parsing and formatting
    - Description truncation (200 chars max)
    - Duplicate detection by URL
    - Comprehensive error handling

  3. Data Structure
    - title: Article headline
    - link: Full article URL
    - pub_date: Publication timestamp
    - description: Article summary (max 200 chars, HTML cleaned)
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
    sourceUsed: '',
    feedInfo: null
  };

  try {
    debugInfo.step = "Initialisation";
    debugInfo.details = "Démarrage de l'import RSS Music Row avec rss-parser";
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const Parser = (await import('npm:rss-parser@3')).default;
    const sanitizeHtml = (await import('npm:sanitize-html@2')).default;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialiser rss-parser avec configuration personnalisée
    const parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      customFields: {
        feed: ['language', 'copyright', 'managingEditor'],
        item: [
          'dc:creator',
          'content:encoded',
          'media:content',
          'media:thumbnail', 
          'media:group',
          'enclosure',
          'image',
          'itunes:image',
          'thumbnail',
          'media:description'
        ]
      }
    });

    // ÉTAPE 1: Télécharger et parser le flux RSS
    debugInfo.step = "Téléchargement et parsing RSS";
    debugInfo.details = "Utilisation de rss-parser avec proxy interne";
    
    const rssUrl = "https://rss.app/feeds/t688IImTmg3OsguX.xml";
    let feed;

    try {
      // Essayer d'abord via notre proxy interne
      const proxyUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/rss-proxy?url=${encodeURIComponent(rssUrl)}`;
      
      debugInfo.details += ` | Tentative via proxy interne`;
      debugInfo.sourceUsed = 'proxy-interne';
      
      const xmlResponse = await fetch(proxyUrl, {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json',
        }
      });

      if (!xmlResponse.ok) {
        throw new Error(`Proxy RSS HTTP ${xmlResponse.status}`);
      }

      const xmlText = await xmlResponse.text();
      console.log(`📄 XML récupéré via proxy: ${xmlText.length} caractères`);
      console.log(`📄 Aperçu XML:`, xmlText.substring(0, 1000));

      // Parser le XML avec rss-parser
      feed = await parser.parseString(xmlText);
      
    } catch (proxyError) {
      console.warn("⚠️ Proxy interne échoué, tentative directe:", proxyError);
      
      // Fallback: tentative directe
      debugInfo.details += ` | Proxy échoué, tentative directe`;
      debugInfo.sourceUsed = 'direct';
      
      try {
        feed = await parser.parseURL(rssUrl);
      } catch (directError) {
        console.warn("⚠️ Tentative directe échouée, utilisation rss2json:", directError);
        
        // Fallback final: rss2json
        debugInfo.details += ` | Direct échoué, utilisation rss2json`;
        debugInfo.sourceUsed = 'rss2json';
        
        const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        const response = await fetch(rss2jsonUrl);
        const data = await response.json();
        
        if (data.status !== 'ok') {
          throw new Error(`rss2json error: ${data.message}`);
        }
        
        // Convertir le format rss2json vers le format rss-parser
        feed = {
          title: data.feed.title,
          description: data.feed.description,
          link: data.feed.url,
          items: data.items.map((item: any) => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            content: item.description,
            contentSnippet: item.description
          }))
        };
      }
    }

    debugInfo.feedInfo = {
      title: feed.title,
      description: feed.description,
      itemCount: feed.items?.length || 0
    };

    console.log("📊 Feed parsé avec succès:");
    console.log(`📰 Titre: ${feed.title}`);
    console.log(`📝 Description: ${feed.description}`);
    console.log(`📄 Articles trouvés: ${feed.items?.length || 0}`);

    if (!feed.items || feed.items.length === 0) {
      throw new Error("Aucun article trouvé dans le flux RSS");
    }

    debugInfo.articlesFound = feed.items.length;
    debugInfo.details += ` | ${feed.items.length} articles trouvés`;

    // ÉTAPE 2: Traiter chaque article
    debugInfo.step = "Traitement des articles";
    
    const articles: NewsArticle[] = [];
    const maxArticles = Math.min(feed.items.length, 25); // Limiter à 25 articles

    for (let i = 0; i < maxArticles; i++) {
      const item = feed.items[i];
      
      try {
        console.log(`📝 Traitement article ${i + 1}:`, {
          title: item.title?.substring(0, 50),
          link: item.link,
          pubDate: item.pubDate,
          rawItem: JSON.stringify(item, null, 2).substring(0, 500)
        });
        
        const article = processRSSItem(item, sanitizeHtml, i + 1);
        if (article) {
          articles.push(article);
          console.log(`✅ Article traité: ${article.title.substring(0, 50)}... ${article.image_url ? '🖼️' : '📝'}`);
        } else {
          console.log(`⚠️ Article ${i + 1} ignoré (données manquantes)`);
        }
      } catch (error) {
        console.warn(`⚠️ Erreur traitement article ${i + 1}:`, error);
      }
    }

    debugInfo.details += ` | ${articles.length} articles traités`;

    if (articles.length === 0) {
      throw new Error("Aucun article valide extrait du flux RSS");
    }

    // ÉTAPE 3: Insérer en base de données
    debugInfo.step = "Insertion en base";
    debugInfo.details += " | Sauvegarde dans Supabase";

    let imported = 0;
    for (const article of articles) {
      try {
        // Vérifier si l'article existe déjà (par URL)
        const { data: existing } = await supabase
          .from('country_news')
          .select('id')
          .eq('link', article.link)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('country_news')
            .insert([{
              title: article.title,
              link: article.link,
              pub_date: article.pub_date,
              description: article.description,
              image_url: article.image_url,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]);

          if (!error) {
            imported++;
            console.log(`💾 Article sauvé: ${article.title.substring(0, 50)}...`);
          } else {
            console.warn(`❌ Erreur insertion: ${error.message}`);
          }
        } else {
          console.log(`⏭️ Article existant ignoré: ${article.title.substring(0, 50)}...`);
        }
      } catch (error) {
        console.warn(`⚠️ Erreur traitement article: ${error}`);
      }
    }

    debugInfo.articlesImported = imported;
    debugInfo.success = true;
    debugInfo.details += ` | ${imported} nouveaux articles importés`;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Import Music Row avec rss-parser réussi: ${imported} nouveaux articles sur ${articles.length} traités`,
        totalFound: articles.length,
        totalImported: imported,
        sourceUsed: debugInfo.sourceUsed,
        feedInfo: debugInfo.feedInfo,
        timestamp: new Date().toISOString(),
        debug: debugInfo,
        sampleArticles: articles.slice(0, 3) // Afficher 3 exemples
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
    
    console.error("❌ Erreur complète:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erreur import Music Row avec rss-parser: ${debugInfo.error}`,
        totalFound: debugInfo.articlesFound,
        totalImported: debugInfo.articlesImported,
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

/**
 * Traite un item RSS avec rss-parser et extrait les données
 * @param item - Item RSS parsé par rss-parser
 * @param sanitizeHtml - Fonction de nettoyage HTML
 * @param index - Index de l'article pour debug
 * @returns NewsArticle ou null si traitement échoue
 */
function processRSSItem(item: any, sanitizeHtml: any, index: number): NewsArticle | null {
  try {
    // rss-parser normalise déjà les champs principaux
    const title = item.title?.trim() || '';
    const link = item.link?.trim() || item.guid?.trim() || '';
    const pubDateStr = item.pubDate || item.isoDate || '';
    
    // Pour la description, essayer plusieurs champs
    let description = item.contentSnippet || item.content || item.summary || item.description || '';

    // Nettoyer la description
    description = cleanDescription(description, sanitizeHtml);

    // Extraire l'image de l'article
    const image_url = extractImageUrl(item, index);

    // Valider les données essentielles
    if (!title || !link) {
      console.warn("❌ Article invalide - titre ou lien manquant:", { 
        title: title.substring(0, 50), 
        link: link.substring(0, 50) 
      });
      return null;
    }

    // Convertir la date (rss-parser gère déjà la plupart des formats)
    const pub_date = parsePubDate(pubDateStr);

    return {
      title: title.substring(0, 255), // Limiter la longueur du titre
      link,
      pub_date,
      description,
      image_url
    };

  } catch (error) {
    console.warn("❌ Erreur traitement article RSS:", error);
    return null;
  }
}

/**
 * Extrait l'URL de l'image depuis un item RSS
 * @param item - Item RSS
 * @param index - Index pour debug
 * @returns URL de l'image ou null
 */
function extractImageUrl(item: any, index: number): string | null {
  try {
    console.log(`🖼️ Recherche image pour article ${index}:`);
    console.log(`📋 Item complet:`, JSON.stringify(item, null, 2));

    // Recherche dans tous les champs possibles
    const imageFields = [
      'enclosure', 'media:content', 'media:thumbnail', 'media:group',
      'image', 'itunes:image', 'thumbnail', 'media:description'
    ];
    
    for (const field of imageFields) {
      if (item[field]) {
        console.log(`🔍 Champ ${field} trouvé:`, JSON.stringify(item[field], null, 2));
      }
    }

    // 1. Enclosure (le plus courant pour les images)
    if (item.enclosure && item.enclosure.url) {
      const url = item.enclosure.url;
      if (isImageUrl(url)) {
        console.log(`✅ Image trouvée via enclosure: ${url}`);
        return url;
      }
    }

    // 1.5. Enclosure array
    if (Array.isArray(item.enclosure)) {
      for (const enc of item.enclosure) {
        if (enc && enc.url && isImageUrl(enc.url)) {
          console.log(`✅ Image trouvée via enclosure array: ${enc.url}`);
          return enc.url;
        }
      }
    }

    // 2. Media:content (namespace media)
    if (item['media:content']) {
      const mediaContent = Array.isArray(item['media:content']) ? item['media:content'][0] : item['media:content'];
      
      let url = '';
      if (typeof mediaContent === 'string') {
        url = mediaContent;
      } else if (mediaContent && mediaContent.$ && mediaContent.$.url) {
        url = mediaContent.$.url;
      } else if (mediaContent && mediaContent.url) {
        url = mediaContent.url;
      }
      
      if (url && isImageUrl(url)) {
        console.log(`✅ Image trouvée via media:content: ${url}`);
        return url;
      }
    }

    // 2.5. Media:group
    if (item['media:group']) {
      const mediaGroup = item['media:group'];
      if (mediaGroup && mediaGroup['media:content']) {
        const mediaContent = Array.isArray(mediaGroup['media:content']) ? mediaGroup['media:content'][0] : mediaGroup['media:content'];
        let url = '';
        if (mediaContent && mediaContent.$ && mediaContent.$.url) {
          url = mediaContent.$.url;
        } else if (mediaContent && mediaContent.url) {
          url = mediaContent.url;
        }
        if (isImageUrl(url)) {
          console.log(`✅ Image trouvée via media:group: ${url}`);
          return url;
        }
      }
    }

    // 3. Media:thumbnail
    if (item['media:thumbnail']) {
      const mediaThumbnail = Array.isArray(item['media:thumbnail']) ? item['media:thumbnail'][0] : item['media:thumbnail'];
      
      let url = '';
      if (typeof mediaThumbnail === 'string') {
        url = mediaThumbnail;
      } else if (mediaThumbnail && mediaThumbnail.$ && mediaThumbnail.$.url) {
        url = mediaThumbnail.$.url;
      } else if (mediaThumbnail && mediaThumbnail.url) {
        url = mediaThumbnail.url;
      }
      
      if (url && isImageUrl(url)) {
        console.log(`✅ Image trouvée via media:thumbnail: ${url}`);
        return url;
      }
    }

    // 3.5. Thumbnail simple
    if (item.thumbnail) {
      let url = '';
      if (typeof item.thumbnail === 'string') {
        url = item.thumbnail;
      } else if (item.thumbnail.url) {
        url = item.thumbnail.url;
      } else if (item.thumbnail.$ && item.thumbnail.$.url) {
        url = item.thumbnail.$.url;
      }
      
      if (url && isImageUrl(url)) {
        console.log(`✅ Image trouvée via thumbnail: ${url}`);
        return url;
      }
    }

    // 4. Champ image direct
    if (item.image) {
      let imageUrl = '';
      if (typeof item.image === 'string') {
        imageUrl = item.image;
      } else if (item.image.url) {
        imageUrl = item.image.url;
      } else if (item.image.$) {
        imageUrl = item.image.$.href || item.image.$.url;
      }
      
      if (imageUrl && isImageUrl(imageUrl)) {
        console.log(`✅ Image trouvée via champ image: ${imageUrl}`);
        return imageUrl;
      }
    }

    // 5. iTunes:image
    if (item['itunes:image']) {
      const itunesImage = item['itunes:image'];
      let imageUrl = '';
      if (typeof itunesImage === 'string') {
        imageUrl = itunesImage;
      } else if (itunesImage.$ && itunesImage.$.href) {
        imageUrl = itunesImage.$.href;
      }
      
      if (imageUrl && isImageUrl(imageUrl)) {
        console.log(`✅ Image trouvée via itunes:image: ${imageUrl}`);
        return imageUrl;
      }
    }

    // 6. Recherche dans le contenu HTML (en dernier recours)
    const content = item.content || item['content:encoded'] || item.description || '';
    if (content && typeof content === 'string') {
      // Chercher plusieurs patterns d'images
      const imgPatterns = [
        /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
        /<image[^>]+src=["']([^"']+)["'][^>]*>/gi,
        /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)/gi
      ];
      
      for (const pattern of imgPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          for (const match of matches) {
            const urlMatch = match.match(/https?:\/\/[^\s"']+/);
            if (urlMatch && isImageUrl(urlMatch[0])) {
              console.log(`✅ Image trouvée dans le contenu HTML: ${urlMatch[0]}`);
              return urlMatch[0];
            }
          }
        }
      }
    }

    console.log(`ℹ️ Aucune image trouvée pour l'article ${index}`);
    return null;

  } catch (error) {
    console.warn(`⚠️ Erreur extraction image article ${index}:`, error);
    return null;
  }
}

/**
 * Vérifie si une URL pointe vers une image
 * @param url - URL à vérifier
 * @returns true si c'est une image
 */
function isImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  // Nettoyer l'URL
  url = url.trim();
  
  // Vérifier l'extension
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff|tif)(\?.*)?$/i;
  if (imageExtensions.test(url)) return true;
  
  // Vérifier les domaines d'images connus
  const imageDomains = [
    'images.unsplash.com',
    'cdn.pixabay.com', 
    'images.pexels.com',
    'i.imgur.com',
    'media.giphy.com',
    'cdn.jsdelivr.net',
    'raw.githubusercontent.com',
    'rss.app',
    'feeds.feedburner.com',
    'wp.com',
    'wordpress.com',
    'gravatar.com'
  ];
  
  try {
    const urlObj = new URL(url);
    return imageDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Nettoie et formate la description avec sanitize-html
 * @param description - Description brute
 * @param sanitizeHtml - Fonction de nettoyage HTML
 * @returns Description nettoyée (max 200 chars)
 */
function cleanDescription(description: string, sanitizeHtml: any): string {
  if (!description) return '';

  try {
    // Nettoyer le HTML avec sanitize-html
    let cleaned = sanitizeHtml(description, {
      allowedTags: [], // Supprimer toutes les balises HTML
      allowedAttributes: {},
      textFilter: function(text: string) {
        // Décoder les entités HTML
        return text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/&nbsp;/g, ' ');
      }
    });

    // Nettoyer les espaces multiples
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Limiter à 200 caractères
    if (cleaned.length > 200) {
      cleaned = cleaned.substring(0, 197) + '...';
    }

    return cleaned;

  } catch (error) {
    console.warn("⚠️ Erreur nettoyage HTML:", error);
    
    // Fallback: nettoyage basique si sanitize-html échoue
    let fallback = description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return fallback.length > 200 ? fallback.substring(0, 197) + '...' : fallback;
  }
}

/**
 * Parse une date de publication RSS
 * @param dateStr - Date au format RSS
 * @returns Date ISO string
 */
function parsePubDate(dateStr: string): string {
  if (!dateStr) {
    return new Date().toISOString();
  }

  try {
    // rss-parser normalise déjà la plupart des dates
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      // Fallback si le parsing échoue
      console.warn("⚠️ Date invalide:", dateStr);
      return new Date().toISOString();
    }

    return date.toISOString();
  } catch (error) {
    console.warn("⚠️ Erreur parsing date:", dateStr, error);
    return new Date().toISOString();
  }
}