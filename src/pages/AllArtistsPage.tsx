import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Music, TrendingUp } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { useCountryVideos } from '../hooks/useCountryVideos';
import { useTop30 } from '../hooks/useTop30';
import { generateArtistSlug } from '../utils/seo';

interface ArtistStats {
  name: string;
  videoCount: number;
  chartPosition?: number;
  slug: string;
}

export default function AllArtistsPage() {
  const { videos, loading: videosLoading } = useCountryVideos();
  const { items: top30Items, loading: top30Loading } = useTop30();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'videos' | 'chart'>('videos');

  // Build artist stats
  const artistStats = useMemo(() => {
    const statsMap = new Map<string, ArtistStats>();

    // Count videos per artist
    videos.forEach(video => {
      const existing = statsMap.get(video.artist);
      if (existing) {
        existing.videoCount++;
      } else {
        statsMap.set(video.artist, {
          name: video.artist,
          videoCount: 1,
          slug: generateArtistSlug(video.artist),
        });
      }
    });

    // Add chart positions
    top30Items.forEach(item => {
      const existing = statsMap.get(item.artist);
      if (existing) {
        if (!existing.chartPosition || item.rank < existing.chartPosition) {
          existing.chartPosition = item.rank;
        }
      } else {
        statsMap.set(item.artist, {
          name: item.artist,
          videoCount: 0,
          chartPosition: item.rank,
          slug: generateArtistSlug(item.artist),
        });
      }
    });

    return Array.from(statsMap.values());
  }, [videos, top30Items]);

  // Filter and sort
  const filteredArtists = useMemo(() => {
    let result = artistStats.filter(artist =>
      artist.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'videos':
        result.sort((a, b) => b.videoCount - a.videoCount);
        break;
      case 'chart':
        result.sort((a, b) => {
          if (a.chartPosition && b.chartPosition) return a.chartPosition - b.chartPosition;
          if (a.chartPosition) return -1;
          if (b.chartPosition) return 1;
          return b.videoCount - a.videoCount;
        });
        break;
    }

    return result;
  }, [artistStats, searchTerm, sortBy]);

  // Get featured artists (most videos + on chart)
  const featuredArtists = artistStats
    .filter(a => a.chartPosition && a.videoCount > 0)
    .sort((a, b) => (a.chartPosition || 999) - (b.chartPosition || 999))
    .slice(0, 8);

  const loading = videosLoading || top30Loading;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <SEOHead 
          title="All Country Music Artists | CountryMusic-Hub.com"
          description="Loading country music artists..."
          canonical="/artists"
        />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading artists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <SEOHead 
        title="All Country Music Artists A-Z | CountryMusic-Hub.com"
        description={`Browse ${artistStats.length} country music artists. Watch videos, check chart positions for Morgan Wallen, Luke Combs, Zach Bryan, Chris Stapleton and more Nashville stars.`}
        canonical="/artists"
        keywords="country music artists, country singers, Nashville artists, country music stars, country artists list"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'All Artists', url: '/artists' }
        ]}
      />

      {/* Header */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Users className="w-4 h-4 mr-2" />
          ARTIST DIRECTORY
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Country Music Artists
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Browse all {artistStats.length} country music artists. Watch their videos and check their chart positions.
        </p>
      </header>

      {/* Featured Artists */}
      {featuredArtists.length > 0 && (
        <section className="mb-12 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-6 h-6 text-red-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">Featured Artists</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredArtists.map(artist => (
              <Link
                key={artist.slug}
                to={`/artist/${artist.slug}`}
                className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-orange-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800">{artist.name}</h3>
                <div className="flex items-center justify-center gap-2 mt-2 text-xs">
                  {artist.chartPosition && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                      #{artist.chartPosition}
                    </span>
                  )}
                  <span className="text-gray-500">{artist.videoCount} videos</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search artists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('videos')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              sortBy === 'videos' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Most Videos
          </button>
          <button
            onClick={() => setSortBy('chart')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              sortBy === 'chart' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Chart Position
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              sortBy === 'name' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            A-Z
          </button>
        </div>
      </div>

      {/* Artists Grid */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {searchTerm ? `Results for "${searchTerm}"` : 'All Artists'}
          </h2>
          <span className="text-gray-500">{filteredArtists.length} artists</span>
        </div>

        {filteredArtists.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No artists found for "{searchTerm}"</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="text-red-600 hover:underline mt-2"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredArtists.map(artist => (
              <Link
                key={artist.slug}
                to={`/artist/${artist.slug}`}
                className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <h3 className="font-medium text-gray-800 mb-2 line-clamp-1">{artist.name}</h3>
                <div className="flex items-center gap-2 text-xs">
                  {artist.chartPosition && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      #{artist.chartPosition}
                    </span>
                  )}
                  {artist.videoCount > 0 && (
                    <span className="text-gray-500">{artist.videoCount} videos</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* SEO Content */}
      <section className="bg-gray-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Country Music Artists Directory</h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-4">
            Explore our comprehensive directory of country music artists. From legendary icons to 
            rising stars, we feature artists who are shaping the sound of modern country music. 
            Each artist page includes their official music videos, current chart positions, and 
            related content.
          </p>
          <p className="text-gray-600 mb-4">
            Our collection includes artists from all subgenres of country music - traditional country, 
            country pop, country rock, outlaw country, and more. Whether you're a fan of Morgan Wallen's 
            chart-topping hits, Luke Combs' heartfelt ballads, or Zach Bryan's authentic storytelling, 
            you'll find all their content here.
          </p>
          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Popular Country Artists</h3>
          <p className="text-gray-600">
            Some of the most popular country artists on our platform include Morgan Wallen, Luke Combs, 
            Chris Stapleton, Zach Bryan, Lainey Wilson, Jelly Roll, Kane Brown, Cody Johnson, and many more. 
            Click on any artist to explore their complete video collection and see where they rank on the charts.
          </p>
        </div>
      </section>

      {/* Related Pages */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Explore More</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/country-music-videos" className="bg-red-50 hover:bg-red-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-red-800">All Videos</span>
          </Link>
          <Link to="/top-30-country-songs" className="bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-yellow-800">Top 30 Chart</span>
          </Link>
          <Link to="/new-country-music-releases" className="bg-green-50 hover:bg-green-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-green-800">New Releases</span>
          </Link>
          <Link to="/country-music-news" className="bg-blue-50 hover:bg-blue-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-blue-800">Country News</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
