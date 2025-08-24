import { useState, useEffect } from 'react';
import { Settings, Trophy, Rss, TrendingUp, Star, ArrowRight, Video } from 'lucide-react';
import AdminPanel from './components/AdminPanel';
import { GoogleNewsRSS } from './components/GoogleNewsRSS';
import { Top30Page } from './components/Top30Page';
import VideosCountry from './components/VideosCountry';
import { useTop30 } from './hooks/useTop30';
import { useHomepageAutoRefresh } from './hooks/useHomepageAutoRefresh';
import { SEOHead } from './components/SEOHead';
import { AccessibilityEnhancements, LoadingAnnouncement } from './components/AccessibilityEnhancements';
import { UpdateNotification } from './components/UpdateNotification';
import { HomepageNews } from './components/HomepageNews';
import { HomepageVideos } from './components/HomepageVideos';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  
  // Hooks pour les données
  const { items: top30Items, loading: top30Loading } = useTop30();
  const [showAdmin, setShowAdmin] = useState(true);
  
  // États pour les notifications d'actualisation
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'info' | 'loading';
  }>({ show: false, message: '', type: 'info' });
  
  // Hook d'actualisation automatique de la homepage
  const { setUpdateCallbacks, forceRefreshAll } = useHomepageAutoRefresh();

  // SEO data for each page
  const getSEOData = (tab: string) => {
    const seoData = {
      home: {
        title: 'CountryMusic-Hub.com - Country Music News, Videos & Charts',
        description: 'Your #1 destination for country music news, official music videos, Billboard charts and trending country hits. Updated daily with the latest from Nashville.',
        canonical: '/',
        keywords: 'country music, country music news, official music videos, Billboard country charts, Nashville news, country hits',
        breadcrumbs: [{ name: 'Home', url: '/' }],
        noindex: false
      },
      top30: {
        title: 'Top 30 Country Music Chart - CountryMusic-Hub.com',
        description: 'Discover the top 30 country music songs trending now. AI-powered rankings updated weekly with the hottest country hits.',
        canonical: '/top30',
        keywords: 'top 30 country, country music chart, country music rankings, trending country songs',
        breadcrumbs: [
          { name: 'Home', url: '/' },
          { name: 'Top 30', url: '/top30' }
        ],
        noindex: false
      },
      'country-news': {
        title: 'Country Music News - Latest Updates - CountryMusic-Hub.com',
        description: 'Stay updated with the latest country music news, artist updates, and industry insights. Fresh content updated hourly.',
        canonical: '/country-news',
        keywords: 'country music news, Nashville news, country music industry, country artists news',
        breadcrumbs: [
          { name: 'Home', url: '/' },
          { name: 'News', url: '/country-news' }
        ],
        noindex: false
      },
      videos: {
        title: 'Vidéos Country Officielles - CountryMusic-Hub.com',
        description: 'Découvrez les dernières vidéos officielles des artistes country. Collection mise à jour automatiquement depuis YouTube.',
        canonical: '/videos',
        keywords: 'vidéos country, vidéos officielles, YouTube country, clips country, musique country',
        breadcrumbs: [
          { name: 'Home', url: '/' },
          { name: 'Vidéos', url: '/videos' }
        ],
        noindex: false
      },
      admin: {
        title: 'Administration - CountryMusic-Hub.com',
        description: 'Admin panel for managing content and site settings.',
        canonical: '/admin',
        keywords: 'admin, administration, management',
        noindex: true,
        breadcrumbs: [
          { name: 'Home', url: '/' },
          { name: 'Admin', url: '/admin' }
        ]
      }
    };
    return seoData[tab as keyof typeof seoData] || seoData.home;
  };

  // Accès admin caché via combinaison de touches (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        setActiveTab('admin');
        setShowAdmin(true);
        
        // Notification discrète pour confirmer l'accès
        setNotification({
          show: true,
          message: 'Admin panel activated',
          type: 'info'
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setActiveTab, setShowAdmin, setNotification]);

  // Gestion de la navigation vers les vidéos depuis HomepageVideos
  useEffect(() => {
    const handleNavigateToVideos = () => {
      setActiveTab('videos');
    };

    window.addEventListener('navigate-to-videos', handleNavigateToVideos);
    return () => window.removeEventListener('navigate-to-videos', handleNavigateToVideos);
  }, [setActiveTab]);

  // Configuration des callbacks d'actualisation automatique
  useEffect(() => {
    setUpdateCallbacks({
      onTop30Updated: () => {
        console.log('🎵 Top30 mis à jour - Actualisation de la homepage');
        setNotification({
          show: true,
          message: 'Top 30 mis à jour automatiquement',
          type: 'success'
        });
      },
      onNewsUpdated: () => {
        console.log('📰 News mises à jour - Actualisation de la homepage');
        // Rafraîchir le composant HomepageNews
        if ((window as any).refreshHomepageNews) {
          (window as any).refreshHomepageNews();
        }
        setNotification({
          show: true,
          message: 'Actualités mises à jour automatiquement',
          type: 'success'
        });
      }
    });
  }, [setUpdateCallbacks, forceRefreshAll]);

  // Les news sont maintenant gérées par le hook useCountryNews qui lit depuis Supabase
  // La synchronisation avec GNews API se fait via l'Edge Function sync-gnews-country

  // Vérifier l'accès admin et initialiser l'onglet basé sur l'URL au chargement initial
  useEffect(() => {
    const checkAdminAccess = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;
      
      // Accès admin caché via URL secrète ou paramètre
      const isSecretAdminPath = pathname === '/secret-admin' || 
                               pathname.endsWith('/secret-admin') ||
                               hash === '#secret-admin' ||
                               search.includes('admin=true');
      
      return isSecretAdminPath;
    };

    const initializeTabFromURL = () => {
      const pathname = window.location.pathname;
      
      if (pathname === '/top30' || pathname.endsWith('/top30')) {
        setActiveTab('top30');
        return 'top30';
      } else if (pathname === '/country-news' || pathname.endsWith('/country-news')) {
        setActiveTab('country-news');
        return 'country-news';
      }
      return null;
    };
    
    const isAdminPath = checkAdminAccess();
    const urlTab = initializeTabFromURL();
    
    if (isAdminPath) {
      setActiveTab('admin');
      setShowAdmin(true);
    } else if (urlTab) {
      setShowAdmin(false);
    }
    
    // Écouter les changements d'URL pour l'accès direct à l'admin
    const handleHashChange = () => {
      if (checkAdminAccess()) {
        setActiveTab('admin');
        setShowAdmin(true);
      } else {
        setShowAdmin(false);
      }
    };
    
    const handlePopState = () => {
      if (checkAdminAccess()) {
        setActiveTab('admin');
        setShowAdmin(true);
      } else {
        setShowAdmin(false);
        if (activeTab === 'admin') {
          setActiveTab('home');
        }
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeTab]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    
    if (tab === 'admin') {
      // Utiliser pushState pour changer l'URL sans recharger
      window.history.pushState({}, '', '/admin');
      setShowAdmin(true);
    } else {
      window.history.pushState({}, '', '/');
      setShowAdmin(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'admin':
        return <AdminPanel />;

      case 'top30':
        return (
          <div className="space-y-6">
            <SEOHead 
              title="Top 30 Country Songs - Billboard Charts"
              description="Current Top 30 country music chart with the hottest country songs. Updated weekly with official Billboard data."
              canonical="/top30"
            />
            <Top30Page />
          </div>
        );

      case 'country-news':
        return (
          <div className="space-y-6">
            <SEOHead 
              title="Country Music News - Latest Updates"
              description="Stay updated with the latest country music news, artist updates, album releases and industry insights. Updated 24/7."
              canonical="/country-news"
            />
            <GoogleNewsRSS />
          </div>
        );

      case 'videos':
        return (
          <div className="space-y-6">
            <SEOHead 
              title="Vidéos Country Officielles - CountryMusic-Hub.com"
              description="Découvrez les dernières vidéos officielles des artistes country. Collection mise à jour automatiquement depuis YouTube."
              canonical="/videos"
            />
            <VideosCountry />
          </div>
        );

      default:
        return (
          <div className="space-y-16">
            <SEOHead 
              title="CountryMusic-Hub.com - Your Country Music Destination"
              description="Discover the latest country music news, official music videos, Billboard charts and trending hits. Your country music hub updated daily."
              canonical="/"
            />
            
            {/* Hero Header Section */}
            <header className="text-center py-16 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-3xl border border-red-100" itemScope itemType="https://schema.org/WebSite">
              <div className="max-w-5xl mx-auto px-4">
                <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-8" itemProp="name">
                  Welcome to <span className="text-red-600 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">CountryMusic-Hub.com</span>
                </h1>
                <p className="text-2xl text-gray-700 mb-10 leading-relaxed max-w-3xl mx-auto" itemProp="description">
                  Your ultimate destination for country music: latest hits, official videos, breaking news and Billboard charts - all in one place.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => handleTabClick('top30')}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <Trophy className="w-5 h-5 inline mr-2" />
                    Explore Top 30
                  </button>
                </div>
              </div>
            </header>

            {/* News Preview Section */}
            <HomepageNews onViewAllClick={() => handleTabClick('country-news')} />
            
            {/* Videos Preview Section */}
            <HomepageVideos />

            {/* Top30 Preview Section */}
            <section className="space-y-8" itemScope itemType="https://schema.org/MusicPlaylist">
              <div className="text-center mb-12">
                <div className="inline-flex items-center bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <Trophy className="w-4 h-4 mr-2" />
                  BILLBOARD CHARTS
                </div>
                <h2 className="text-4xl font-bold text-gray-800 mb-4" itemProp="name">Top 30 Country Songs</h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto" itemProp="description">
                  The hottest country songs dominating the charts right now
                </p>
              </div>
                
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 border border-yellow-100">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                      <div className="bg-yellow-500 p-3 rounded-xl mr-4">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">Current Chart Toppers</h3>
                        <p className="text-gray-600">Updated weekly from Billboard</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTabClick('top30')}
                      className="flex items-center bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                      aria-label="View full Top 30"
                    >
                      View Full Chart
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                  
                  {top30Loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white rounded-2xl shadow-md p-6 animate-pulse">
                          <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-xl mr-4"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {top30Items.slice(0, 6).map((item, index) => (
                        <div key={item.id || index} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                          <div className="flex items-center mb-4">
                            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-xl w-12 h-12 rounded-xl flex items-center justify-center mr-4">
                              #{item.rank}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg text-gray-800 line-clamp-1">{item.title}</h4>
                              <p className="text-gray-600">{item.artist}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">#{item.rank}</span>
                            {item.apple_music_url ? (
                              <a 
                                href={item.apple_music_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center bg-black text-white px-3 py-1 rounded-full text-xs hover:bg-gray-800 transition-colors"
                              >
                                🎵 Apple Music
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">Chart Hit</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Enhanced Stats Section */}
              <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-white" itemScope itemType="https://schema.org/WebSite">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4">Why Choose CountryMusic-Hub?</h2>
                  <p className="text-gray-300 text-lg">Your trusted source for everything country music</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                  <div itemScope itemType="https://schema.org/MusicPlaylist" className="bg-gray-800 rounded-2xl p-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-purple-500 p-3 rounded-xl">
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <span className="text-4xl font-bold text-purple-400 block mb-2" itemProp="numTracks">{top30Items.length || 30}</span>
                    <h3 className="text-lg font-semibold mb-2" itemProp="name">Chart Positions</h3>
                    <p className="text-gray-400 text-sm" itemProp="description">Updated weekly</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl p-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-orange-500 p-3 rounded-xl">
                        <TrendingUp className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <span className="text-4xl font-bold text-orange-400 block mb-2">24/7</span>
                    <h3 className="text-lg font-semibold mb-2">Live Updates</h3>
                    <p className="text-gray-400 text-sm">Real-time content sync</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl p-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-yellow-500 p-3 rounded-xl">
                        <Star className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <span className="text-4xl font-bold text-yellow-400 block mb-2">100%</span>
                    <h3 className="text-lg font-semibold mb-2">Automated</h3>
                    <p className="text-gray-400 text-sm">AI-powered curation</p>
                  </div>

                  <div className="bg-gray-800 rounded-2xl p-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-blue-500 p-3 rounded-xl">
                        <Rss className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <span className="text-4xl font-bold text-blue-400 block mb-2">24/7</span>
                    <h3 className="text-lg font-semibold mb-2">Country News</h3>
                    <p className="text-gray-400 text-sm">Updated hourly</p>
                  </div>
                </div>
              </section>
            </div>
          );
    }
  };

  const currentSEO = getSEOData(activeTab);
  const pageNames = {
    home: 'Home',
    top30: 'Top 30 Chart',
    'country-news': 'Country News',
    videos: 'Vidéos Country',
    admin: 'Administration'
  };
  const currentPageName = pageNames[activeTab as keyof typeof pageNames] || 'Home';

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title={currentSEO.title}
        description={currentSEO.description}
        canonical={currentSEO.canonical}
        keywords={currentSEO.keywords || ''}
        breadcrumbs={currentSEO.breadcrumbs}
        noindex={currentSEO.noindex || false}
      />
      <AccessibilityEnhancements currentPage={currentPageName} />
      <LoadingAnnouncement 
        isLoading={top30Loading} 
        content="page content" 
      />

      <nav className="bg-white shadow-md" role="navigation" aria-label="Navigation principale">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img 
                src="/Canva 8 png.png" 
                alt="CountryMusic-Hub.com Logo" 
                className="w-16 h-16 mr-2 object-contain"
              />
              <div className="flex items-center">
                <span className="text-xl font-bold text-gray-800">CountryMusic-Hub.com</span>
                <span className="ml-2 px-2 py-1 text-xs font-bold bg-orange-500 text-white rounded-full uppercase tracking-wide shadow-sm">
                  Beta
                </span>
              </div>
            </div>
            <div className="flex space-x-8">
              <button
                onClick={() => handleTabClick('home')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'home'
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-label="Home"
              >
                Home
              </button>

              <button
                onClick={() => handleTabClick('videos')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'videos'
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-label="Vidéos Country"
              >
                <Video className="w-4 h-4 inline mr-1" />
                Vidéos
              </button>
              <button
                onClick={() => handleTabClick('country-news')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'country-news'
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-label="Country music news"
              >
                <Rss className="w-4 h-4 inline mr-1" />
                News
              </button>
              <button
                onClick={() => handleTabClick('top30')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'top30'
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-label="Top 30 Country"
              >
                <Trophy className="w-4 h-4 inline mr-1" />
                Top 30
              </button>
              {showAdmin && (
                <button
                  onClick={() => handleTabClick('admin')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'admin'
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-label="Administration"
                >
                  <Settings className="w-4 h-4 inline mr-1" />
                  Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main id="main-content" className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" role="main">
        <div className="px-4 py-6 sm:px-0">
          {renderContent()}
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white py-8 mt-16" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">CountryMusic-Hub.com</h3>
              <p className="text-gray-300">
                Your #1 destination for country music news, official music videos and Billboard charts.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Sections</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" onClick={() => handleTabClick('videos')} className="hover:text-white">Vidéos</a></li>
                <li><a href="#" onClick={() => handleTabClick('top30')} className="hover:text-white">Top 30</a></li>
                <li><a href="#" onClick={() => handleTabClick('country-news')} className="hover:text-white">News</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">About</h4>
              <p className="text-gray-300 text-sm">
                Content updated automatically 24/7. Data from official sources and analyzed by AI.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 CountryMusic-Hub.com. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      {/* Notification d'actualisation automatique */}
      <UpdateNotification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}

export default App;
