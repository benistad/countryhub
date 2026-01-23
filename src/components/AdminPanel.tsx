import React, { useState, useEffect } from 'react';
import { Youtube, Trophy, RefreshCw, BarChart3, Music, Video, Clock, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { YouTubeChannelsManager } from './YouTubeChannelsManager';
import { useTop30 } from '../hooks/useTop30';
import { useSyncHistory, SyncHistoryEntry, SyncStats } from '../hooks/useSyncHistory';
import { useCountryNews } from '../hooks/useCountryNews';
import { useCountryVideos } from '../hooks/useCountryVideos';

const AdminPanel: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'sync-history' | 'youtube-channels'>('dashboard');
  const [syncing, setSyncing] = useState({ top30: false, news: false, countryVideos: false });
  const [realStats, setRealStats] = useState<{
    top30: SyncStats;
    news: SyncStats;
    country_videos: SyncStats;
  }>({
    top30: { lastSync: null, lastType: null, itemCount: 0, lastStatus: null },
    news: { lastSync: null, lastType: null, itemCount: 0, lastStatus: null },
    country_videos: { lastSync: null, lastType: null, itemCount: 0, lastStatus: null }
  });
  
  const { syncFromApify, getStats: getTop30Stats } = useTop30();
  const { syncNews } = useCountryNews();
  const { syncVideos: syncCountryVideos, videos } = useCountryVideos();
  const { 
    history, 
    loading: historyLoading, 
    getRealSyncStats,
    createSyncEntry, 
    updateSyncEntry,
    loadHistory 
  } = useSyncHistory();

  const top30Stats = getTop30Stats();

  // Charger les vraies statistiques depuis les tables de données
  const loadRealStats = async () => {
    const [top30, news, countryVideos] = await Promise.all([
      getRealSyncStats('top30'),
      getRealSyncStats('news'),
      getRealSyncStats('country_videos')
    ]);
    setRealStats({
      top30,
      news,
      country_videos: countryVideos
    });
  };

  useEffect(() => {
    loadRealStats();
  }, []);

  // Recharger les stats après une sync
  const refreshStats = async () => {
    await loadRealStats();
  };

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

  const handleNewsSync = async () => {
    setSyncing(prev => ({ ...prev, news: true }));

    // Créer une entrée d'historique
    const syncId = await createSyncEntry('news', 'manual', {
      triggered_by: 'admin_panel'
    });

    try {
      const result = await syncNews();
      if (syncId) {
        await updateSyncEntry(syncId, {
          status: result.success ? 'success' : 'error',
          successMessage: result.success ? result.message : undefined,
          errorMessage: !result.success ? result.message : undefined
        });
      }
      await refreshStats();
    } catch (error: any) {
      if (syncId) {
        await updateSyncEntry(syncId, {
          status: 'error',
          errorMessage: error.message || 'Erreur inconnue'
        });
      }
    } finally {
      setSyncing(prev => ({ ...prev, news: false }));
    }
  };

  const handleTop30Sync = async () => {
    setSyncing(prev => ({ ...prev, top30: true }));
    
    // Créer une entrée d'historique
    const syncId = await createSyncEntry('top30', 'manual', {
      triggered_by: 'admin_panel'
    });
    
    try {
      const result = await syncFromApify();
      
      if (syncId) {
        await updateSyncEntry(syncId, {
          status: result.success ? 'success' : 'error',
          itemsProcessed: top30Stats.total || 0,
          successMessage: result.success ? result.message : undefined,
          errorMessage: !result.success ? result.message : undefined
        });
      }
      await refreshStats();
    } catch (error: any) {
      if (syncId) {
        await updateSyncEntry(syncId, {
          status: 'error',
          errorMessage: error.message || 'Erreur inconnue'
        });
      }
    } finally {
      setSyncing(prev => ({ ...prev, top30: false }));
    }
  };

  const handleCountryVideosSync = async () => {
    setSyncing(prev => ({ ...prev, countryVideos: true }));

    // Créer une entrée d'historique
    const syncId = await createSyncEntry('country_videos', 'manual', {
      triggered_by: 'admin_panel'
    });

    try {
      await syncCountryVideos();
      if (syncId) {
        await updateSyncEntry(syncId, {
          status: 'success',
          itemsProcessed: videos.length || 0,
          successMessage: `${videos.length} vidéos synchronisées`
        });
      }
      await refreshStats();
    } catch (error: any) {
      if (syncId) {
        await updateSyncEntry(syncId, {
          status: 'error',
          errorMessage: error.message || 'Erreur inconnue'
        });
      }
    } finally {
      setSyncing(prev => ({ ...prev, countryVideos: false }));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'top30': return <Trophy className="w-4 h-4" />;
      case 'auto_top30': return <Trophy className="w-4 h-4" />;
      case 'news': return <Music className="w-4 h-4" />;
      case 'official-videos': return <Video className="w-4 h-4" />;
      case 'country_videos': return <Video className="w-4 h-4" />;
      case 'auto_country_videos': return <Video className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'partial': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'top30': return 'Top 30';
      case 'auto_top30': return 'Top 30 (Auto)';
      case 'news': return 'News';
      case 'official-videos': return 'Vidéos Officielles';
      case 'country_videos': return 'Vidéos Country';
      case 'auto_country_videos': return 'Vidéos Country (Auto)';
      default: return type;
    }
  };

  const renderSyncCard = (
    title: string,
    icon: React.ReactNode,
    stats: any,
    onSync: () => void,
    isSyncing: boolean,
    syncButtonText: string,
    syncButtonColor: string
  ) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <span className="text-2xl font-bold text-gray-900">{stats.itemCount}</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Dernière sync:</span>
          <span className="text-gray-900">
            {stats.lastSync ? formatLastUpdate(stats.lastSync) : 'Jamais'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Type:</span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            stats.lastType === 'manual' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {stats.lastType === 'manual' ? 'Manuel' : 'Auto'}
          </span>
        </div>
        {stats.lastStatus && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Statut:</span>
            <div className="flex items-center space-x-1">
              {getStatusIcon(stats.lastStatus)}
              <span className="text-gray-900 capitalize">{stats.lastStatus}</span>
            </div>
          </div>
        )}
      </div>
      <button
        onClick={onSync}
        disabled={isSyncing}
        className={`w-full mt-4 ${syncButtonColor} text-white px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
      >
        {isSyncing ? (
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4 mr-2" />
        )}
        {syncButtonText}
      </button>
    </div>
  );

  const renderHistoryItem = (item: SyncHistoryEntry) => (
    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {getTypeIcon(item.sync_type)}
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-medium">{getTypeLabel(item.sync_type)}</h3>
              {getStatusIcon(item.status)}
              <span className={`px-2 py-1 rounded-full text-xs ${
                item.sync_trigger === 'manual' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {item.sync_trigger === 'manual' ? 'Manuel' : 'Automatique'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {formatLastUpdate(item.started_at)}
            </p>
          </div>
        </div>
        <div className="text-right text-sm text-gray-500">
          {item.duration_seconds && <p>{item.duration_seconds.toFixed(1)}s</p>}
        </div>
      </div>
      
      {/* Statistiques détaillées */}
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {item.items_scanned > 0 && (
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-semibold text-gray-900">{item.items_scanned}</div>
            <div className="text-gray-600">Scannés</div>
          </div>
        )}
        {item.items_found > 0 && (
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="font-semibold text-blue-900">{item.items_found}</div>
            <div className="text-blue-600">Trouvés</div>
          </div>
        )}
        {item.items_processed > 0 && (
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="font-semibold text-green-900">{item.items_processed}</div>
            <div className="text-green-600">Traités</div>
          </div>
        )}
        {item.items_inserted > 0 && (
          <div className="text-center p-2 bg-purple-50 rounded">
            <div className="font-semibold text-purple-900">{item.items_inserted}</div>
            <div className="text-purple-600">Insérés</div>
          </div>
        )}
      </div>
      
      {/* Messages */}
      {item.success_message && (
        <div className="mt-2 text-sm text-green-700 bg-green-50 rounded p-2">
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-4 h-4" />
            <span>{item.success_message}</span>
          </div>
        </div>
      )}
      
      {item.error_message && (
        <div className="mt-2 text-sm text-red-700 bg-red-50 rounded p-2">
          <div className="flex items-center space-x-1">
            <XCircle className="w-4 h-4" />
            <span>{item.error_message}</span>
          </div>
        </div>
      )}
      
      {item.warnings && item.warnings.length > 0 && (
        <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 rounded p-2">
          <div className="flex items-center space-x-1 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Avertissements:</span>
          </div>
          <ul className="list-disc list-inside">
            {item.warnings.map((warning: string, index: number) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Logs détaillés */}
      {item.detailed_logs && (
        <div className="mt-2">
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
              <Info className="w-4 h-4 inline mr-1" />
              Logs détaillés
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
              {JSON.stringify(item.detailed_logs, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration</h1>
          <p className="text-gray-600">Gestion et synchronisation des données Country Music Hub</p>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { key: 'sync-history', label: 'Historique', icon: Clock },
              { key: 'youtube-channels', label: 'Chaînes YouTube', icon: Youtube }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key as any)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Section */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderSyncCard(
                'Top 30',
                <Trophy className="w-5 h-5 text-yellow-500 mr-2" />,
                realStats.top30,
                handleTop30Sync,
                syncing.top30,
                'Synchroniser',
                'bg-blue-600'
              )}

              {renderSyncCard(
                'News',
                <Music className="w-5 h-5 text-purple-500 mr-2" />,
                realStats.news,
                handleNewsSync,
                syncing.news,
                'Synchroniser',
                'bg-purple-600'
              )}

              {renderSyncCard(
                'Vidéos Country',
                <Video className="w-5 h-5 text-red-500 mr-2" />,
                realStats.country_videos,
                handleCountryVideosSync,
                syncing.countryVideos,
                'Synchroniser',
                'bg-red-600'
              )}
            </div>
          </div>
        )}

        {/* Sync History Section */}
        {activeSection === 'sync-history' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Historique des Synchronisations</h2>
                  <p className="text-gray-600 mt-1">Détails complets des synchronisations effectuées</p>
                </div>
                <button
                  onClick={() => loadHistory()}
                  disabled={historyLoading}
                  className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${historyLoading ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
              </div>
            </div>
            <div className="p-6">
              {historyLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin" />
                  <p className="text-gray-500">Chargement de l'historique...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun historique de synchronisation disponible</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map(renderHistoryItem)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* YouTube Channels Section */}
        {activeSection === 'youtube-channels' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Gestion des Chaînes YouTube</h2>
              <p className="text-gray-600 mt-1">Configuration des chaînes pour la synchronisation automatique</p>
            </div>
            <div className="p-6">
              <YouTubeChannelsManager />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
