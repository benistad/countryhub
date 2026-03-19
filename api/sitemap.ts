import { createClient } from '@supabase/supabase-js'

/**
 * Sitemap général du site CountryMusic-Hub
 * Inclut toutes les pages statiques et dynamiques
 */
export default async function handler(req: any, res: any) {
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    )

    const baseUrl = 'https://www.countrymusic-hub.com'
    const now = new Date().toISOString()

    // Pages statiques
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/country-music-videos', priority: '0.9', changefreq: 'daily' },
      { url: '/top-30-country-songs', priority: '0.9', changefreq: 'daily' },
      { url: '/country-music-news', priority: '0.8', changefreq: 'daily' },
      { url: '/news-plus', priority: '0.9', changefreq: 'hourly' },
      { url: '/new-releases', priority: '0.8', changefreq: 'weekly' },
      { url: '/best-of-2025', priority: '0.7', changefreq: 'monthly' },
      { url: '/country-lyrics', priority: '0.7', changefreq: 'weekly' },
      { url: '/artists', priority: '0.8', changefreq: 'weekly' },
      { url: '/faq', priority: '0.5', changefreq: 'monthly' },
    ]

    // Récupérer les vidéos pour les pages artistes
    const { data: videos } = await supabase
      .from('country_videos')
      .select('artist')
      .limit(1000)

    // Extraire les artistes uniques
    const artists = videos 
      ? Array.from(new Set(videos.map(v => v.artist)))
      : []

    // Récupérer les articles News+
    const { data: newsArticles } = await supabase
      .from('news_plus_articles')
      .select('slug, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(1000)

    // Générer le XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

    // Pages statiques
    staticPages.forEach(page => {
      xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`
    })

    // Pages artistes
    artists.forEach(artist => {
      const slug = artist
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      
      xml += `  <url>
    <loc>${baseUrl}/artist/${escapeXml(slug)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`
    })

    // Articles News+
    if (newsArticles) {
      newsArticles.forEach(article => {
        const pubDate = new Date(article.published_at).toISOString()
        xml += `  <url>
    <loc>${baseUrl}/news-plus/${escapeXml(article.slug)}</loc>
    <lastmod>${pubDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`
      })
    }

    xml += `</urlset>`

    res.setHeader('Content-Type', 'application/xml')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.status(200).send(xml)

  } catch (error) {
    console.error('Sitemap generation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
