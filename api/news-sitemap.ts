import { createClient } from '@supabase/supabase-js'

/**
 * Vercel Serverless Function pour générer le sitemap News+
 * Accessible publiquement à /api/news-sitemap
 */
export default async function handler(req: any, res: any) {
  try {
    // Créer le client Supabase avec la clé anonyme
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    )

    // Récupérer les articles News+ publiés
    const { data: articles, error } = await supabase
      .from('news_plus_articles')
      .select('slug, title, published_at, tags')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('Error fetching articles:', error)
      return res.status(500).json({ error: 'Failed to fetch articles' })
    }

    // Générer le sitemap XML
    const sitemap = generateNewsSitemap(articles || [])

    // Retourner le XML avec les bons headers
    res.setHeader('Content-Type', 'application/xml')
    res.setHeader('Cache-Control', 'public, max-age=3600') // Cache 1 heure
    res.status(200).send(sitemap)

  } catch (error) {
    console.error('Sitemap generation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

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
    <loc>${baseUrl}/news-plus/${escapeXml(article.slug)}</loc>
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
