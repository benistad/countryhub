import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Video, VideosData } from './useOfficialVideos';

interface SyncMetadata {
  id?: string;
  last_sync_at: string;
  cutoff_date: string;
  total_channels: number;
  total_videos: number;
  success_count: number;
  error_count: number;
  success_rate: number;
  created_at?: string;
}

export const useSupabaseOfficialVideos = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour récupérer la date de dernière synchronisation
  const getLastSyncDate = useCallback(async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('official_videos_sync_metadata')
        .select('last_sync_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Erreur lors de la récupération de la dernière sync:', error);
        return null;
      }

      const lastSyncDate = data?.[0]?.last_sync_at;
      if (lastSyncDate) {
        console.log(`📅 Dernière synchronisation: ${new Date(lastSyncDate).toLocaleString('fr-FR')}`);
        return lastSyncDate;
      }

      console.log('📅 Aucune synchronisation précédente trouvée');
      return null;
    } catch (err) {
      console.error('Erreur lors de la récupération de la date de sync:', err);
      return null;
    }
  }, []);

  // Fonction pour sauvegarder les vidéos dans Supabase (synchronisation incrémentale)
  const saveVideosToSupabase = useCallback(async (videosData: VideosData, successCount: number, errorCount: number): Promise<boolean> => {
    try {
      console.log('💾 Synchronisation incrémentale avec Supabase...');
      
      if (videosData.videos.length === 0) {
        console.log('Aucune vidéo à synchroniser');
        return true;
      }

      // 1. Récupérer les video_id existants dans la base
      const { data: existingVideos, error: fetchError } = await supabase
        .from('official_videos')
        .select('video_id');

      if (fetchError) {
        console.error('Erreur lors de la récupération des vidéos existantes:', fetchError);
        return false;
      }

      const existingVideoIds = new Set(existingVideos?.map(v => v.video_id) || []);
      console.log(`📊 ${existingVideoIds.size} vidéos déjà en base`);

      // 2. Filtrer pour ne garder que les nouvelles vidéos
      const newVideos = videosData.videos.filter(video => !existingVideoIds.has(video.videoId));
      console.log(`🆕 ${newVideos.length} nouvelles vidéos à ajouter`);

      // 3. Insérer uniquement les nouvelles vidéos
      let insertedCount = 0;
      if (newVideos.length > 0) {
        const videosToInsert = newVideos.map(video => ({
          video_id: video.videoId,
          title: video.title,
          channel_title: video.channelTitle,
          artist: video.artist,
          published_at: video.publishedAt,
          thumbnail_url: video.thumbnailUrl,
          url: video.url
        }));

        const { error: insertError } = await supabase
          .from('official_videos')
          .insert(videosToInsert);

        if (insertError) {
          console.error('Erreur lors de l\'insertion des nouvelles vidéos:', insertError);
          return false;
        }
        
        insertedCount = newVideos.length;
        console.log(`✅ ${insertedCount} nouvelles vidéos ajoutées à Supabase`);
      } else {
        console.log('✅ Aucune nouvelle vidéo à ajouter (toutes déjà présentes)');
      }

      // 4. Optionnel : Mettre à jour les vidéos existantes si nécessaire
      const videosToUpdate = videosData.videos.filter(video => existingVideoIds.has(video.videoId));
      if (videosToUpdate.length > 0) {
        console.log(`🔄 ${videosToUpdate.length} vidéos existantes pourraient être mises à jour`);
        // Pour l'instant, on ne met pas à jour les vidéos existantes
        // Mais on pourrait ajouter cette logique si nécessaire
      }

      // 5. Sauvegarder les métadonnées de synchronisation
      const successRate = videosData.totalChannels > 0 ? (successCount / videosData.totalChannels) * 100 : 0;
      
      const syncMetadata: Omit<SyncMetadata, 'id' | 'created_at'> = {
        last_sync_at: videosData.lastSyncAt,
        cutoff_date: videosData.cutoffDate,
        total_channels: videosData.totalChannels,
        total_videos: insertedCount, // Nombre de nouvelles vidéos ajoutées
        success_count: successCount,
        error_count: errorCount,
        success_rate: Math.round(successRate * 100) / 100 // Arrondir à 2 décimales
      };

      const { error: metadataError } = await supabase
        .from('official_videos_sync_metadata')
        .insert(syncMetadata);

      if (metadataError) {
        console.error('Erreur lors de la sauvegarde des métadonnées:', metadataError);
        return false;
      }

      console.log(`✅ Synchronisation incrémentale terminée: ${insertedCount} nouvelles vidéos ajoutées (${existingVideoIds.size} déjà présentes)`);
      return true;

    } catch (err) {
      console.error('Erreur lors de la sauvegarde Supabase:', err);
      return false;
    }
  }, []);

  // Fonction pour récupérer les vidéos depuis Supabase
  const getVideosFromSupabase = useCallback(async (): Promise<VideosData | null> => {
    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer les vidéos
      const { data: videos, error: videosError } = await supabase
        .from('official_videos')
        .select('*')
        .order('published_at', { ascending: false });

      if (videosError) {
        throw new Error(`Erreur lors de la récupération des vidéos: ${videosError.message}`);
      }

      // 2. Récupérer les dernières métadonnées de synchronisation
      const { data: metadata, error: metadataError } = await supabase
        .from('official_videos_sync_metadata')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (metadataError) {
        console.warn('Erreur lors de la récupération des métadonnées:', metadataError);
      }

      const latestMetadata = metadata?.[0];

      // 3. Transformer les données au format attendu
      const transformedVideos: Video[] = (videos || []).map(video => ({
        videoId: video.video_id,
        title: video.title,
        channelTitle: video.channel_title || '',
        artist: video.artist || '',
        publishedAt: video.published_at,
        thumbnailUrl: video.thumbnail_url || '',
        url: video.url
      }));

      const videosData: VideosData = {
        lastSyncAt: latestMetadata?.last_sync_at || new Date().toISOString(),
        cutoffDate: latestMetadata?.cutoff_date || '2025-08-01T00:00:00Z',
        totalChannels: latestMetadata?.total_channels || 0,
        totalVideos: transformedVideos.length,
        videos: transformedVideos
      };

      console.log(`📥 ${transformedVideos.length} vidéos récupérées depuis Supabase`);
      return videosData;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur lors de la récupération depuis Supabase:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction pour obtenir les statistiques de synchronisation
  const getSyncStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('official_videos_sync_metadata')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Erreur lors de la récupération des stats:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques:', err);
      return [];
    }
  }, []);

  // Fonction pour nettoyer les anciennes données (optionnel)
  const cleanupOldData = useCallback(async (daysToKeep: number = 30) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Nettoyer les anciennes métadonnées
      const { error } = await supabase
        .from('official_videos_sync_metadata')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Erreur lors du nettoyage:', error);
        return false;
      }

      console.log(`🧹 Nettoyage des données de plus de ${daysToKeep} jours effectué`);
      return true;
    } catch (err) {
      console.error('Erreur lors du nettoyage:', err);
      return false;
    }
  }, []);

  // Fonction pour extraire l'ID vidéo depuis une URL YouTube
  const extractVideoIdFromUrl = useCallback((url: string): string | null => {
    try {
      // Patterns d'URL YouTube supportés
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Fonction pour récupérer les métadonnées d'une vidéo YouTube via oEmbed
  const fetchVideoMetadata = useCallback(async (videoId: string) => {
    try {
      // Utiliser l'API oEmbed de YouTube (pas de clé API requise)
      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      
      const response = await fetch(oEmbedUrl);
      if (!response.ok) {
        throw new Error('Vidéo non trouvée ou privée');
      }

      const data = await response.json();
      
      return {
        title: data.title,
        channelTitle: data.author_name,
        thumbnailUrl: data.thumbnail_url
      };
    } catch (err) {
      console.error('Erreur lors de la récupération des métadonnées:', err);
      throw new Error('Impossible de récupérer les informations de la vidéo');
    }
  }, []);

  // Fonction pour ajouter manuellement une vidéo YouTube à OFFICIAL
  const addVideoManually = useCallback(async (url: string, artistName?: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      // 1. Extraire l'ID vidéo depuis l'URL
      const videoId = extractVideoIdFromUrl(url);
      if (!videoId) {
        throw new Error('URL YouTube invalide');
      }

      // 2. Vérifier si la vidéo existe déjà
      const { data: existingVideo, error: checkError } = await supabase
        .from('official_videos')
        .select('video_id')
        .eq('video_id', videoId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw new Error('Erreur lors de la vérification des doublons');
      }

      if (existingVideo) {
        return {
          success: false,
          message: 'Cette vidéo est déjà présente dans la collection OFFICIAL'
        };
      }

      // 3. Récupérer les métadonnées de la vidéo
      const metadata = await fetchVideoMetadata(videoId);

      // 4. Préparer les données de la vidéo
      const videoData = {
        video_id: videoId,
        title: metadata.title,
        channel_title: metadata.channelTitle,
        artist: artistName || metadata.channelTitle,
        published_at: new Date().toISOString(), // Date actuelle par défaut
        thumbnail_url: metadata.thumbnailUrl,
        url: `https://www.youtube.com/watch?v=${videoId}`
      };

      // 5. Insérer la vidéo dans Supabase
      const { error: insertError } = await supabase
        .from('official_videos')
        .insert(videoData);

      if (insertError) {
        throw new Error('Erreur lors de la sauvegarde en base');
      }

      console.log(`✅ Vidéo ajoutée manuellement: ${metadata.title}`);
      
      return {
        success: true,
        message: `Vidéo "${metadata.title}" ajoutée avec succès à OFFICIAL`
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur lors de l\'ajout manuel:', err);
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [extractVideoIdFromUrl, fetchVideoMetadata]);

  // Fonction pour supprimer une vidéo de la base OFFICIAL
  const deleteVideoFromSupabase = useCallback(async (videoId: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log(`🔍 DEBUG - Début de la suppression de la vidéo: "${videoId}"`);
      console.log(`🔍 DEBUG - Type de videoId:`, typeof videoId);
      console.log(`🔍 DEBUG - Longueur de videoId:`, videoId?.length);
      setLoading(true);
      setError(null);

      // Vérifier que la vidéo existe
      console.log(`🔍 Vérification de l'existence de la vidéo dans Supabase...`);
      const { data: existingVideo, error: checkError } = await supabase
        .from('official_videos')
        .select('title, artist, video_id')
        .eq('video_id', videoId)
        .single();

      if (checkError) {
        console.error('❌ Erreur lors de la vérification:', checkError);
        if (checkError.code === 'PGRST116') { // No rows found
          return {
            success: false,
            message: 'Vidéo non trouvée dans la base de données'
          };
        }
        throw new Error(`Erreur lors de la vérification de la vidéo: ${checkError.message}`);
      }

      console.log(`✅ Vidéo trouvée: ${existingVideo.title}`);

      // Essayer d'ajouter la vidéo à la blacklist AVANT de la supprimer (optionnel)
      console.log(`🔍 Tentative d'ajout à la blacklist...`);
      try {
        const { error: blacklistError } = await supabase
          .from('official_videos_blacklist')
          .insert({
            video_id: videoId,
            title: existingVideo.title,
            artist: existingVideo.artist,
            reason: 'Suppression manuelle par admin',
            deleted_by: 'admin'
          });

        if (blacklistError) {
          console.error('⚠️ Erreur lors de l\'ajout à la blacklist:', blacklistError);
          // Si la table n'existe pas, on continue quand même la suppression
          if (blacklistError.code === '42P01') { // Table doesn't exist
            console.warn('⚠️ Table blacklist non trouvée, suppression sans blacklist');
          } else if (blacklistError.code !== '23505') { // 23505 = unique constraint violation
            console.warn('⚠️ Erreur blacklist non critique, continuation de la suppression');
          }
        } else {
          console.log(`✅ Vidéo ajoutée à la blacklist`);
        }
      } catch (blacklistErr) {
        console.warn('⚠️ Erreur lors de l\'ajout à la blacklist, continuation de la suppression:', blacklistErr);
      }

      // Supprimer la vidéo
      console.log(`🔍 Suppression de la vidéo de la table principale...`);
      const { error: deleteError } = await supabase
        .from('official_videos')
        .delete()
        .eq('video_id', videoId);

      if (deleteError) {
        console.error('❌ Erreur lors de la suppression:', deleteError);
        throw new Error(`Erreur lors de la suppression: ${deleteError.message}`);
      }

      console.log(`✅ Vidéo supprimée avec succès: ${existingVideo.title} (${existingVideo.artist})`);
      
      return {
        success: true,
        message: `Vidéo "${existingVideo.title}" supprimée avec succès`
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('❌ Erreur complète lors de la suppression:', err);
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction pour rechercher des vidéos dans la base OFFICIAL
  const searchVideosInSupabase = useCallback(async (searchTerm: string): Promise<Video[]> => {
    try {
      if (!searchTerm.trim()) {
        // Si pas de terme de recherche, retourner toutes les vidéos (limitées)
        const videosData = await getVideosFromSupabase();
        return videosData?.videos.slice(0, 50) || [];
      }

      const { data: videos, error } = await supabase
        .from('official_videos')
        .select('*')
        .or(`title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%,channel_title.ilike.%${searchTerm}%`)
        .order('published_at', { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(`Erreur lors de la recherche: ${error.message}`);
      }

      // Transformer les données au format attendu
      const transformedVideos: Video[] = (videos || []).map(video => ({
        videoId: video.video_id,
        title: video.title,
        channelTitle: video.channel_title || '',
        artist: video.artist || '',
        publishedAt: video.published_at,
        thumbnailUrl: video.thumbnail_url || '',
        url: video.url
      }));

      return transformedVideos;

    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      setError(err instanceof Error ? err.message : 'Erreur de recherche');
      return [];
    }
  }, [getVideosFromSupabase]);

  return {
    loading,
    error,
    saveVideosToSupabase,
    getVideosFromSupabase,
    getSyncStats,
    cleanupOldData,
    getLastSyncDate,
    addVideoManually,
    deleteVideoFromSupabase,
    searchVideosInSupabase
  };
};
