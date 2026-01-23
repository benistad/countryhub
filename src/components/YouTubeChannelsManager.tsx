import React, { useState } from 'react';
import { Plus, Edit, Trash2, Youtube, CheckCircle, XCircle, Search, Loader } from 'lucide-react';
import { useYouTubeChannels } from '../hooks/useYouTubeChannels';
import { YouTubeChannel } from '../lib/supabase';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Composant pour gérer les chaînes YouTube
 * 
 * Fonctionnalités:
 * - Affichage de toutes les chaînes avec filtres
 * - Ajout de nouvelles chaînes
 * - Modification des chaînes existantes
 * - Suppression des chaînes
 * - Statistiques en temps réel
 */
export function YouTubeChannelsManager() {
  const { channels, loading, error, addChannel, updateChannel, deleteChannel, getStats } = useYouTubeChannels();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkAddForm, setShowBulkAddForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState<YouTubeChannel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingYouTubeData, setIsLoadingYouTubeData] = useState(false);
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkResults, setBulkResults] = useState<Array<{url: string, success: boolean, artist?: string, channelId?: string, error?: string}>>([]);

  // Formulaire pour ajouter/modifier une chaîne
  const [formData, setFormData] = useState({
    artist: '',
    youtube_url: '',
    channel_id: ''
  });

  const stats = getStats();

  /**
   * Extrait le Channel ID depuis une URL YouTube
   */
  const extractChannelIdFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      
      // Format: youtube.com/channel/UCxxxxx
      if (urlObj.pathname.startsWith('/channel/')) {
        return urlObj.pathname.replace('/channel/', '');
      }
      
      // Format: youtube.com/@username
      if (urlObj.pathname.startsWith('/@')) {
        return urlObj.pathname.replace('/@', '');
      }
      
      // Format: youtube.com/c/username
      if (urlObj.pathname.startsWith('/c/')) {
        return urlObj.pathname.replace('/c/', '');
      }
      
      // Format: youtube.com/user/username
      if (urlObj.pathname.startsWith('/user/')) {
        return urlObj.pathname.replace('/user/', '');
      }
      
      return null;
    } catch {
      return null;
    }
  };

  /**
   * Récupère les informations de la chaîne YouTube via l'API
   */
  const fetchYouTubeChannelInfo = async (url: string) => {
    if (!url.trim()) return;
    
    setIsLoadingYouTubeData(true);
    
    try {
      console.log('🔍 Récupération des infos YouTube pour:', url);
      
      // Appeler notre Edge Function qui utilise l'API YouTube
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-youtube-channel-info`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      if (result.success && result.channelInfo) {
        console.log('✅ Infos récupérées:', result.channelInfo);
        
        // Mettre à jour le formulaire avec les données récupérées
        setFormData(prev => ({
          ...prev,
          artist: result.channelInfo.title || prev.artist,
          channel_id: result.channelInfo.channelId || prev.channel_id,
          youtube_url: url // Garder l'URL originale
        }));
        
        alert(`✅ Informations récupérées:\n- Artiste: ${result.channelInfo.title}\n- Channel ID: ${result.channelInfo.channelId}`);
      } else {
        throw new Error(result.message || 'Impossible de récupérer les informations');
      }
      
    } catch (error) {
      console.error('❌ Erreur récupération YouTube:', error);
      alert(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoadingYouTubeData(false);
    }
  };

  /**
   * Traite plusieurs URLs en lot
   */
  const processBulkUrls = async () => {
    if (!bulkUrls.trim()) {
      alert('Veuillez coller au moins une URL YouTube');
      return;
    }

    setBulkProcessing(true);
    setBulkResults([]);

    // Séparer les URLs (par ligne ou par espace)
    const urls = bulkUrls
      .split(/[\n\r\s,]+/)
      .map(url => url.trim())
      .filter(url => url && url.includes('youtube.com'));

    if (urls.length === 0) {
      alert('Aucune URL YouTube valide trouvée');
      setBulkProcessing(false);
      return;
    }

    console.log(`🔄 Traitement de ${urls.length} URLs...`);

    const results = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`📺 Traitement ${i + 1}/${urls.length}: ${url}`);

      try {
        // Récupérer les infos YouTube
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-youtube-channel-info`;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url })
        });

        const result = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.error || `HTTP ${response.status}`);
        }

        const channelInfo = result.channelInfo;
        
        results.push({
          url,
          success: true,
          artist: channelInfo.title,
          channelId: channelInfo.channelId
        });

        console.log(`✅ ${channelInfo.title} - ${channelInfo.channelId}`);

        // Petite pause pour éviter de surcharger l'API
        if (i < urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        console.error(`❌ Erreur pour ${url}:`, error);
        results.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    setBulkResults(results);
    setBulkProcessing(false);

    const successCount = results.filter(r => r.success).length;
    console.log(`🎯 Résultats: ${successCount}/${urls.length} chaînes trouvées`);
  };

  /**
   * Ajoute toutes les chaînes trouvées avec succès
   */
  const addAllFoundChannels = async () => {
    const successfulResults = bulkResults.filter(r => r.success);
    
    if (successfulResults.length === 0) {
      alert('Aucune chaîne à ajouter');
      return;
    }

    let addedCount = 0;
    let errorCount = 0;

    for (const result of successfulResults) {
      try {
        const addResult = await addChannel({
          artist: result.artist!,
          youtube_url: result.url,
          channel_id: result.channelId!
        });

        if (addResult.success) {
          addedCount++;
        } else {
          errorCount++;
          console.warn(`⚠️ Erreur ajout ${result.artist}:`, addResult.message);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Erreur ajout ${result.artist}:`, error);
      }
    }

    alert(`✅ ${addedCount} chaînes ajoutées avec succès${errorCount > 0 ? ` (${errorCount} erreurs)` : ''}`);
    
    if (addedCount > 0) {
      // Réinitialiser le formulaire
      setBulkUrls('');
      setBulkResults([]);
      setShowBulkAddForm(false);
    }
  };

  // Filtrer les chaînes selon la recherche
  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         channel.channel_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.artist || !formData.youtube_url || !formData.channel_id) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    let result;
    if (editingChannel) {
      result = await updateChannel(editingChannel.id, formData);
    } else {
      result = await addChannel(formData);
    }

    if (result.success) {
      setFormData({ artist: '', youtube_url: '', channel_id: '' });
      setShowAddForm(false);
      setEditingChannel(null);
    }

    alert(result.message);
  };

  const handleEdit = (channel: YouTubeChannel) => {
    setFormData({
      artist: channel.artist,
      youtube_url: channel.youtube_url,
      channel_id: channel.channel_id
    });
    setEditingChannel(channel);
    setShowAddForm(true);
  };

  const handleDelete = async (channel: YouTubeChannel) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la chaîne "${channel.artist}" ?`)) {
      const result = await deleteChannel(channel.id);
      alert(result.message);
    }
  };

  const cancelForm = () => {
    setFormData({ artist: '', youtube_url: '', channel_id: '' });
    setShowAddForm(false);
    setEditingChannel(null);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <LoadingSpinner />
        <p className="text-center text-gray-600 mt-4">Loading YouTube channels...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* En-tête avec statistiques */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Youtube className="w-8 h-8 text-red-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">YouTube Channels</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBulkAddForm(true)}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add channels
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add channel
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Youtube className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Recherche */}
        <div className="mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by artist or Channel ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>
      </header>

      {/* Formulaire d'ajout/modification */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {editingChannel ? 'Edit channel' : 'Add new channel'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Artist *
                </label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Artist name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel ID *
                </label>
                <input
                  type="text"
                  value={formData.channel_id}
                  onChange={(e) => setFormData({ ...formData, channel_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="UCxxxxxxxxxxxxxxxxxx"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL YouTube *
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="https://www.youtube.com/@ArtistName"
                  required
                />
                <button
                  type="button"
                  onClick={() => fetchYouTubeChannelInfo(formData.youtube_url)}
                  disabled={!formData.youtube_url || isLoadingYouTubeData}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center"
                >
                  {isLoadingYouTubeData ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Youtube className="w-4 h-4 mr-1" />
                      Auto
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Click "Auto" to automatically fetch the channel name and ID
              </p>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                {editingChannel ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Formulaire d'ajout en lot */}
      {showBulkAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Add multiple YouTube channels
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                YouTube URLs (one per line)
              </label>
              <textarea
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={8}
                placeholder={`Paste your YouTube URLs here, one per line:

https://www.youtube.com/@ArtistName1
https://www.youtube.com/@ArtistName2
https://www.youtube.com/channel/UCxxxxxxxxx
https://www.youtube.com/c/ArtistName3`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Formats supportés: @username, /channel/UCxxxx, /c/username, /user/username
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={processBulkUrls}
                disabled={bulkProcessing || !bulkUrls.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
              >
                {bulkProcessing ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Analyze URLs
                  </>
                )}
              </button>
              
              {bulkResults.length > 0 && bulkResults.some(r => r.success) && (
                <button
                  onClick={addAllFoundChannels}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add all ({bulkResults.filter(r => r.success).length})
                </button>
              )}
              
              <button
                onClick={() => {
                  setShowBulkAddForm(false);
                  setBulkUrls('');
                  setBulkResults([]);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Résultats de l'analyse */}
          {bulkResults.length > 0 && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Analysis results ({bulkResults.filter(r => r.success).length}/{bulkResults.length} found)
              </h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {bulkResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        {result.success ? (
                          <div>
                            <p className="font-medium text-green-800 truncate">
                              {result.artist}
                            </p>
                            <p className="text-sm text-green-600 font-mono truncate">
                              {result.channelId}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-red-800 truncate">
                              {result.url}
                            </p>
                            <p className="text-sm text-red-600">
                              {result.error}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Liste des chaînes */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            YouTube Channels ({filteredChannels.length})
          </h2>
        </div>
        
        {filteredChannels.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 
              'No channel matches the search' : 
              'No YouTube channels registered'
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Artist
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredChannels.map((channel) => (
                  <tr key={channel.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Youtube className="w-5 h-5 text-red-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {channel.artist}
                          </div>
                          <div className="text-sm text-gray-500">
                            <a 
                              href={channel.youtube_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-red-600"
                            >
                              View channel
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {channel.channel_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(channel)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(channel)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}