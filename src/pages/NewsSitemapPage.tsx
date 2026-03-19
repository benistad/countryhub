import { useEffect } from 'react';
import { useNewsPlusArticles } from '../hooks/useNewsPlusArticles';

/**
 * Google News Sitemap Generator
 * Format spécial pour référencement rapide des actualités
 * https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */
export default function NewsSitemapPage() {
  const { articles, loading } = useNewsPlusArticles({ limit: 1000 });

  useEffect(() => {
    if (!loading && articles.length > 0) {
      // Générer le sitemap XML
      const sitemap = generateNewsSitemap(articles);
      
      // Créer un Blob et télécharger
      const blob = new Blob([sitemap], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      
      // Afficher dans la page
      const pre = document.createElement('pre');
      pre.textContent = sitemap;
      document.body.appendChild(pre);
    }
  }, [articles, loading]);

  if (loading) {
    return <div className="p-8">Generating sitemap...</div>;
  }

  return null;
}

function generateNewsSitemap(articles: any[]) {
  const baseUrl = 'https://www.countrymusic-hub.com';
  
  // Filtrer les articles des dernières 48h (Google News Sitemap)
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const recentArticles = articles.filter(article => 
    new Date(article.published_at) > twoDaysAgo
  );

  const urls = recentArticles.map(article => {
    const pubDate = new Date(article.published_at);
    
    return `  <url>
    <loc>${baseUrl}/news-plus/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>CountryMusic-Hub</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate.toISOString()}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
      <news:keywords>${article.tags.join(', ')}</news:keywords>
    </news:news>
    <lastmod>${pubDate.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
