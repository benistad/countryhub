/*
  # News+ AI Article Generator
  
  Génère automatiquement des articles News+ à partir des sources Google News:
  1. Récupère les articles Google News récents
  2. Groupe les articles par sujet similaire (clustering)
  3. Utilise l'IA pour réécrire chaque cluster en un article unique
  4. Stocke les articles générés dans news_plus_articles
  
  Exécution: Toutes les heures via cron job
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface SourceArticle {
  id: string;
  title: string;
  link: string;
  description: string;
  pub_date: string;
  image_url?: string;
}

interface ArticleCluster {
  topic: string;
  articles: SourceArticle[];
  mainArtist?: string;
  category: string;
}

interface GeneratedArticle {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  artist?: string;
  tags: string[];
  meta_description: string;
  meta_keywords: string[];
  featured_image_url?: string;
  source_articles_count: number;
  source_articles_urls: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();
  const generationLog = {
    articlesAnalyzed: 0,
    clustersCreated: 0,
    articlesGenerated: 0,
    errors: [] as string[],
  };

  try {
    console.log("🚀 Démarrage de la génération News+...");

    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Configuration OpenAI
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY non configurée');
    }

    // ÉTAPE 1: Récupérer les articles Google News récents (dernières 24h)
    console.log("📰 Récupération des articles Google News...");
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: sourceArticles, error: fetchError } = await supabase
      .from('country_news')
      .select('*')
      .gte('pub_date', twentyFourHoursAgo)
      .order('pub_date', { ascending: false });

    if (fetchError) throw fetchError;
    if (!sourceArticles || sourceArticles.length === 0) {
      console.log("ℹ️ Aucun nouvel article à traiter");
      return new Response(JSON.stringify({
        success: true,
        message: "Aucun nouvel article à traiter",
        stats: generationLog
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ÉTAPE 1.5: Filtrer les articles sources déjà utilisés
    console.log("🔍 Filtrage des articles déjà traités...");
    const { data: usedArticles } = await supabase
      .from('news_plus_articles')
      .select('source_articles_urls')
      .gte('published_at', twentyFourHoursAgo);

    // Créer un Set des URLs déjà utilisées
    const usedUrls = new Set<string>();
    if (usedArticles) {
      usedArticles.forEach(article => {
        if (article.source_articles_urls) {
          article.source_articles_urls.forEach((url: string) => usedUrls.add(url));
        }
      });
    }

    // Filtrer les articles non encore traités
    const newArticles = sourceArticles.filter(article => !usedUrls.has(article.link));
    
    if (newArticles.length === 0) {
      console.log("ℹ️ Tous les articles ont déjà été traités");
      return new Response(JSON.stringify({
        success: true,
        message: "Tous les articles ont déjà été traités",
        stats: { ...generationLog, articlesAnalyzed: sourceArticles.length, articlesFiltered: sourceArticles.length - newArticles.length }
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    generationLog.articlesAnalyzed = newArticles.length;
    console.log(`✅ ${newArticles.length} nouveaux articles (${sourceArticles.length - newArticles.length} déjà traités)`);

    // ÉTAPE 2: Clustering des articles par sujet similaire avec IA
    console.log("🔍 Clustering des articles par sujet...");
    const clusters = await clusterArticlesByTopic(newArticles, OPENAI_API_KEY);
    generationLog.clustersCreated = clusters.length;
    console.log(`✅ ${clusters.length} clusters créés`);

    // ÉTAPE 3: Générer un article pour chaque cluster
    console.log("✍️ Génération des articles News+...");
    for (const cluster of clusters) {
      try {
        // Générer l'article avec l'IA
        const generatedArticle = await generateArticleFromCluster(cluster, OPENAI_API_KEY);
        
        // Vérifier si un article similaire n'existe pas déjà (après génération pour avoir le slug)
        const isDuplicate = await checkDuplicateArticle(supabase, generatedArticle.title, generatedArticle.slug);
        if (isDuplicate) {
          console.log(`⏭️ Article similaire déjà existant pour: ${generatedArticle.title}`);
          continue;
        }
        
        // Sauvegarder l'article
        const { error: insertError } = await supabase
          .from('news_plus_articles')
          .insert([{
            ...generatedArticle,
            published_at: new Date().toISOString(),
            is_published: true,
            featured: cluster.articles.length >= 3, // Featured si 3+ sources
          }]);

        if (insertError) {
          console.error(`❌ Erreur insertion article: ${insertError.message}`);
          generationLog.errors.push(`Insert error: ${insertError.message}`);
        } else {
          generationLog.articlesGenerated++;
          console.log(`✅ Article généré: ${generatedArticle.title}`);
        }

      } catch (error) {
        console.error(`❌ Erreur génération cluster: ${error.message}`);
        generationLog.errors.push(`Cluster error: ${error.message}`);
      }
    }

    // ÉTAPE 4: Nettoyer les anciens articles (garder 100 plus récents)
    console.log("🧹 Nettoyage des anciens articles...");
    await supabase.rpc('delete_old_news_plus_articles', { keep_count: 100 });

    // ÉTAPE 5: Notifier Google du nouveau contenu (si articles générés)
    if (generationLog.articlesGenerated > 0) {
      console.log("🔔 Notification Google Search Console...");
      try {
        // Ping Google pour indexation rapide
        const sitemapUrl = 'https://www.countrymusic-hub.com/news-sitemap.xml';
        await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
        console.log("✅ Google notifié du nouveau sitemap");
      } catch (pingError) {
        console.warn("⚠️ Échec notification Google (non bloquant)");
      }
    }

    // ÉTAPE 5: Enregistrer l'historique
    const executionTime = Date.now() - startTime;
    await supabase.from('news_plus_generation_history').insert([{
      articles_analyzed: generationLog.articlesAnalyzed,
      clusters_created: generationLog.clustersCreated,
      articles_generated: generationLog.articlesGenerated,
      execution_time_ms: executionTime,
      ai_model_used: 'gpt-4o-mini',
      status: generationLog.errors.length === 0 ? 'success' : 'partial',
      error_details: generationLog.errors.length > 0 ? { errors: generationLog.errors } : null,
    }]);

    console.log(`✅ Génération terminée en ${executionTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      message: `${generationLog.articlesGenerated} articles générés avec succès`,
      stats: generationLog,
      executionTimeMs: executionTime
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('❌ Erreur génération News+:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stats: generationLog
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

/**
 * Groupe les articles par sujet similaire en utilisant l'IA
 */
