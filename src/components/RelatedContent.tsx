import { Link } from 'react-router-dom';
import { Music, Video, Trophy, Rss, TrendingUp, Users } from 'lucide-react';
import { generateArtistSlug } from '../utils/seo';

interface RelatedContentProps {
  currentPage: 'artist' | 'video' | 'chart' | 'news' | 'home';
  currentArtist?: string;
  relatedArtists?: string[];
  showQuickLinks?: boolean;
}

export function RelatedContent({ 
  currentPage, 
  currentArtist,
  relatedArtists = [],
  showQuickLinks = true 
}: RelatedContentProps) {
  // Quick links based on current page
  const quickLinks = [
    { 
      to: '/top-30-country-songs', 
      label: 'Top 30 Chart', 
      icon: Trophy, 
      color: 'yellow',
      show: currentPage !== 'chart'
    },
    { 
      to: '/country-music-videos', 
      label: 'All Videos', 
      icon: Video, 
      color: 'red',
      show: currentPage !== 'video'
    },
    { 
      to: '/country-music-news', 
      label: 'Latest News', 
      icon: Rss, 
      color: 'blue',
      show: currentPage !== 'news'
    },
    { 
      to: '/new-country-music-releases', 
      label: 'New Releases', 
      icon: TrendingUp, 
      color: 'green',
      show: true
    },
    { 
      to: '/artists', 
      label: 'All Artists', 
      icon: Users, 
      color: 'purple',
      show: currentPage !== 'artist'
    },
  ].filter(link => link.show);

  const colorClasses: Record<string, string> = {
    yellow: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800',
    red: 'bg-red-50 hover:bg-red-100 text-red-800',
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-800',
    green: 'bg-green-50 hover:bg-green-100 text-green-800',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-800',
  };

  return (
    <aside className="mt-12 space-y-8">
      {/* Related Artists */}
      {relatedArtists.length > 0 && (
        <section className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <Music className="w-5 h-5 mr-2 text-red-600" />
            {currentArtist ? 'Similar Artists' : 'Popular Artists'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {relatedArtists.slice(0, 8).map(artist => (
              <Link
                key={artist}
                to={`/artist/${generateArtistSlug(artist)}`}
                className="bg-white border border-gray-200 hover:border-red-500 hover:bg-red-50 rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition-colors"
              >
                {artist}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick Links */}
      {showQuickLinks && (
        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Explore More Country Music</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {quickLinks.map(link => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-lg p-4 text-center transition-colors ${colorClasses[link.color]}`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-2" />
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* SEO Text Block */}
      <section className="text-sm text-gray-500 border-t pt-6">
        <p>
          Discover more country music content on CountryMusic-Hub.com. 
          We feature official music videos, Billboard chart rankings, and the latest news 
          from Nashville's top artists including Morgan Wallen, Luke Combs, Zach Bryan, 
          Chris Stapleton, and many more.
        </p>
      </section>
    </aside>
  );
}

export default RelatedContent;
