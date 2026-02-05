import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Play, Clock, TrendingUp } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { useCountryVideos } from '../hooks/useCountryVideos';
import { YouTubePlayerModal } from '../components/YouTubePlayerModal';
import { generateArtistSlug } from '../utils/seo';
import type { CountryVideo } from '../hooks/useCountryVideos';

export default function NewReleasesPage() {
  const { videos, loading } = useCountryVideos();
  const [selectedVideo, setSelectedVideo] = useState<CountryVideo | null>(null);

  // Get videos from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newReleases = videos
    .filter(v => new Date(v.published_at) >= thirtyDaysAgo)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  // Group by week
  const thisWeek = newReleases.filter(v => {
    const videoDate = new Date(v.published_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return videoDate >= weekAgo;
  });

  const lastWeek = newReleases.filter(v => {
    const videoDate = new Date(v.published_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return videoDate < weekAgo && videoDate >= twoWeeksAgo;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <SEOHead 
          title="New Country Music Releases 2026 | CountryMusic-Hub.com"
          description="Loading new country music releases..."
          canonical="/new-country-music-releases"
        />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading new releases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <SEOHead 
        title="New Country Music Releases 2026 - Latest Videos | CountryMusic-Hub.com"
        description={`Discover ${newReleases.length} new country music videos released this month. Watch the latest from Morgan Wallen, Luke Combs, Zach Bryan and more Nashville artists.`}
        canonical="/new-country-music-releases"
        keywords="new country music 2026, new country songs, latest country releases, new country videos, country music releases this week"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Videos', url: '/country-music-videos' },
          { name: 'New Releases', url: '/new-country-music-releases' }
        ]}
      />

      {/* Header */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <TrendingUp className="w-4 h-4 mr-2" />
          FRESH RELEASES
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          New Country Music Releases
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          The latest country music videos released this month. Updated daily with fresh content from Nashville's top artists.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-500">
          <span className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {newReleases.length} videos this month
          </span>
          <span className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Updated daily
          </span>
        </div>
      </header>

      {/* This Week Section */}
      {thisWeek.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold mr-4">
              This Week
            </div>
            <span className="text-gray-500">{thisWeek.length} new videos</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {thisWeek.map((video) => (
              <VideoCard 
                key={video.id} 
                video={video} 
                onPlay={() => setSelectedVideo(video)}
                formatDate={formatDate}
              />
            ))}
          </div>
        </section>
      )}

      {/* Last Week Section */}
      {lastWeek.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold mr-4">
              Last Week
            </div>
            <span className="text-gray-500">{lastWeek.length} videos</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lastWeek.map((video) => (
              <VideoCard 
                key={video.id} 
                video={video} 
                onPlay={() => setSelectedVideo(video)}
                formatDate={formatDate}
              />
            ))}
          </div>
        </section>
      )}

      {/* Earlier This Month */}
      {newReleases.length > thisWeek.length + lastWeek.length && (
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <div className="bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold mr-4">
              Earlier This Month
            </div>
            <span className="text-gray-500">
              {newReleases.length - thisWeek.length - lastWeek.length} videos
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newReleases.slice(thisWeek.length + lastWeek.length).map((video) => (
              <VideoCard 
                key={video.id} 
                video={video} 
                onPlay={() => setSelectedVideo(video)}
                formatDate={formatDate}
              />
            ))}
          </div>
        </section>
      )}

      {/* SEO Content Section */}
      <section className="bg-gray-50 rounded-xl p-8 mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">About New Country Music Releases</h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-4">
            Stay up-to-date with the latest country music releases from Nashville and beyond. 
            Our collection features new official music videos, lyric videos, and live performances 
            from today's biggest country stars including Morgan Wallen, Luke Combs, Chris Stapleton, 
            Zach Bryan, Lainey Wilson, and many more.
          </p>
          <p className="text-gray-600 mb-4">
            We update our new releases section daily, pulling the freshest content directly from 
            official artist YouTube channels. Whether you're looking for the newest country ballads, 
            upbeat country rock, or traditional country sounds, you'll find it here first.
          </p>
          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">What's Trending in Country Music 2026</h3>
          <p className="text-gray-600">
            Country music continues to evolve with artists blending traditional sounds with modern 
            production. This year has seen incredible releases spanning from heartfelt ballads to 
            high-energy anthems. Check back regularly to discover the next big country hit before 
            it tops the charts.
          </p>
        </div>
      </section>

      {/* Internal Links */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Explore More Country Music</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/top-30-country-songs" className="bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-yellow-800">Top 30 Chart</span>
          </Link>
          <Link to="/country-music-videos" className="bg-red-50 hover:bg-red-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-red-800">All Videos</span>
          </Link>
          <Link to="/country-music-news" className="bg-blue-50 hover:bg-blue-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-blue-800">Country News</span>
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

// Video Card Component
function VideoCard({ 
  video, 
  onPlay, 
  formatDate 
}: { 
  video: CountryVideo; 
  onPlay: () => void;
  formatDate: (date: string) => string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
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
          onClick={onPlay}
          className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center group cursor-pointer"
          aria-label={`Play ${video.title}`}
        >
          <div className="bg-red-600 rounded-full p-3 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
            <Play className="h-6 w-6 text-white fill-current" />
          </div>
        </button>
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          NEW
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{video.title}</h3>
        <Link 
          to={`/artist/${generateArtistSlug(video.artist)}`}
          className="text-sm text-gray-600 hover:text-red-600 transition-colors"
        >
          {video.artist}
        </Link>
        <p className="text-xs text-gray-400 mt-2 flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          {formatDate(video.published_at)}
        </p>
      </div>
    </div>
  );
}