async function clusterArticlesByTopic(
  articles: SourceArticle[],
  apiKey: string
): Promise<ArticleCluster[]> {
  
  // Préparer les titres et descriptions pour l'analyse
  const articlesText = articles.map((a, i) => 
    `${i + 1}. ${a.title}\n   ${a.description || ''}`
  ).join('\n\n');

  const prompt = `Analyze these country music news articles and group them by similar topics.
For each group, identify:
- The main topic/subject
- Which article numbers belong to this group
- The main artist mentioned (if any)
- The category (album, tour, award, or news)

Articles:
${articlesText}

Return a JSON array of clusters in this exact format:
[
  {
    "topic": "Brief topic description",
    "articleNumbers": [1, 3, 5],
    "mainArtist": "Artist Name" or null,
    "category": "album|tour|award|news"
  }
]

Rules:
- Only group articles about the SAME specific event/topic
- Minimum 2 articles per cluster
- If an article doesn't fit any cluster, create a single-article cluster
- Be strict: "Morgan Wallen tour" and "Luke Combs tour" are DIFFERENT topics`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a news clustering expert. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    // Convertir les numéros d'articles en objets articles
    const clusters: ArticleCluster[] = (parsed.clusters || parsed).map((cluster: any) => ({
      topic: cluster.topic,
      mainArtist: cluster.mainArtist,
      category: cluster.category || 'news',
      articles: cluster.articleNumbers.map((num: number) => articles[num - 1]).filter(Boolean)
    }));

    return clusters.filter(c => c.articles.length > 0);

  } catch (error) {
    console.error('Erreur clustering:', error);
    // Fallback: un cluster par article
    return articles.map(article => ({
      topic: article.title,
      articles: [article],
      category: 'news'
    }));
  }
}

/**
 * Génère un article complet à partir d'un cluster
 */
async function generateArticleFromCluster(
  cluster: ArticleCluster,
  apiKey: string
): Promise<GeneratedArticle> {
  
  const sourcesText = cluster.articles.map((a, i) => 
    `Source ${i + 1}:\nTitle: ${a.title}\nContent: ${a.description || 'N/A'}\nURL: ${a.link}`
  ).join('\n\n');

  const prompt = `You are a professional country music journalist. Write an original, engaging article about this topic by synthesizing these sources.

Topic: ${cluster.topic}
${cluster.mainArtist ? `Main Artist: ${cluster.mainArtist}` : ''}

Sources:
${sourcesText}

Write a complete article (400-600 words) that:
1. Combines information from all sources
2. Uses a professional, engaging tone
3. Includes specific details (dates, numbers, quotes if available)
4. Sounds like it was written by a human journalist
5. Does NOT mention the sources or that it's compiled from multiple articles
6. Focuses on facts and newsworthy information

Also provide:
- A catchy headline (max 80 chars)
- A compelling excerpt (max 160 chars)
- 3-5 relevant tags
- SEO meta description (max 155 chars)
- 5-8 SEO keywords

Return JSON format:
{
  "title": "Article headline",
  "content": "Full article text with paragraphs",
  "excerpt": "Short summary",
  "tags": ["tag1", "tag2"],
  "metaDescription": "SEO description",
  "keywords": ["keyword1", "keyword2"]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional country music journalist. Write engaging, factual articles. Return only valid JSON.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const article = JSON.parse(data.choices[0].message.content);

  // Générer un slug SEO-friendly
  const slug = article.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);

  return {
    title: article.title,
    slug: `${slug}-${Date.now()}`,
    content: article.content,
    excerpt: article.excerpt,
    category: cluster.category,
    artist: cluster.mainArtist || null,
    tags: article.tags || [],
    meta_description: article.metaDescription,
    meta_keywords: article.keywords || [],
    featured_image_url: cluster.articles[0]?.image_url || null,
    source_articles_count: cluster.articles.length,
    source_articles_urls: cluster.articles.map(a => a.link),
  };
}

/**
 * Vérifie si un article similaire existe déjà
 */
async function checkDuplicateArticle(supabase: any, title: string, slug: string): Promise<boolean> {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  
  // Vérifier par slug (plus fiable)
  const { data: slugData } = await supabase
    .from('news_plus_articles')
    .select('id')
    .eq('slug', slug)
    .limit(1);

  if (slugData && slugData.length > 0) {
    return true;
  }

  // Vérifier par titre similaire (sans le timestamp)
  const baseSlug = slug.split('-').slice(0, -1).join('-'); // Enlever le timestamp
  const { data: titleData } = await supabase
    .from('news_plus_articles')
    .select('slug')
    .gte('published_at', threeDaysAgo)
    .limit(100);

  if (titleData && titleData.length > 0) {
    // Vérifier si un slug similaire existe (sans timestamp)
    const similarExists = titleData.some((article: any) => {
      const existingBaseSlug = article.slug.split('-').slice(0, -1).join('-');
      return existingBaseSlug === baseSlug;
    });
    
    if (similarExists) {
      return true;
    }
  }

  return false;
}
