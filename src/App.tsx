import { useState, useEffect } from 'react';
import { Settings, Trophy, Rss, TrendingUp, Star, ArrowRight, Play } from 'lucide-react';
import AdminPanel from './components/AdminPanel';
import { GoogleNewsRSS } from './components/GoogleNewsRSS';
import { Top30Page } from './components/Top30Page';
import { OfficialVideos } from './components/OfficialVideos';
import { useTop30 } from './hooks/useTop30';
import { useCountryNews } from './hooks/useCountryNews';
import { useSupabaseOfficialVideos } from './hooks/useSupabaseOfficialVideos';
import { Video } from './hooks/useOfficialVideos';
import { SEOHead } from './components/SEOHead';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const { news, loading: newsLoading } = useCountryNews();
  const { items: top30Items, loading: top30Loading } = useTop30();
  const { getVideosFromSupabase } = useSupabaseOfficialVideos();
  const [showAdmin, setShowAdmin] = useState(true);
  const [officialVideos, setOfficialVideos] = useState<Video[]>([]);
  const [officialVideosLoading, setOfficialVideosLoading] = useState(true);

  useEffect(() => {
    const updatePageTitle = () => {
      const titles = {
        home: 'CountryMusic-Hub.com - Actualités, Vidéos et Classements Country',
        'official-videos': 'Vidéos OFFICIAL - CountryMusic-Hub.com',
        top30: 'Top 30 Country - CountryMusic-Hub.com',
        'country-news': 'Actualités Country en Direct - CountryMusic-Hub.com',
        admin: 'Administration - CountryMusic-Hub.com'
      };
      document.title = titles[activeTab as keyof typeof titles] || titles.home;
    };

    updatePageTitle();
  }, [activeTab]);

  // Charger les 3 dernières vidéos officielles pour la homepage
  useEffect(() => {
    const loadOfficialVideos = async () => {
      try {
        setOfficialVideosLoading(true);
        const videosData = await getVideosFromSupabase();
        if (videosData && videosData.videos) {
          // Prendre les 3 dernières vidéos
          setOfficialVideos(videosData.videos.slice(0, 3));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des vidéos officielles:', error);
      } finally {
        setOfficialVideosLoading(false);
      }
    };

    loadOfficialVideos();
  }, [getVideosFromSupabase]);

  // Les news sont maintenant gérées par le hook useCountryNews qui lit depuis Supabase
  // La synchronisation avec GNews API se fait via l'Edge Function sync-gnews-country

  // Vérifier l'accès admin et initialiser l'onglet basé sur l'URL au chargement initial
  useEffect(() => {
    const checkAdminAccess = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      
      console.log('Checking admin access:', { pathname, hash });
      
      const isAdminPath = pathname === '/admin' || 
                         pathname.endsWith('/admin') ||
                         hash === '#admin';
      
      console.log('Is admin path:', isAdminPath);
      
      return isAdminPath;
    };

    const initializeTabFromURL = () => {
      const pathname = window.location.pathname;
      console.log('Initializing tab from URL:', pathname);
      
      if (pathname === '/official-videos' || pathname.endsWith('/official-videos')) {
        setActiveTab('official-videos');
        return 'official-videos';
      } else if (pathname === '/top30' || pathname.endsWith('/top30')) {
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
      console.log('Setting admin access');
      setActiveTab('admin');
      setShowAdmin(true);
    } else if (urlTab) {
      console.log('Setting tab from URL:', urlTab);
      setShowAdmin(false);
    }
    
    // Écouter les changements d'URL pour l'accès direct à l'admin
    const handleHashChange = () => {
      console.log('Hash changed:', window.location.hash);
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

      case 'official-videos':
        return (
          <div className="space-y-6">
            <SEOHead 
              title="Official Country Videos - Latest Releases"
              description="Latest official country music videos published after August 1, 2025. Curated from top country artists and channels."
              canonical="/official-videos"
            />
            <OfficialVideos />
          </div>
        );

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

      default:
        return (
          <div className="space-y-16">
            <SEOHead 
              title="CountryMusic-Hub.com - Your Country Music Destination"
              description="Discover the latest country music news, official music videos, Billboard charts and trending hits. Your country music hub updated daily."
              canonical="/"
            />
            
            {/* Hero Section */}
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
                  <button
                    onClick={() => handleTabClick('official-videos')}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <Play className="w-5 h-5 inline mr-2" />
                    Watch Official Videos
                  </button>
                </div>
              </div>
            </header>

            {/* OFFICIAL Videos Section */}
            <section className="space-y-8" itemScope itemType="https://schema.org/VideoObject">
              <div className="text-center mb-12">
                <div className="inline-flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <Play className="w-4 h-4 mr-2" />
                  NEW RELEASES
                </div>
                <h2 className="text-4xl font-bold text-gray-800 mb-4" itemProp="name">Official Music Videos</h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto" itemProp="description">
                  Latest official country music videos from top artists and rising stars
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-3xl p-8 border border-red-100">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div className="bg-red-500 p-3 rounded-xl mr-4">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">Latest Official Releases</h3>
                      <p className="text-gray-600">Curated from top country channels</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTabClick('official-videos')}
                    className="flex items-center bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    aria-label="View all official videos"
                  >
                    View All Videos
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              
              {officialVideosLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-2xl shadow-md p-6 animate-pulse">
                      <div className="aspect-video bg-gray-200 rounded-xl mb-4"></div>
                      <div className="h-5 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {officialVideos.length > 0 ? officialVideos.map((video, index) => (
                    <a 
                      key={video.videoId} 
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block"
                    >
                      <div className="aspect-video bg-gradient-to-br from-red-100 to-pink-100 rounded-xl mb-4 overflow-hidden">
                        {video.thumbnailUrl ? (
                          <img 
                            src={video.thumbnailUrl} 
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-12 h-12 text-red-500" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold text-lg mb-2 text-gray-800 line-clamp-2">{video.title}</h4>
                      <p className="text-gray-600 text-sm mb-3">{video.artist}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full">Official</span>
                        <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                      </div>
                    </a>
                  )) : (
                    <div className="col-span-3 text-center py-8">
                      <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune vidéo officielle disponible</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

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
                      <div key={index} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
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

            {/* News Preview Section */}
            <section className="space-y-8" itemScope itemType="https://schema.org/NewsArticle">
              <div className="text-center mb-12">
                <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <Rss className="w-4 h-4 mr-2" />
                  BREAKING NEWS
                </div>
                <h2 className="text-4xl font-bold text-gray-800 mb-4" itemProp="headline">Latest Country News</h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto" itemProp="description">
                  Stay updated with breaking news, artist updates and industry insights from Nashville
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div className="bg-blue-500 p-3 rounded-xl mr-4">
                      <Rss className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">Hot Stories</h3>
                      <p className="text-gray-600">Real-time updates from top sources</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTabClick('country-news')}
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    aria-label="View all news"
                  >
                    Read All News
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
                
                {newsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="bg-white rounded-2xl shadow-md p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-3"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  news.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {news.slice(0, 6).map((article, index) => (
                        <article key={article.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                          {/* Image Section */}
                          <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden">
                            {article.image_url ? (
                              <img 
                                src={article.image_url} 
                                alt={article.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Rss className="w-12 h-12 text-blue-500" />
                              </div>
                            )}
                          </div>
                          
                          {/* Content Section */}
                          <div className="p-6">
                            <div className="mb-4">
                              <h4 className="font-semibold text-lg mb-3 text-gray-800 line-clamp-2 leading-tight">{article.title}</h4>
                              {article.description && (
                                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{article.description}</p>
                              )}
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-600 font-medium">Country Music News</span>
                                <span className="text-gray-500">{new Date(article.pub_date).toLocaleDateString('fr-FR')}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                {index === 0 ? 'Latest' : 'Breaking'}
                              </span>
                              <a 
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline transition-colors"
                              >
                                Read More →
                              </a>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Rss className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Aucun article disponible pour le moment</p>
                      <p className="text-gray-400 text-sm mt-2">Les dernières actualités country seront bientôt disponibles</p>
                      <p className="text-gray-400 text-xs mt-2">Debug: {news.length} articles chargés</p>
                    </div>
                  )
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
                    <div className="bg-red-500 p-3 rounded-xl">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <span className="text-4xl font-bold text-red-400 block mb-2">∞</span>
                  <h3 className="text-lg font-semibold mb-2">Official Videos</h3>
                  <p className="text-gray-400 text-sm">Latest releases</p>
                </div>
              </div>
            </section>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
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
                onClick={() => handleTabClick('official-videos')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'official-videos'
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-label="Official videos since August 2025"
              >
                <Play className="w-4 h-4 inline mr-1" />
                OFFICIAL
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" role="main">
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
    </div>
  );
}

export default App;
