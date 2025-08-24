import { } from 'react';
import { Play, Calendar, User, ArrowRight, Video } from 'lucide-react';
import { useCountryVideos, CountryVideo } from '../hooks/useCountryVideos';

export function HomepageVideos() {
  const { videos, loading, error } = useCountryVideos();
  
  // Prendre les 6 dernières vidéos
  const latestVideos = videos.slice(0, 6);

  if (loading) {
    return (
      <section className="py-16 bg-white" itemScope itemType="https://schema.org/VideoGallery">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des vidéos...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || latestVideos.length === 0) {
    return null; // Ne pas afficher la section s'il y a une erreur ou pas de vidéos
  }

  return (
    <section className="py-16 bg-white" itemScope itemType="https://schema.org/VideoGallery">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-xl">
              <Video className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4" itemProp="name">
            Dernières Vidéos Country
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto" itemProp="description">
            Découvrez les dernières vidéos officielles des artistes country, mises à jour automatiquement.
          </p>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {latestVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              // Déclencher le changement d'onglet vers videos
              const event = new CustomEvent('navigate-to-videos');
              window.dispatchEvent(event);
            }}
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Voir toutes les vidéos
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
        </div>
      </div>
    </section>
  );
}

interface VideoCardProps {
  video: CountryVideo;
}

function VideoCard({ video }: VideoCardProps) {
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else if (diffInHours < 168) {
      const days = Math.floor(diffInHours / 24);
      return `Il y a ${days}j`;
    } else {
      const weeks = Math.floor(diffInHours / 168);
      return `Il y a ${weeks}sem`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300" itemScope itemType="https://schema.org/VideoObject">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-200">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover"
            loading="lazy"
            itemProp="thumbnailUrl"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center group">
          <div className="bg-red-600 rounded-full p-3 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
            <Play className="h-6 w-6 text-white fill-current" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight" itemProp="name">
          {video.title}
        </h3>
        
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <User className="h-4 w-4 mr-1" />
          <span className="truncate" itemProp="creator">{video.artist}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <Calendar className="h-4 w-4 mr-1" />
          <span itemProp="uploadDate">{formatRelativeTime(video.published_at)}</span>
        </div>

        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
          itemProp="url"
        >
          <Play className="h-4 w-4 mr-2" />
          Regarder sur YouTube
        </a>
      </div>
    </div>
  );
}
