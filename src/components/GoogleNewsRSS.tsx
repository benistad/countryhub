import { useState, useEffect } from 'react';
import { Rss, ExternalLink, Clock } from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  guid: string;
  imageUrl?: string;
  sourceUrl?: string; // URL source réelle pour Microlink API
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
 * Composant pour afficher les actualités country music depuis Google News RSS
 * 
 * Utilise le flux RSS Google News spécialisé country music :
 * https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNREZzZVhZU0FtVnVLQUFQAQ?hl=en-US&gl=US&ceid=US:en
 */
export const GoogleNewsRSS: React.FC<GoogleNewsRSSProps> = ({ 
  title = "Country Music News",
  description = "Latest country music news from Google News",
  maxItems = 10,
  className = '',
  showLastUpdated = true
}) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Configuration GNews API
  const GNEWS_API_KEY = import.meta.env.VITE_GNEWS_API_KEY || '51b0d3ddea619a88159c2a793a9dca83';
  const GNEWS_BASE_URL = 'https://gnews.io/api/v4/search';

  // Fonction pour récupérer les actualités via GNews API
  const fetchNews = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📡 Récupération des actualités country via GNews API...');
      
      // Construire l'URL de l'API GNews
      const params = new URLSearchParams({
        q: 'country music',
        lang: 'en',
        country: 'us',
        max: maxItems.toString(),
        apikey: GNEWS_API_KEY
      });
      
      const gnewsUrl = `${GNEWS_BASE_URL}?${params}`;
      console.log(`📡 URL GNews: ${gnewsUrl.replace(GNEWS_API_KEY, '[API_KEY]')}`);
      
      const response = await fetch(gnewsUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CountryMusicHub/1.0'
        }
      });
      
      console.log(`📊 Réponse GNews: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`GNews API HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📋 Données GNews reçues:`, data);
      
      if (!data.articles || !Array.isArray(data.articles)) {
        throw new Error('Format de réponse GNews invalide');
      }
      
      // Transformer les articles GNews en format NewsItem
      const newsItems: NewsItem[] = data.articles.map((article: any, index: number) => ({
        title: article.title || '',
        link: article.url || '',
        description: article.description || '',
        pubDate: article.publishedAt || new Date().toISOString(),
        source: article.source?.name || 'GNews',
        guid: article.url || `gnews-${index}`,
        imageUrl: article.image || '', // GNews fournit directement l'image !
        sourceUrl: article.url || ''
      }));
      
      console.log(`📰 ${newsItems.length} articles country music récupérés via GNews`);
      console.log(`🖼️ ${newsItems.filter(a => a.imageUrl).length}/${newsItems.length} articles avec images`);
      
      // Ajouter fallback pour les articles sans image
      const enrichedNews = newsItems.map(article => {
        if (!article.imageUrl) {
          console.log(`🎨 Génération image fallback pour: ${article.title}`);
          return {
            ...article,
            imageUrl: generateFallbackImage(article.title)
          };
        }
        return article;
      });
      
      setNews(enrichedNews);
      setLastUpdated(new Date());
      setLoading(false);
      
      console.log(`✅ ${enrichedNews.length} articles country music chargés avec succès`);
      
    } catch (error) {
      console.error('❌ Erreur GNews API:', error);
      setError(`Erreur lors de la récupération des actualités: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setLoading(false);
    }
  };

  // Fonction pour générer une image de fallback thématique intelligente
  const generateFallbackImage = (title: string): string => {
    // Analyser le titre pour choisir une image appropriée
    const titleLower = title.toLowerCase();
    
    // Images Unsplash spécifiques par thème country
    const themeImages = {
      // Artistes et concerts
      concert: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
      artist: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
      guitar: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
      
      // Événements et awards
      awards: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
      festival: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
      
      // Nashville et country culture
      nashville: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
      country: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
      
      // Default
      default: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center&auto=format&q=80'
    };
    
    // Déterminer le thème basé sur le titre
    if (titleLower.includes('concert') || titleLower.includes('tour') || titleLower.includes('show')) {
      return themeImages.concert;
    } else if (titleLower.includes('award') || titleLower.includes('nomination') || titleLower.includes('cma') || titleLower.includes('grammy')) {
      return themeImages.awards;
    } else if (titleLower.includes('festival') || titleLower.includes('fest')) {
      return themeImages.festival;
    } else if (titleLower.includes('guitar') || titleLower.includes('music')) {
      return themeImages.guitar;
    } else if (titleLower.includes('nashville')) {
      return themeImages.nashville;
    } else {
      return themeImages.country;
    }
  };

  useEffect(() => {
    // Charger immédiatement au montage
    fetchNews();
    
    // Actualiser automatiquement toutes les 30 minutes (1800000 ms)
    const newsRefreshInterval = setInterval(() => {
      console.log('🔄 Actualisation automatique des news GoogleNewsRSS (30 min)...');
      fetchNews();
    }, 30 * 60 * 1000);

    // Nettoyer l'intervalle au démontage
    return () => {
      clearInterval(newsRefreshInterval);
    };
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date inconnue';
    }
  };

  const handleRefresh = () => {
    fetchNews();
  };

  if (loading) {
    return (
      <div className={`max-w-6xl mx-auto p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des actualités country...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`max-w-6xl mx-auto p-6 ${className}`}>
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`} itemScope itemType="https://schema.org/NewsMediaOrganization">
      {/* En-tête */}
      <header className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Rss className="w-10 h-10 text-orange-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-800" itemProp="name">{title}</h1>
        </div>
        <p className="text-xl text-gray-600 mb-4" itemProp="description">
          {description}
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>
              {lastUpdated ? `Mis à jour: ${formatDate(lastUpdated.toISOString())}` : 'Chargement...'}
            </span>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center text-orange-600 hover:text-orange-700 transition-colors"
          >
            <Rss className="w-4 h-4 mr-1" />
            Actualiser
          </button>
        </div>
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
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
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
                  className={`w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center ${article.imageUrl ? 'hidden' : 'flex'}`}
                >
                  <Rss className="w-8 h-8 text-white" />
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
                  aria-label="Lire l'article complet"
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
          Actualités fournies par{' '}
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
          Actualités mises à jour automatiquement toutes les 30 minutes
        </p>
      </footer>
    </div>
  );
}
