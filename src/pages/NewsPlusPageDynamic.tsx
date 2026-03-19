import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, X, Star, Music, Trophy, Mic2, Newspaper, Filter, RefreshCw, Loader } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { generateArtistSlug } from '../utils/seo';
import { useNewsPlusArticles, NewsPlusArticle } from '../hooks/useNewsPlusArticles';

const CATEGORIES = [
  { id: "all", label: "All News", icon: Filter },
  { id: "album", label: "Albums", icon: Music },
  { id: "tour", label: "Tours", icon: Mic2 },
  { id: "award", label: "Awards", icon: Trophy },
  { id: "news", label: "Headlines", icon: Newspaper },
];

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  album: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
  tour: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  award: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
  news: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
};

function CategoryBadge({ category }: { category: string }) {
  const colors = CAT_COLORS[category] || CAT_COLORS.news;
  const cat = CATEGORIES.find(c => c.id === category);
  return (
    <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded ${colors.bg} ${colors.text} ${colors.border} border`}>
      {cat?.label || category}
    </span>
  );
}

function FeaturedCard({ article, onClick }: { article: NewsPlusArticle; onClick: () => void }) {
  const publishDate = new Date(article.published_at);
  
  return (
    <article 
      onClick={onClick}
      className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-2xl p-8 cursor-pointer mb-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded">
          Featured
        </span>
        <CategoryBadge category={article.category} />
        <span className="text-sm text-gray-500 flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {MONTHS_EN[publishDate.getMonth()]} {publishDate.getDate()}, {publishDate.getFullYear()}
        </span>
        {article.source_articles_count > 1 && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
            {article.source_articles_count} sources
          </span>
        )}
      </div>
      
      {article.artist && (
        <Link 
          to={`/artist/${generateArtistSlug(article.artist)}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-bold text-red-600 uppercase tracking-wider hover:text-red-700 transition-colors"
        >
          {article.artist}
        </Link>
      )}
      
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mt-2 mb-4 leading-tight">
        {article.title}
      </h2>
      
      <p className="text-gray-600 leading-relaxed mb-6 max-w-2xl">
        {article.excerpt}
      </p>
      
      <div className="flex flex-wrap gap-2">
        {article.tags.slice(0, 5).map(tag => (
          <span key={tag} className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1">
            #{tag}
          </span>
        ))}
      </div>
    </article>
  );
}

