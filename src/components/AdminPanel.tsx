import React, { useState, useEffect } from 'react';
import { Settings, Youtube, Trophy, RefreshCw, BarChart3, Music, Play, Video, Plus, ExternalLink, Search, Trash2, Eye } from 'lucide-react';
import { YouTubeChannelsManager } from './YouTubeChannelsManager';
import { useTop30 } from '../hooks/useTop30';
import { useOfficialVideos } from '../hooks/useOfficialVideos';
import { useSupabaseOfficialVideos } from '../hooks/useSupabaseOfficialVideos';

const AdminPanel: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'youtube-channels' | 'sync-management' | 'library-management'>('overview');
  const [syncing, setSyncing] = useState({ top30: false, officialVideos: false });
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [officialVideosStats, setOfficialVideosStats] = useState({ total: 0, lastSync: null as string | null });
  const [manualVideoForm, setManualVideoForm] = useState({ url: '', artist: '', loading: false, message: '' });
  const [libraryManagement, setLibraryManagement] = useState({ 
    searchTerm: '', 
    videos: [] as any[], 
    loading: false, 
    message: '',
    selectedVideo: null as any,
    showDeleteModal: false,
    videoToDelete: null as any
  });
  
  const { syncFromApify, getStats: getTop30Stats, lastUpdate: top30LastUpdate } = useTop30();
  const { syncOfficialVideos } = useOfficialVideos();
  const { getVideosFromSupabase, getSyncStats, addVideoManually, deleteVideoFromSupabase, searchVideosInSupabase } = useSupabaseOfficialVideos();

  const top30Stats = getTop30Stats();

  // Charger les statistiques des vidéos officielles
  useEffect(() => {
    const loadOfficialVideosStats = async () => {
      try {
        // Récupérer les vidéos pour compter le total
        const videosData = await getVideosFromSupabase();
        const total = videosData?.videos.length || 0;

        // Récupérer les stats de synchronisation pour la dernière date
        const syncStats = await getSyncStats();
        const lastSync = syncStats.length > 0 ? syncStats[0].last_sync_at : null;

        setOfficialVideosStats({ total, lastSync });
      } catch (error) {
        console.error('Erreur lors du chargement des stats OFFICIAL:', error);
        setOfficialVideosStats({ total: 0, lastSync: null });
      }
    };

    if (activeSection === 'sync-management') {
      loadOfficialVideosStats();
    }
  }, [activeSection, getVideosFromSupabase, getSyncStats]);

  /**
   * Formate la date de dernière mise à jour
   */
  const formatLastUpdate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffHours < 1) {
        return 'Il y a moins d\'1h';
      } else if (diffHours < 24) {
        return `Il y a ${diffHours}h`;
      } else if (diffDays === 1) {
        return 'Hier';
      } else if (diffDays < 7) {
        return `Il y a ${diffDays} jours`;
      } else {
        return date.toLocaleDateString('fr-FR', { 
          day: 'numeric',
          month: 'short',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch {
      return 'Date invalide';
    }
  };




  /**
   * Synchronisation du Top30
   */
  const handleTop30Sync = async () => {
    setSyncing(prev => ({ ...prev, top30: true }));
    try {
      const result = await syncFromApify();
      console.log('Synchronisation Top30 terminée:', result);
    } catch (error) {
      console.error('Erreur lors de la synchronisation Top30:', error);
    } finally {
      setSyncing(prev => ({ ...prev, top30: false }));
    }
  };

  const handleOfficialVideosSync = async () => {
    setSyncing(prev => ({ ...prev, officialVideos: true }));
    setSyncMessage('');
    
    try {
      const result = await syncOfficialVideos();
      console.log('Synchronisation vidéos officielles terminée:', result);
      
      if (result.success) {
        setSyncMessage(`✅ ${result.message}`);
        
        // Déclencher l'événement pour mettre à jour la page OFFICIAL
        window.dispatchEvent(new CustomEvent('officialVideosUpdated', { 
          detail: result.data 
        }));

        // Rafraîchir les statistiques après synchronisation
        try {
          const videosData = await getVideosFromSupabase();
          const total = videosData?.videos.length || 0;
          const syncStats = await getSyncStats();
          const lastSync = syncStats.length > 0 ? syncStats[0].last_sync_at : null;
          setOfficialVideosStats({ total, lastSync });
        } catch (statsError) {
          console.error('Erreur lors du rafraîchissement des stats:', statsError);
        }
      } else {
        setSyncMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation des vidéos officielles:', error);
      setSyncMessage('❌ Erreur lors de la synchronisation');
    } finally {
      setSyncing(prev => ({ ...prev, officialVideos: false }));
    }
  };

  // Fonction pour ajouter manuellement une vidéo YouTube
  const handleAddVideoManually = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualVideoForm.url.trim()) {
      setManualVideoForm(prev => ({ ...prev, message: '❌ Veuillez saisir une URL YouTube' }));
      return;
    }

    setManualVideoForm(prev => ({ ...prev, loading: true, message: '' }));

    try {
      const result = await addVideoManually(manualVideoForm.url.trim(), manualVideoForm.artist.trim() || undefined);
      
      if (result.success) {
        setManualVideoForm({ url: '', artist: '', loading: false, message: `✅ ${result.message}` });
        
        // Rafraîchir les statistiques
        try {
          const videosData = await getVideosFromSupabase();
          const total = videosData?.videos.length || 0;
          const syncStats = await getSyncStats();
          const lastSync = syncStats.length > 0 ? syncStats[0].last_sync_at : null;
          setOfficialVideosStats({ total, lastSync });
        } catch (statsError) {
          console.error('Erreur lors du rafraîchissement des stats:', statsError);
        }

        // Déclencher l'événement pour mettre à jour la page OFFICIAL avec les nouvelles données
        const updatedVideosData = await getVideosFromSupabase();
        window.dispatchEvent(new CustomEvent('officialVideosUpdated', { 
          detail: updatedVideosData 
        }));
      } else {
        setManualVideoForm(prev => ({ ...prev, loading: false, message: `❌ ${result.message}` }));
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout manuel:', error);
      setManualVideoForm(prev => ({ ...prev, loading: false, message: '❌ Erreur lors de l\'ajout de la vidéo' }));
    }
  };

  // Fonction pour rechercher des vidéos dans la bibliothèque OFFICIAL
  const handleSearchVideos = async (searchTerm: string = libraryManagement.searchTerm) => {
    setLibraryManagement(prev => ({ ...prev, loading: true, message: '' }));

    try {
      const videos = await searchVideosInSupabase(searchTerm);
      setLibraryManagement(prev => ({ 
        ...prev, 
        videos, 
        loading: false,
        message: `${videos.length} vidéo(s) trouvée(s)`
      }));
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setLibraryManagement(prev => ({ 
        ...prev, 
        loading: false, 
        videos: [],
        message: '❌ Erreur lors de la recherche'
      }));
    }
  };

  // Fonction pour ouvrir la modal de confirmation de suppression
  const handleDeleteVideoClick = (video: any) => {
    setLibraryManagement(prev => ({ 
      ...prev, 
      showDeleteModal: true, 
      videoToDelete: video 
    }));
  };

  // Fonction pour fermer la modal de suppression
  const handleCancelDelete = () => {
    setLibraryManagement(prev => ({ 
      ...prev, 
      showDeleteModal: false, 
      videoToDelete: null 
    }));
  };

  // Fonction pour confirmer et supprimer une vidéo
  const handleConfirmDelete = async () => {
    const video = libraryManagement.videoToDelete;
    if (!video) return;

    console.log('🔍 DEBUG - Vidéo à supprimer:', video);
    console.log('🔍 DEBUG - videoId à supprimer:', video.videoId);

    setLibraryManagement(prev => ({ ...prev, loading: true, message: '', showDeleteModal: false, videoToDelete: null }));

    try {
      const result = await deleteVideoFromSupabase(video.videoId);
      
      if (result.success) {
        console.log('🔄 Suppression réussie, rafraîchissement de l\'UI...');
        
        // 1. Rafraîchir la liste des vidéos dans l'admin (recherche à nouveau)
        await handleSearchVideos('');
        
        // 2. Rafraîchir les statistiques
        try {
          const videosData = await getVideosFromSupabase();
          const total = videosData?.videos.length || 0;
          const syncStats = await getSyncStats();
          const lastSync = syncStats.length > 0 ? syncStats[0].last_sync_at : null;
          setOfficialVideosStats({ total, lastSync });
          console.log(`📊 Stats mises à jour: ${total} vidéos`);
        } catch (statsError) {
          console.error('Erreur lors du rafraîchissement des stats:', statsError);
        }

        // 3. Déclencher l'événement pour mettre à jour la page OFFICIAL avec les nouvelles données
        const updatedVideosData = await getVideosFromSupabase();
        if (updatedVideosData) {
          window.dispatchEvent(new CustomEvent('officialVideosUpdated', { 
            detail: updatedVideosData 
          }));
          console.log(`🔄 Événement officialVideosUpdated déclenché avec ${updatedVideosData.videos.length} vidéos`);
        }

        setLibraryManagement(prev => ({ 
          ...prev, 
          loading: false,
          message: `✅ ${result.message}`
        }));
      } else {
        setLibraryManagement(prev => ({ 
          ...prev, 
          loading: false,
          message: `❌ ${result.message}`
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setLibraryManagement(prev => ({ 
        ...prev, 
        loading: false,
        message: '❌ Erreur lors de la suppression'
      }));
    }
  };

  // Charger les vidéos au changement de section
  useEffect(() => {
    if (activeSection === 'library-management' && libraryManagement.videos.length === 0) {
      handleSearchVideos('');
    }
  }, [activeSection]);

  const renderContent = () => {
    switch (activeSection) {
      case 'youtube-channels':
        return <YouTubeChannelsManager />;
      
      case 'library-management':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Gestion de la Bibliothèque OFFICIAL</h2>
              
              {/* Barre de recherche */}
              <div className="mb-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={libraryManagement.searchTerm}
                      onChange={(e) => setLibraryManagement(prev => ({ ...prev, searchTerm: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchVideos()}
                      placeholder="Rechercher par titre, artiste ou chaîne..."
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={libraryManagement.loading}
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                  <button
                    onClick={() => handleSearchVideos()}
                    disabled={libraryManagement.loading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    {libraryManagement.loading ? 'Recherche...' : 'Rechercher'}
                  </button>
                </div>
                
                {libraryManagement.message && (
                  <div className="mt-3 text-sm p-2 rounded bg-gray-50 border">
                    {libraryManagement.message}
                  </div>
                )}
              </div>

              {/* Liste des vidéos */}
              <div className="space-y-4">
                {libraryManagement.videos.length === 0 && !libraryManagement.loading ? (
                  <div className="text-center py-8 text-gray-500">
                    <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune vidéo trouvée. Utilisez la recherche pour explorer la bibliothèque.</p>
                  </div>
                ) : (
                  libraryManagement.videos.map((video) => (
                    <div key={video.videoId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* Miniature */}
                        <div className="flex-shrink-0">
                          <img
                            src={video.thumbnailUrl || '/placeholder-video.jpg'}
                            alt={video.title}
                            className="w-24 h-16 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-video.jpg';
                            }}
                          />
                        </div>
                        
                        {/* Informations */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{video.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Artiste:</strong> {video.artist}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Chaîne:</strong> {video.channelTitle}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Publié le: {new Date(video.publishedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex-shrink-0 flex gap-2">
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Voir sur YouTube"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteVideoClick(video)}
                            disabled={libraryManagement.loading}
                            className="p-2 text-red-600 hover:bg-red-100 disabled:text-gray-400 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination info */}
              {libraryManagement.videos.length >= 50 && (
                <div className="mt-6 text-center text-sm text-gray-500">
                  Affichage limité à 50 résultats. Utilisez la recherche pour affiner les résultats.
                </div>
              )}
            </div>
          </div>
        );
      
      case 'sync-management':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Gestion des Synchronisations</h2>
              
              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-blue-800">Top 30 Country</h3>
                    <Music className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="space-y-2 text-sm text-blue-700">
                    <p>Total: <span className="font-bold">{top30Stats.total}</span> entrées</p>
                    <p>Avec Apple Music: <span className="font-bold">{top30Stats.withAppleMusic}</span></p>
                    <p>Dernière MAJ: <span className="font-bold">
                      {top30LastUpdate ? (
                        <>
                          {formatLastUpdate(top30LastUpdate)} 
                          <span className="text-xs ml-1">(Auto 2x/sem)</span>
                        </>
                      ) : (
                        'Jamais'
                      )}
                    </span></p>
                    <p>Source: <span className="font-bold">Apify → Supabase</span></p>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-purple-800">Vidéos OFFICIAL</h3>
                    <Video className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="space-y-2 text-sm text-purple-700">
                    <p>Total: <span className="font-bold">{officialVideosStats.total}</span> vidéos</p>
                    <p>Synchronisation: <span className="font-bold">Incrémentale</span></p>
                    <p>Dernière MAJ: <span className="font-bold">
                      {officialVideosStats.lastSync ? (
                        <>
                          {formatLastUpdate(officialVideosStats.lastSync)}
                          <span className="text-xs ml-1">(Manuel)</span>
                        </>
                      ) : (
                        'Jamais'
                      )}
                    </span></p>
                    <p>Source: <span className="font-bold">YouTube RSS → Supabase</span></p>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-green-800">Système</h3>
                    <Trophy className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="space-y-2 text-sm text-green-700">
                    <p>Status: <span className="font-bold">Actif</span></p>
                    <p>Automatisation: <span className="font-bold">24/7</span></p>
                    <p>Dernière activité: <span className="font-bold">
                      'N/A'
                    </span></p>
                    <p>Mode: <span className="font-bold">Production</span></p>
                  </div>
                </div>
              </div>
              
              {/* Actions de synchronisation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Play className="w-6 h-6 text-red-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-800">Vidéos Officielles</h3>
                  </div>
                  <p className="text-gray-600 mb-4 text-sm">
                    Synchronise les vidéos officielles depuis YouTube (projet Videos CountryHUB).
                  </p>
                  <button
                    onClick={handleOfficialVideosSync}
                    disabled={syncing.officialVideos}
                    className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 mb-3"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${syncing.officialVideos ? 'animate-spin' : ''}`} />
                    {syncing.officialVideos ? 'Synchronisation...' : 'Synchroniser Vidéos'}
                  </button>
                  {syncMessage && (
                    <div className="text-xs p-2 rounded bg-gray-50 border">
                      {syncMessage}
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Music className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-800">Synchronisation Top30</h3>
                  </div>
                  <p className="text-gray-600 mb-4 text-sm">
                    Synchronise le Top 30 depuis Apify vers Supabase (économise les coûts).
                  </p>
                  <button
                    onClick={handleTop30Sync}
                    disabled={syncing.top30}
                    className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${syncing.top30 ? 'animate-spin' : ''}`} />
                    {syncing.top30 ? 'Synchronisation...' : 'Synchroniser le Top30'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    💰 Auto: 2x/semaine (Lundi & Jeudi) pour économiser
                  </p>
                </div>
              </div>

              {/* Ajout manuel de vidéos YouTube */}
              <div className="mt-8">
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <div className="flex items-center mb-4">
                    <Plus className="w-6 h-6 text-purple-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-800">Ajouter une Vidéo YouTube</h3>
                  </div>
                  <p className="text-gray-600 mb-4 text-sm">
                    Ajoutez manuellement une vidéo YouTube à la collection OFFICIAL en collant son URL.
                  </p>
                  
                  <form onSubmit={handleAddVideoManually} className="space-y-4">
                    <div>
                      <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-2">
                        URL YouTube *
                      </label>
                      <div className="relative">
                        <input
                          id="youtube-url"
                          type="url"
                          value={manualVideoForm.url}
                          onChange={(e) => setManualVideoForm(prev => ({ ...prev, url: e.target.value, message: '' }))}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          disabled={manualVideoForm.loading}
                        />
                        <ExternalLink className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="artist-name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nom de l'artiste (optionnel)
                      </label>
                      <input
                        id="artist-name"
                        type="text"
                        value={manualVideoForm.artist}
                        onChange={(e) => setManualVideoForm(prev => ({ ...prev, artist: e.target.value }))}
                        placeholder="Nom de l'artiste (détecté automatiquement si vide)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={manualVideoForm.loading}
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={manualVideoForm.loading || !manualVideoForm.url.trim()}
                      className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                      <Plus className={`w-4 h-4 mr-2 ${manualVideoForm.loading ? 'animate-pulse' : ''}`} />
                      {manualVideoForm.loading ? 'Ajout en cours...' : 'Ajouter à OFFICIAL'}
                    </button>
                    
                    {manualVideoForm.message && (
                      <div className="text-xs p-3 rounded-lg bg-gray-50 border">
                        {manualVideoForm.message}
                      </div>
                    )}
                  </form>
                </div>
              </div>
              
              {/* Informations sur l'automatisation */}
              <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">🤖 Automatisation via Cron Services</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• <strong>Vidéos</strong>: Synchronisation optimisée toutes les heures (6h-14h EST) - 50 chaînes/heure</p>
                  <p>• <strong>Top30</strong>: Synchronisation automatique 2x/semaine (Lundi & Jeudi à 9h EST) 💰</p>
                  <p>• <strong>Keep-Alive</strong>: Ping automatique toutes les 6h pour éviter la pause Supabase</p>
                  <p className="mt-2 text-xs">
                    <strong>Optimisation</strong>: Rotation intelligente des 400 chaînes sur 8h, quota API réduit de 80%
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Vue d'ensemble</h2>
              <p className="text-gray-600 mb-6">
                Bienvenue dans le panneau d'administration de CountryMusic-Hub.com
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveSection('sync-management')}
                  className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors duration-200"
                >
                  <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">Synchronisations</h3>
                    <p className="text-sm text-gray-600">Gérer les vidéos et le classement</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveSection('youtube-channels')}
                  className="flex items-center p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors duration-200"
                >
                  <Youtube className="w-8 h-8 text-red-600 mr-3" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">YouTube Channels</h3>
                    <p className="text-sm text-gray-600">Gérer les chaînes YouTube des artistes</p>
                  </div>
                </button>
                
              </div>
            </div>
          </div>
        );
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-800">Administration</h1>
            </div>
          </div>
          
          <nav className="px-6 py-2">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveSection('overview')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeSection === 'overview'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="mr-3 h-4 w-4" />
                Vue d'ensemble
              </button>
              
              <button
                onClick={() => setActiveSection('youtube-channels')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeSection === 'youtube-channels'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Youtube className="mr-3 h-4 w-4" />
                Chaînes YouTube
              </button>
              
              <button
                onClick={() => setActiveSection('sync-management')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeSection === 'sync-management'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <RefreshCw className="mr-3 h-4 w-4" />
                Gestion des Synchronisations
              </button>
              
              <button
                onClick={() => setActiveSection('library-management')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeSection === 'library-management'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Music className="mr-3 h-4 w-4" />
                Bibliothèque OFFICIAL
              </button>
            </nav>
          </nav>
        </div>

        {/* Contenu */}
        <div className="max-w-full">
          {renderContent()}
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {libraryManagement.showDeleteModal && libraryManagement.videoToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmer la suppression</h3>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Êtes-vous sûr de vouloir supprimer cette vidéo ?
              </p>
              <div className="bg-gray-50 p-3 rounded border">
                <p className="font-medium text-gray-900 truncate">
                  {libraryManagement.videoToDelete.title}
                </p>
                <p className="text-sm text-gray-600">
                  {libraryManagement.videoToDelete.artist}
                </p>
              </div>
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Cette action est irréversible. La vidéo sera ajoutée à la blacklist pour éviter sa réapparition automatique.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                disabled={libraryManagement.loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={libraryManagement.loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
              >
                {libraryManagement.loading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;