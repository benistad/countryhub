import { Link } from 'react-router-dom';
import { Trophy, Rss, TrendingUp, Star, ArrowRight, Video } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { HomepageNews } from '../components/HomepageNews';
import { HomepageVideos } from '../components/HomepageVideos';
import { useTop30 } from '../hooks/useTop30';

export default function HomePage() {
  const { items: top30Items, loading: top30Loading } = useTop30();

  return (
    <div className="space-y-16">
      <SEOHead 
        title="CountryMusic-Hub.com - Country Music News, Videos & Charts"
        description="Your #1 destination for country music news, official music videos, Billboard charts and trending country hits. Updated daily with the latest from Nashville."
        canonical="/"
        keywords="country music, country music news, official music videos, Billboard country charts, Nashville news, country hits"
        breadcrumbs={[{ name: 'Home', url: '/' }]}
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
            <Link
              to="/top-30-country-songs"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg inline-flex items-center justify-center"
            >
              <Trophy className="w-5 h-5 mr-2" />
              Explore Top 30
            </Link>
            <Link
              to="/country-music-videos"
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg inline-flex items-center justify-center"
            >
              <Video className="w-5 h-5 mr-2" />
              Watch Videos
            </Link>
          </div>
        </div>
      </header>

      {/* News Preview Section */}
      <HomepageNews onViewAllClick={() => {}} />
      
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
            <Link
              to="/top-30-country-songs"
              className="flex items-center bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            >
              View Full Chart
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
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
                      <Link 
                        to={`/artist/${item.artist.toLowerCase().replace(/\s+/g, '-')}`}
                        className="text-gray-600 hover:text-red-600 transition-colors"
                      >
                        {item.artist}
                      </Link>
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
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-white">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose CountryMusic-Hub?</h2>
          <p className="text-gray-300 text-lg">Your trusted source for everything country music</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-purple-500 p-3 rounded-xl">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            </div>
            <span className="text-4xl font-bold text-purple-400 block mb-2">{top30Items.length || 30}</span>
            <h3 className="text-lg font-semibold mb-2">Chart Positions</h3>
            <p className="text-gray-400 text-sm">Updated weekly</p>
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

      {/* FAQ Section for SEO */}
      <section className="bg-white rounded-3xl p-8 shadow-lg" itemScope itemType="https://schema.org/FAQPage">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6 max-w-3xl mx-auto">
          <div itemScope itemType="https://schema.org/Question" className="border-b border-gray-200 pb-6">
            <h3 itemProp="name" className="text-lg font-semibold text-gray-800 mb-2">
              What is CountryMusic-Hub.com?
            </h3>
            <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
              <p itemProp="text" className="text-gray-600">
                CountryMusic-Hub.com is your #1 destination for country music content, featuring the latest news, official music videos from top artists, and Billboard Top 30 country charts. Our content is automatically updated 24/7 using AI-powered curation.
              </p>
            </div>
          </div>
          
          <div itemScope itemType="https://schema.org/Question" className="border-b border-gray-200 pb-6">
            <h3 itemProp="name" className="text-lg font-semibold text-gray-800 mb-2">
              How often is the Top 30 chart updated?
            </h3>
            <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
              <p itemProp="text" className="text-gray-600">
                Our Top 30 country music chart is updated weekly, synchronized with the official Billboard Hot Country Songs chart. You'll always see the most current rankings of the hottest country hits.
              </p>
            </div>
          </div>
          
          <div itemScope itemType="https://schema.org/Question" className="border-b border-gray-200 pb-6">
            <h3 itemProp="name" className="text-lg font-semibold text-gray-800 mb-2">
              Where do the country music videos come from?
            </h3>
            <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
              <p itemProp="text" className="text-gray-600">
                All videos are sourced directly from official artist YouTube channels. We automatically sync with channels from top country artists to bring you the latest official music videos, lyric videos, and live performances.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