function NewsCard({ article, onClick }: { article: NewsPlusArticle; onClick: () => void }) {
  const publishDate = new Date(article.published_at);
  
  return (
    <article 
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-red-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
    >
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={article.category} />
          <span className="text-xs text-gray-400">
            {MONTHS_EN[publishDate.getMonth()]} {publishDate.getDate()}
          </span>
        </div>
      </div>
      
      {article.artist && (
        <Link 
          to={`/artist/${generateArtistSlug(article.artist)}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-bold text-red-600 uppercase tracking-wider hover:text-red-700 transition-colors"
        >
          {article.artist}
        </Link>
      )}
      
      <h3 className="text-lg font-semibold text-gray-800 mt-1 mb-2 leading-snug line-clamp-2">
        {article.title}
      </h3>
      
      <p className="text-sm text-gray-500 line-clamp-3 mb-3">
        {article.excerpt}
      </p>
      
      <div className="flex flex-wrap gap-1">
        {article.tags.slice(0, 2).map(tag => (
          <span key={tag} className="text-xs text-gray-400">#{tag}</span>
        ))}
      </div>
    </article>
  );
}

function ArticleModal({ article, onClose }: { article: NewsPlusArticle | null; onClose: () => void }) {
  if (!article) return null;
  
  const publishDate = new Date(article.published_at);
  
  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-8 max-w-3xl w-full my-8 relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <CategoryBadge category={article.category} />
          <span className="text-sm text-gray-500 flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {MONTHS_EN[publishDate.getMonth()]} {publishDate.getDate()}, {publishDate.getFullYear()}
          </span>
          {article.source_articles_count > 1 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              Based on {article.source_articles_count} sources
            </span>
          )}
        </div>
        
        {article.artist && (
          <Link 
            to={`/artist/${generateArtistSlug(article.artist)}`}
            className="text-sm font-bold text-red-600 uppercase tracking-wider hover:text-red-700 transition-colors"
          >
            {article.artist}
          </Link>
        )}
        
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mt-3 mb-6 leading-tight">
          {article.title}
        </h2>
        
        {article.featured_image_url && (
          <img 
            src={article.featured_image_url} 
            alt={article.title}
            className="w-full h-64 object-cover rounded-xl mb-6"
          />
        )}
        
        <div className="prose prose-gray max-w-none mb-8">
          {article.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-gray-600 leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-200 mb-8">
          {article.tags.map(tag => (
            <span key={tag} className="text-sm text-gray-500 border border-gray-300 rounded px-3 py-1">
              #{tag}
            </span>
          ))}
        </div>
        
        {article.artist && (
          <div className="mt-8">
            <Link 
              to={`/artist/${generateArtistSlug(article.artist)}`}
              className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Music className="w-5 h-5 mr-2" />
              View {article.artist}'s Videos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewsPlusPageDynamic() {
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<NewsPlusArticle | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Récupérer les articles depuis Supabase
  const { articles: allArticles, loading, error, refetch, triggerGeneration } = useNewsPlusArticles({ limit: 100 });

  const filtered = useMemo(() => {
    return allArticles.filter(article => {
      if (selectedCat !== "all" && article.category !== selectedCat) return false;
      if (search) {
        const s = search.toLowerCase();
        return article.title.toLowerCase().includes(s) || 
               article.artist?.toLowerCase().includes(s) || 
               article.tags.some(t => t.toLowerCase().includes(s));
      }
      return true;
    });
  }, [allArticles, selectedCat, search]);

  const featured = filtered.filter(a => a.featured && selectedCat === "all" && !search).slice(0, 1);
  const regular = filtered.filter(a => !featured.includes(a));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await triggerGeneration();
      if (result.success) {
        await refetch();
      }
    } catch (err) {
      console.error('Erreur refresh:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Generate schema for SEO
  const newsSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Country Music News+ Archive",
    "description": "AI-curated country music news, album releases, tour announcements, and award coverage from Nashville and beyond.",
    "url": "https://countrymusic-hub.com/news-plus",
    "numberOfItems": allArticles.length,
  };

  if (loading && allArticles.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading News+ articles...</p>
        </div>
      </div>
    );
  }

  if (error && allArticles.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6 min-h-screen flex items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Loading Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <SEOHead 
        title="News+ - AI-Curated Country Music News | CountryMusic-Hub.com"
        description={`Explore ${allArticles.length} curated country music articles. In-depth coverage of album releases, tour announcements, awards and industry news from Morgan Wallen, Zach Bryan, Luke Combs and more.`}
        canonical="/news-plus"
        keywords="country music news, Nashville news, country music articles, country album news, country tour news, country awards"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'News+', url: '/news-plus' }
        ]}
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsSchema) }} />

      {/* Header */}
      {selectedCat === "all" && !search && (
        <header className="text-center mb-10">
          <div className="inline-flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Star className="w-4 h-4 mr-2" />
            AI-CURATED CONTENT
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Country Music News+
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            In-depth coverage of Nashville and beyond. Albums, tours, awards, and industry insights.
          </p>
          <p className="text-sm text-gray-400 mt-4">
            {allArticles.length} articles • Updated automatically
          </p>
        </header>
      )}

      {/* Search & Refresh */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artist, news, tag..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all bg-white"
          />
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
          title="Generate new articles"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Generating...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(cat => {
          const active = selectedCat === cat.id;
          const Icon = cat.icon;
          return (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCat(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                active 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
        {(selectedCat !== "all" || search) && (
          <button 
            onClick={() => { setSelectedCat("all"); setSearch(""); }}
            className="px-4 py-2 rounded-lg font-medium text-red-600 border border-red-300 hover:bg-red-50 transition-colors ml-auto flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear filters
          </button>
        )}
      </div>

      {/* Results info */}
      {(selectedCat !== "all" || search) && (
        <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
          <div className="h-px flex-1 bg-gray-200" />
          <span>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            {selectedCat !== "all" ? ` • ${CATEGORIES.find(c => c.id === selectedCat)?.label}` : ''}
            {search ? ` • "${search}"` : ''}
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <FeaturedCard article={featured[0]} onClick={() => setSelectedArticle(featured[0])} />
      )}

      {/* Grid */}
      {regular.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regular.map(article => (
            <NewsCard key={article.id} article={article} onClick={() => setSelectedArticle(article)} />
          ))}
        </div>
      ) : filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No articles found for these criteria.</p>
        </div>
      )}

      {/* SEO Content */}
      <section className="bg-gray-50 rounded-xl p-8 mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">About Country Music News+</h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-4">
            News+ is our AI-curated archive of country music journalism. We automatically analyze and synthesize 
            multiple news sources to provide comprehensive coverage of album releases, tour announcements, award shows, 
            and industry developments from Nashville's biggest stars including Morgan Wallen, Zach Bryan, Luke Combs, 
            Chris Stapleton, and Lainey Wilson.
          </p>
          <p className="text-gray-600">
            Each article is generated from multiple trusted sources to give you the complete story in one place. 
            Use the filters above to explore by category or search for specific artists and topics.
          </p>
        </div>
      </section>

      {/* Related Links */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Explore More</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/country-music-news" className="bg-blue-50 hover:bg-blue-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-blue-800">Live News Feed</span>
          </Link>
          <Link to="/country-music-videos" className="bg-red-50 hover:bg-red-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-red-800">Music Videos</span>
          </Link>
          <Link to="/top-30-country-songs" className="bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-yellow-800">Top 30 Chart</span>
          </Link>
          <Link to="/artists" className="bg-purple-50 hover:bg-purple-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-purple-800">All Artists</span>
          </Link>
        </div>
      </section>

      {/* Modal */}
      <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </div>
  );
}
