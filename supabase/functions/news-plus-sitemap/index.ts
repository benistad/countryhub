import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Edge Function pour générer un sitemap XML dynamique des articles News+
 * Format Google News Sitemap pour référencement rapide
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Utiliser la clé anonyme pour accès public (RLS doit permettre SELECT)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Récupérer tous les articles News+ publiés
    const { data: articles, error } = await supabaseClient
      .from('news_plus_articles')
      .select('slug, title, published_at, tags')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(1000)

    if (error) throw error

    // Générer le sitemap XML
    const sitemap = generateNewsSitemap(articles || [])

    return new Response(sitemap, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache 1 heure
      },
    })

  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function generateNewsSitemap(articles: any[]): string {
  const baseUrl = 'https://www.countrymusic-hub.com'
  
  // Filtrer les articles des dernières 48h pour Google News
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  const recentArticles = articles.filter(article => 
    new Date(article.published_at) > twoDaysAgo
  )

  const urls = recentArticles.map(article => {
    const pubDate = new Date(article.published_at)
    const tags = Array.isArray(article.tags) ? article.tags.join(', ') : ''
    
    return `  <url>
    <loc>${baseUrl}/news-plus/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>CountryMusic-Hub</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate.toISOString()}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
      <news:keywords>${escapeXml(tags)}</news:keywords>
    </news:news>
    <lastmod>${pubDate.toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
