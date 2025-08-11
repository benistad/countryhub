import React, { useState, useEffect } from 'react';
import { Play, Calendar, User, ExternalLink, RefreshCw, Star } from 'lucide-react';
import { useOfficialVideos, VideosData } from '../hooks/useOfficialVideos';

export const OfficialVideos: React.FC = () => {
  const [videosData, setVideosData] = useState<VideosData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // État de chargement local
  const { getStoredVideosData, syncOfficialVideos, loading } = useOfficialVideos();

  const loadVideosData = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      console.log('📥 Chargement des vidéos officielles...');
      
      const storedData = await getStoredVideosData();
      if (storedData) {
        console.log(`✅ ${storedData.videos.length} vidéos chargées depuis Supabase`);
        setVideosData(storedData);
        return;
      }

      // Si aucune donnée n'est disponible, afficher une erreur claire
      throw new Error('Aucune vidéo officielle disponible. Les données n\'ont pas pu être récupérées depuis Supabase.');
    } catch (err) {
      console.error('❌ Erreur lors du chargement des vidéos:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVideosData();
    
    // Écouter les événements de mise à jour depuis la page Admin
    const handleVideosUpdate = (event: CustomEvent) => {
      if (event.detail) {
        setVideosData(event.detail);
      } else {
        loadVideosData();
      }
    };
    
    window.addEventListener('officialVideosUpdated', handleVideosUpdate as EventListener);
    
    return () => {
      window.removeEventListener('officialVideosUpdated', handleVideosUpdate as EventListener);
    };
  }, []);

  const officialVideos = videosData?.videos || [];

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Chargement des vidéos officielles...</p>
          <p className="text-gray-500 text-sm mt-2">Récupération depuis Supabase</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 rounded-lg p-8">
          <p className="text-red-600 text-lg mb-2">Erreur de chargement</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={loadVideosData}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          <Star className="w-8 h-8 inline mr-2 text-yellow-500" />
          Official Country Music Videos
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto mb-4">
          Découvrez les dernières vidéos officielles d'artistes country
        </p>
        {videosData && (
          <div className="text-sm text-gray-500">
            <p>{videosData.totalVideos} vidéos • {videosData.totalChannels} chaînes</p>
            <p>Dernière synchronisation: {new Date(videosData.lastSyncAt).toLocaleDateString('fr-FR')}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {officialVideos.map((video) => (
          <div key={video.videoId} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-yellow-500">
            <div className="relative">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Play className="w-12 h-12 text-white" />
              </div>
              <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                OFFICIAL
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                {video.title}
              </h3>
              
              <div className="flex items-center mb-2">
                <User className="w-4 h-4 mr-1 text-gray-500" />
                <p className="text-gray-600 text-sm font-medium">
                  {video.artist}
                </p>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(video.publishedAt).toLocaleDateString('fr-FR')}
              </div>
              
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
              >
                <Play className="w-4 h-4 mr-2" />
                Regarder sur YouTube
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {officialVideos.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Aucune vidéo officielle disponible</p>
            <p className="text-gray-400 text-sm">Revenez plus tard pour les dernières sorties officielles!</p>
            <button
              onClick={loadVideosData}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
