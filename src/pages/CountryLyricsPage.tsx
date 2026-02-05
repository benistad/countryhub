import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Play, Search } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { useCountryVideos } from '../hooks/useCountryVideos';
import { YouTubePlayerModal } from '../components/YouTubePlayerModal';
import { generateArtistSlug } from '../utils/seo';
import type { CountryVideo } from '../hooks/useCountryVideos';

export default function CountryLyricsPage() {
  const { videos, loading } = useCountryVideos();
  const [selectedVideo, setSelectedVideo] = useState<CountryVideo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter lyric videos
  const lyricVideos = videos.filter(v => 
    v.title.toLowerCase().includes('lyric') || 
    v.title.toLowerCase().includes('lyrics')
  );

  // Filter by search
  const filteredVideos = lyricVideos.filter(v =>
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unique artists with lyric videos
  const artistsWithLyrics = Array.from(new Set(lyricVideos.map(v => v.artist))).slice(0, 12);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <SEOHead 
          title="Country Music Lyrics Videos | CountryMusic-Hub.com"
          description="Loading country music lyric videos..."
          canonical="/country-lyrics-videos"
        />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lyric videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <SEOHead 
        title="Country Music Lyrics Videos - Sing Along | CountryMusic-Hub.com"
        description={`Watch ${lyricVideos.length} country music lyric videos. Sing along to your favorite country songs from Morgan Wallen, Luke Combs, Zach Bryan and more. Official lyrics videos updated daily.`}
        canonical="/country-lyrics-videos"
        keywords="country music lyrics, country lyrics videos, country song lyrics, sing along country, country music karaoke, country lyric videos"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Videos', url: '/country-music-videos' },
          { name: 'Lyrics Videos', url: '/country-lyrics-videos' }
        ]}
      />

      {/* Header */}
      <header className="text-center mb-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-12">
        <div className="inline-flex items-center bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <FileText className="w-4 h-4 mr-2" />
          SING ALONG
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Country Music Lyrics Videos
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Sing along to your favorite country songs with official lyric videos. 
          Perfect for learning the words to the latest hits.
        </p>
        
        {/* Search */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search lyrics videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
          />
        </div>

        <div className="mt-6 text-sm text-gray-500">
          {lyricVideos.length} lyric videos available
        </div>
      </header>

      {/* Artists with Lyrics */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Browse by Artist</h2>
        <div className="flex flex-wrap gap-2">
          {artistsWithLyrics.map(artist => (
            <Link
              key={artist}
              to={`/artist/${generateArtistSlug(artist)}`}
              className="bg-white border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition-colors"
            >
              {artist}
            </Link>
          ))}
        </div>
      </section>

      {/* Lyrics Videos Grid */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {searchTerm ? `Results for "${searchTerm}"` : 'All Lyrics Videos'}
          </h2>
          <span className="text-gray-500">{filteredVideos.length} videos</span>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No lyric videos found for "{searchTerm}"</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="text-indigo-600 hover:underline mt-2"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
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
                    <div className="bg-indigo-600 rounded-full p-3 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                      <Play className="h-6 w-6 text-white fill-current" />
                    </div>
                  </button>
                  <div className="absolute top-2 left-2 bg-indigo-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                    <FileText className="w-3 h-3 mr-1" />
                    LYRICS
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{video.title}</h3>
                  <Link 
                    to={`/artist/${generateArtistSlug(video.artist)}`}
                    className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                  >
                    {video.artist}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SEO Content */}
      <section className="bg-gray-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">About Country Music Lyrics Videos</h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-4">
            Lyric videos have become an essential part of the country music experience. 
            Whether you're learning the words to a new favorite song or singing along to 
            a classic, our collection of official lyric videos makes it easy to connect 
            with the music you love.
          </p>
          <p className="text-gray-600 mb-4">
            Our library features lyric videos from today's biggest country stars including 
            Morgan Wallen, Luke Combs, Chris Stapleton, Zach Bryan, Lainey Wilson, and many 
            more. Each video is sourced directly from official artist channels to ensure 
            you're getting the correct lyrics.
          </p>
          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Why Lyric Videos?</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Learn the words to your favorite country songs</li>
            <li>Perfect for karaoke practice and sing-alongs</li>
            <li>Great for understanding the story behind the song</li>
            <li>Official lyrics from the artists themselves</li>
          </ul>
        </div>
      </section>

      {/* Related Pages */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Explore More</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/country-music-videos" className="bg-red-50 hover:bg-red-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-red-800">All Videos</span>
          </Link>
          <Link to="/new-country-music-releases" className="bg-green-50 hover:bg-green-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-green-800">New Releases</span>
          </Link>
          <Link to="/top-30-country-songs" className="bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-yellow-800">Top 30 Chart</span>
          </Link>
          <Link to="/best-country-songs-2025" className="bg-purple-50 hover:bg-purple-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-purple-800">Best of 2025</span>
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
