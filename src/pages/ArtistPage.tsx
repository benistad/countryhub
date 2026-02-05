import { useParams, Link } from 'react-router-dom';
import { User, Play, Music, ArrowLeft, Video, Trophy } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { useCountryVideos } from '../hooks/useCountryVideos';
import { useTop30 } from '../hooks/useTop30';
import { YouTubePlayerModal } from '../components/YouTubePlayerModal';
import { useState } from 'react';
import { generateArtistSchema, generateArtistSlug, parseArtistSlug } from '../utils/seo';
import type { CountryVideo } from '../hooks/useCountryVideos';

export default function ArtistPage() {
  const { artistSlug } = useParams<{ artistSlug: string }>();
  const { videos, loading: videosLoading } = useCountryVideos();
  const { items: top30Items, loading: top30Loading } = useTop30();
  const [selectedVideo, setSelectedVideo] = useState<CountryVideo | null>(null);

  // Parse artist name from slug
  const artistName = artistSlug ? parseArtistSlug(artistSlug) : '';
  
  // Filter videos by artist (case-insensitive)
  const artistVideos = videos.filter(
    video => video.artist.toLowerCase() === artistName.toLowerCase()
  );

  // Find artist in Top 30
  const artistTop30 = top30Items.filter(
    item => item.artist.toLowerCase() === artistName.toLowerCase()
  );

  // Get all unique artists for related links
  const allArtists = Array.from(new Set(videos.map(v => v.artist)));
  const relatedArtists = allArtists
    .filter(a => a.toLowerCase() !== artistName.toLowerCase())
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);

  // Format artist name for display (capitalize each word)
  const displayName = artistName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Generate artist schema
  const artistSchema = generateArtistSchema({
    name: displayName,
    description: `${displayName} - Country music artist. Watch official music videos, check chart positions and discover more on CountryMusic-Hub.com`,
    genres: ['Country', 'Country Music'],
  });

  const loading = videosLoading || top30Loading;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <SEOHead 
          title={`${displayName} - Loading... | CountryMusic-Hub.com`}
          description={`Loading ${displayName} country music content...`}
          canonical={`/artist/${artistSlug}`}
        />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading artist content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <SEOHead 
        title={`${displayName} - Country Music Videos & Chart Positions | CountryMusic-Hub.com`}
        description={`Watch ${displayName}'s official country music videos and check their Billboard chart positions. ${artistVideos.length} videos available. Updated daily.`}
        canonical={`/artist/${artistSlug}`}
        keywords={`${displayName}, ${displayName} videos, ${displayName} country music, ${displayName} songs, ${displayName} music videos`}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Artists', url: '/country-music-videos' },
          { name: displayName, url: `/artist/${artistSlug}` }
        ]}
      />

      {/* Inject artist schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(artistSchema) }} />

      {/* Back Navigation */}
      <Link 
        to="/country-music-videos" 
        className="inline-flex items-center text-gray-600 hover:text-red-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Videos
      </Link>

      {/* Artist Header */}
      <header className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 mb-8">
        <div className="flex items-center mb-4">
          <div className="bg-red-600 p-4 rounded-full mr-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-800" itemProp="name">{displayName}</h1>
            <p className="text-gray-600">Country Music Artist</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
            <span className="text-2xl font-bold text-red-600">{artistVideos.length}</span>
            <span className="text-gray-600 ml-2">Videos</span>
          </div>
          {artistTop30.length > 0 && (
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
              <span className="text-2xl font-bold text-yellow-600">{artistTop30.length}</span>
              <span className="text-gray-600 ml-2">Chart Positions</span>
            </div>
          )}
        </div>
      </header>

      {/* Chart Positions */}
      {artistTop30.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <Trophy className="w-6 h-6 text-yellow-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">Current Chart Positions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artistTop30.map((item, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-4 border-l-4 border-yellow-500">
                <div className="flex items-center">
                  <div className="bg-yellow-500 text-white font-bold text-lg w-10 h-10 rounded-full flex items-center justify-center mr-3">
                    #{item.rank}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.title}</h3>
                    <p className="text-sm text-gray-500">Billboard Top 30</p>
                  </div>
                </div>
                {item.apple_music_url && (
                  <a
                    href={item.apple_music_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center text-sm text-gray-600 hover:text-red-600"
                  >
                    <Music className="w-4 h-4 mr-1" />
                    Listen on Apple Music
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Videos Section */}
      <section className="mb-12">
        <div className="flex items-center mb-6">
          <Video className="w-6 h-6 text-red-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-800">Official Videos</h2>
        </div>
        
        {artistVideos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No videos found for {displayName}</p>
            <Link to="/country-music-videos" className="text-red-600 hover:underline mt-2 inline-block">
              Browse all videos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artistVideos.map((video) => (
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
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(video.published_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related Artists */}
      {relatedArtists.length > 0 && (
        <section className="bg-gray-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Related Artists</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {relatedArtists.map(artist => (
              <Link
                key={artist}
                to={`/artist/${generateArtistSlug(artist)}`}
                className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow"
              >
                <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-800">{artist}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

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
