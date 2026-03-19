import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, ArrowLeft, Tag as TagIcon, Share2, Music } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { generateArtistSlug } from '../utils/seo';
import { useNewsPlusArticle } from '../hooks/useNewsPlusArticles';

const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  album: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
  tour: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  award: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
  news: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
};

const CAT_LABELS: Record<string, string> = {
  album: "Album Release",
  tour: "Tour News",
  award: "Awards",
  news: "Breaking News",
};

export default function NewsArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { article, loading, error } = useNewsPlusArticle(slug || '');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-red-800 mb-4">Article Not Found</h2>
          <p className="text-red-600 mb-6">This article doesn't exist or has been removed.</p>
          <Link 
            to="/news-plus"
            className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to News+
          </Link>
        </div>
      </div>
    );
  }

  const publishDate = new Date(article.published_at);
  const colors = CAT_COLORS[article.category] || CAT_COLORS.news;
  
  // Schema.org NewsArticle
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.excerpt,
    "image": article.featured_image_url || "https://countrymusic-hub.com/og-image.jpg",
    "datePublished": article.published_at,
    "dateModified": article.published_at,
    "author": {
      "@type": "Organization",
      "name": "CountryMusic-Hub"
    },
    "publisher": {
      "@type": "Organization",
      "name": "CountryMusic-Hub",
      "logo": {
        "@type": "ImageObject",
        "url": "https://countrymusic-hub.com/logo.png"
      }
    },
    "articleSection": CAT_LABELS[article.category] || "Country Music News",
    "keywords": article.tags.join(", ")
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SEOHead 
        title={`${article.title} | Country Music News+`}
        description={article.meta_description || article.excerpt}
        canonical={`/news-plus/${article.slug}`}
        keywords={article.meta_keywords?.join(', ') || article.tags.join(', ')}
        ogImage={article.featured_image_url}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'News+', url: '/news-plus' },
          { name: article.title, url: `/news-plus/${article.slug}` }
        ]}
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      {/* Back button */}
      <Link 
        to="/news-plus"
        className="inline-flex items-center text-gray-600 hover:text-red-600 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to News+
      </Link>

      {/* Article Header */}
      <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Featured Image */}
        {article.featured_image_url && (
          <div className="w-full overflow-hidden">
            <img 
              src={article.featured_image_url} 
              alt={article.title}
              className="w-full h-auto object-contain"
            />
          </div>
        )}

        <div className="p-8 md:p-12">
          {/* Category & Date */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded ${colors.bg} ${colors.text} ${colors.border} border`}>
              {CAT_LABELS[article.category] || article.category}
            </span>
            <span className="text-sm text-gray-500 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {MONTHS_EN[publishDate.getMonth()]} {publishDate.getDate()}, {publishDate.getFullYear()}
            </span>
            {article.source_articles_count > 1 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded">
                Based on {article.source_articles_count} sources
              </span>
            )}
          </div>

          {/* Artist Link */}
          {article.artist && (
            <Link 
              to={`/artist/${generateArtistSlug(article.artist)}`}
              className="inline-block text-sm font-bold text-red-600 uppercase tracking-wider hover:text-red-700 transition-colors mb-4"
            >
              {article.artist}
            </Link>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Excerpt */}
          <p className="text-xl text-gray-600 leading-relaxed mb-8 pb-8 border-b border-gray-200">
            {article.excerpt}
          </p>

          {/* Article Content */}
          <div className="prose prose-lg prose-gray max-w-none">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-gray-700 leading-relaxed mb-6">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-gray-200">
            <TagIcon className="w-5 h-5 text-gray-400 mr-2" />
            {article.tags.map(tag => (
              <span 
                key={tag} 
                className="text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Share & Artist CTA */}
          <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-gray-200">
            {article.artist && (
              <Link 
                to={`/artist/${generateArtistSlug(article.artist)}`}
                className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Music className="w-5 h-5 mr-2" />
                View {article.artist}'s Videos
              </Link>
            )}
            
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: article.title,
                    text: article.excerpt,
                    url: window.location.href
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
              className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share Article
            </button>
          </div>
        </div>
      </article>

      {/* Related Articles Section */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">More Country Music News</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/news-plus" className="bg-red-50 hover:bg-red-100 rounded-lg p-6 text-center transition-colors">
            <span className="font-medium text-red-800">All News+</span>
          </Link>
          <Link to="/country-music-news" className="bg-blue-50 hover:bg-blue-100 rounded-lg p-6 text-center transition-colors">
            <span className="font-medium text-blue-800">Live News Feed</span>
          </Link>
          <Link to="/country-music-videos" className="bg-purple-50 hover:bg-purple-100 rounded-lg p-6 text-center transition-colors">
            <span className="font-medium text-purple-800">Music Videos</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
