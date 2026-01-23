import { useState, useEffect } from 'react';
import { Rss, ExternalLink, Clock, RefreshCw } from 'lucide-react';
import { useCountryNews } from '../hooks/useCountryNews';
import { CountryNewsItem } from '../lib/supabase';

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  guid: string;
  imageUrl?: string;
  sourceUrl?: string;
}

interface GoogleNewsRSSProps {
  /** Titre du composant */
  title?: string;
  /** Description du composant */
  description?: string;
  /** Nombre maximum d'articles à afficher */
  maxItems?: number;
  /** Classe CSS personnalisée */
  className?: string;
  /** Afficher la date de dernière mise à jour */
  showLastUpdated?: boolean;
}

/**
 * Composant pour afficher les actualités country music depuis Supabase
 * 
 * Utilise les données synchronisées depuis GNews API via Edge Function
 */
export const GoogleNewsRSS: React.FC<GoogleNewsRSSProps> = ({ 
  title = "Country Music News",
  description = "Latest country music news from Google News",
  maxItems = 10,
  className = '',
  showLastUpdated = true
}) => {
  // Utiliser le hook Supabase pour récupérer les données synchronisées
  const { news: supabaseNews, loading, error: supabaseError, lastUpdate, refetch, syncNews } = useCountryNews();
  
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fonction pour générer une image de fallback thématique intelligente
  const generateFallbackImage = (title: string): string => {
    // Créer une image SVG avec dégradé basé sur le titre
    const colors = [
      ['#FF6B35', '#F7931E'], // Orange-rouge
      ['#4ECDC4', '#44A08D'], // Turquoise
      ['#A8E6CF', '#7FCDCD'], // Vert menthe
      ['#FFD93D', '#FF6B6B'], // Jaune-rouge
      ['#6C5CE7', '#A29BFE'], // Violet
      ['#FD79A8', '#FDCB6E'], // Rose-jaune
    ];
    
    // Sélectionner une couleur basée sur le hash du titre
    const hash = title.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const colorPair = colors[Math.abs(hash) % colors.length];
    
    // Créer le SVG
    const svg = `
      <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colorPair[0]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colorPair[1]};stop-opacity:1" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="32" fill="url(#grad)" />
        <text x="32" y="38" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="white">♪</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  // Transformer les données Supabase en format NewsItem avec déduplication
  useEffect(() => {
    if (supabaseNews && supabaseNews.length > 0) {
      console.log(`📰 Transformation de ${supabaseNews.length} articles Supabase...`);
      
      // Déduplication par titre ET par URL pour éviter les doublons
      const uniqueArticles = supabaseNews.filter((article, index, array) => {
        const isDuplicate = array.findIndex(a => 
          a.title === article.title || a.link === article.link
        ) !== index;
        
        if (isDuplicate) {
          console.log(`🔄 Doublon détecté et supprimé: ${article.title}`);
        }
        
        return !isDuplicate;
      });
      
      console.log(`🧹 Déduplication: ${supabaseNews.length} → ${uniqueArticles.length} articles uniques`);
      
      const transformedNews: NewsItem[] = uniqueArticles
        .slice(0, maxItems) // Limiter au nombre demandé après déduplication
        .map((article: CountryNewsItem) => ({
          title: article.title || '',
          link: article.link || '',
          description: article.description || '',
          pubDate: article.pub_date || new Date().toISOString(),
          source: 'Country Music News', // Source fixe car données depuis Supabase
          guid: article.link || `article-${article.id}`,
          imageUrl: article.image_url || generateFallbackImage(article.title || ''),
          sourceUrl: article.link || ''
        }));
      
      console.log(`✅ ${transformedNews.length} articles transformés et dédupliqués`);
      console.log(`🖼️ ${transformedNews.filter(a => a.imageUrl && !a.imageUrl.startsWith('data:')).length}/${transformedNews.length} articles avec vraies images`);
      
      setNews(transformedNews);
    }
  }, [supabaseNews, maxItems]);

  // Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  // Fonction pour actualiser manuellement
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncNews(); // Déclencher une synchronisation
      await refetch(); // Puis recharger les données
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading && news.length === 0) {
    return (
      <div className={`max-w-6xl mx-auto p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading news...</p>
        </div>
      </div>
    );
  }

  if (supabaseError && news.length === 0) {
    return (
      <div className={`max-w-6xl mx-auto p-6 ${className}`}>
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Loading error</h3>
            <p className="text-red-600 mb-4">❌ {supabaseError}</p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2 disabled:opacity-50 mx-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Retry'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-gray-600">{description}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Rss className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        {showLastUpdated && lastUpdate && (
          <p className="text-sm text-gray-500 mb-4">
            Last update: {formatDate(lastUpdate)}
          </p>
        )}
      </header>

      {/* Liste des actualités */}
      <div className="space-y-4">
        {news.map((article) => (
          <article
            key={article.guid}
            className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-200"
            itemScope
            itemType="https://schema.org/NewsArticle"
          >
            <div className="flex items-start space-x-4">
              {/* Image circulaire */}
              <div className="flex-shrink-0">
                {article.imageUrl ? (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-32 h-32 rounded-full object-cover border-2 border-gray-100"
                    onError={(e) => {
                      // Fallback vers l'icône RSS si l'image ne charge pas
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`w-32 h-32 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center ${article.imageUrl ? 'hidden' : 'flex'}`}
                >
                  <Rss className="w-16 h-16 text-white" />
                </div>
              </div>
              
              {/* Contenu de l'article */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900 mb-2 leading-tight" itemProp="headline">
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-orange-600 transition-colors"
                  >
                    {article.title}
                  </a>
                </h2>
                
                {article.description && (
                  <p className="text-gray-600 mb-3 text-sm leading-relaxed line-clamp-2" itemProp="description">
                    {article.description}
                  </p>
                )}
                
                {/* Métadonnées */}
                <div className="flex items-center space-x-3 text-xs text-gray-500 uppercase tracking-wide">
                  <span itemProp="publisher" className="font-medium">
                    {article.source}
                  </span>
                  <span>•</span>
                  <time dateTime={article.pubDate} itemProp="datePublished">
                    {formatDate(article.pubDate)}
                  </time>
                </div>
              </div>
              
              {/* Icône lien externe */}
              <div className="flex-shrink-0">
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-orange-600 transition-colors rounded-full hover:bg-orange-50"
                  aria-label="Read full article"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>
          News provided by{' '}
          <a
            href="https://news.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 hover:text-orange-700 underline font-medium"
          >
            Google News
          </a>
        </p>
        <p className="mt-2">
          News automatically updated every 30 minutes
        </p>
      </footer>
    </div>
  );
}
