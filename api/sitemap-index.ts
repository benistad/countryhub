/**
 * Sitemap Index - Regroupe tous les sitemaps du site
 * https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps
 */
export default async function handler(req: any, res: any) {
  const baseUrl = 'https://www.countrymusic-hub.com'
  const now = new Date().toISOString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/news-sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`

  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.status(200).send(xml)
}
