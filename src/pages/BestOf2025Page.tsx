import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Play, Star, Music } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { useCountryVideos } from '../hooks/useCountryVideos';
import { useTop30 } from '../hooks/useTop30';
import { YouTubePlayerModal } from '../components/YouTubePlayerModal';
import { generateArtistSlug } from '../utils/seo';
import type { CountryVideo } from '../hooks/useCountryVideos';

export default function BestOf2025Page() {
  const { videos, loading: videosLoading } = useCountryVideos();
  const { items: top30Items, loading: top30Loading } = useTop30();
  const [selectedVideo, setSelectedVideo] = useState<CountryVideo | null>(null);

  // Filter videos from 2025
  const videos2025 = videos.filter(v => {
    const year = new Date(v.published_at).getFullYear();
    return year === 2025;
  });

  // Get unique artists from 2025 videos
  const topArtists2025 = Array.from(
    videos2025.reduce((acc, video) => {
      acc.set(video.artist, (acc.get(video.artist) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const loading = videosLoading || top30Loading;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <SEOHead 
          title="Best Country Songs 2025 | CountryMusic-Hub.com"
          description="Loading best country songs of 2025..."
          canonical="/best-country-songs-2025"
        />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading best of 2025...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <SEOHead 
        title="Best Country Songs 2025 - Top Hits & Videos | CountryMusic-Hub.com"
        description={`Discover the best country songs of 2025. ${videos2025.length} official music videos from Morgan Wallen, Luke Combs, Zach Bryan and more. The definitive 2025 country music collection.`}
        canonical="/best-country-songs-2025"
        keywords="best country songs 2025, top country music 2025, country hits 2025, best country videos 2025, country music year in review"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Videos', url: '/country-music-videos' },
          { name: 'Best of 2025', url: '/best-country-songs-2025' }
        ]}
      />

      {/* Header */}
      <header className="text-center mb-12 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-12">
        <div className="inline-flex items-center bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Award className="w-4 h-4 mr-2" />
          YEAR IN REVIEW
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Best Country Songs of 2025
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          The definitive collection of country music's biggest hits from 2025. 
          Relive the year's best moments in country music.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
            <span className="text-2xl font-bold text-purple-600">{videos2025.length}</span>
            <span className="text-gray-600 ml-2">Videos</span>
          </div>
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
            <span className="text-2xl font-bold text-purple-600">{topArtists2025.length}</span>
            <span className="text-gray-600 ml-2">Top Artists</span>
          </div>
        </div>
      </header>

      {/* Top Artists of 2025 */}
      <section className="mb-12">
        <div className="flex items-center mb-6">
          <Star className="w-6 h-6 text-yellow-500 mr-2" />
          <h2 className="text-2xl font-bold text-gray-800">Top Artists of 2025</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {topArtists2025.map(([artist, count], index) => (
            <Link
              key={artist}
              to={`/artist/${generateArtistSlug(artist)}`}
              className="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-lg transition-shadow relative overflow-hidden"
            >
              {index < 3 && (
                <div className={`absolute top-0 right-0 px-2 py-1 text-xs font-bold text-white ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                }`}>
                  #{index + 1}
                </div>
              )}
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">{artist}</h3>
              <p className="text-xs text-gray-500 mt-1">{count} videos</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Current Chart Hits from 2025 */}
      {top30Items.length > 0 && (
        <section className="mb-12 bg-yellow-50 rounded-xl p-8">
          <div className="flex items-center mb-6">
            <Award className="w-6 h-6 text-yellow-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">2025 Songs Still on the Charts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {top30Items.slice(0, 6).map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="bg-yellow-500 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    #{item.rank}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{item.title}</h3>
                    <Link 
                      to={`/artist/${generateArtistSlug(item.artist)}`}
                      className="text-xs text-gray-500 hover:text-red-600"
                    >
                      {item.artist}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link 
              to="/top-30-country-songs" 
              className="text-yellow-700 hover:text-yellow-800 font-medium"
            >
              View Full Top 30 Chart →
            </Link>
          </div>
        </section>
      )}

      {/* Videos from 2025 */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Play className="w-6 h-6 text-red-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">Official Videos from 2025</h2>
          </div>
          <span className="text-gray-500">{videos2025.length} videos</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos2025.slice(0, 12).map((video) => (
            <div 
              key={video.id} 
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-video bg-gray-200">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => setSelectedVideo(video)}
                  className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center group cursor-pointer"
                  aria-label={`Play ${video.title}`}
                >
                  <div className="bg-red-600 rounded-full p-3 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                    <Play className="h-6 w-6 text-white fill-current" />
                  </div>
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2">{video.title}</h3>
                <Link 
                  to={`/artist/${generateArtistSlug(video.artist)}`}
                  className="text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  {video.artist}
                </Link>
              </div>
            </div>
          ))}
        </div>
        {videos2025.length > 12 && (
          <div className="text-center mt-8">
            <Link 
              to="/country-music-videos" 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
            >
              View All Videos
              <Play className="w-4 h-4 ml-2" />
            </Link>
          </div>
        )}
      </section>

      {/* SEO Content */}
      <section className="bg-gray-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">2025: A Year in Country Music</h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-4">
            2025 was an incredible year for country music, with artists pushing boundaries while 
            honoring the genre's rich traditions. From chart-topping hits to emotional ballads, 
            the year delivered unforgettable moments that resonated with fans worldwide.
          </p>
          <p className="text-gray-600 mb-4">
            Artists like Morgan Wallen, Luke Combs, and Zach Bryan continued their dominance, 
            while new voices emerged to capture the hearts of country music lovers. The year 
            saw a beautiful blend of traditional country sounds with modern production techniques, 
            creating a diverse musical landscape.
          </p>
          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Highlights of 2025</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Record-breaking streaming numbers for country music</li>
            <li>Crossover hits that brought country to new audiences</li>
            <li>Memorable live performances and tours</li>
            <li>Award-winning albums and singles</li>
          </ul>
        </div>
      </section>

      {/* Related Pages */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-gray-800 mb-6">More Country Music Collections</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/new-country-music-releases" className="bg-green-50 hover:bg-green-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-green-800">New Releases</span>
          </Link>
          <Link to="/top-30-country-songs" className="bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-yellow-800">Top 30 Chart</span>
          </Link>
          <Link to="/country-music-videos" className="bg-red-50 hover:bg-red-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-red-800">All Videos</span>
          </Link>
          <Link to="/country-music-news" className="bg-blue-50 hover:bg-blue-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-blue-800">Latest News</span>
          </Link>
        </div>
      </section>

      {/* YouTube Player Modal */}
      {selectedVideo && (
        <YouTubePlayerModal
          videoId={selectedVideo.video_id}
          title={selectedVideo.title}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}
