import { useState, useEffect } from 'react';
import { supabase, YouTubeChannel } from '../lib/supabase';

/**
 * Hook personnalisé pour gérer les chaînes YouTube
 * 
 * Fonctionnalités:
 * - Récupération des chaînes depuis Supabase
 * - Filtrage par statut (officiel/non officiel)
 * - Gestion des états de chargement et d'erreur
 * - Fonctions CRUD pour gérer les chaînes
 */
export function useYouTubeChannels() {
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChannels();
  }, []);

  /**
   * Récupère toutes les chaînes YouTube depuis Supabase
   */
  const fetchChannels = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📺 Récupération des chaînes YouTube depuis Supabase...');

      const { data, error } = await supabase
        .from('youtube_channels')
        .select('*')
        .order('artist', { ascending: true });

      if (error) {
        throw new Error(`Erreur Supabase: ${error.message}`);
      }

      console.log(`✅ ${data?.length || 0} chaînes récupérées`);
      setChannels(data || []);
    } catch (err) {
      console.error('❌ Erreur lors de la récupération des chaînes:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ajoute une nouvelle chaîne YouTube
   */
  const addChannel = async (channelData: { artist: string; youtube_url: string; channel_id: string }): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('➕ Ajout d\'une nouvelle chaîne:', channelData);

      const { error } = await supabase
        .from('youtube_channels')
        .insert([{
          artist: channelData.artist.trim(),
          youtube_url: channelData.youtube_url.trim(),
          channel_id: channelData.channel_id.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) {
        throw new Error(`Erreur lors de l'ajout: ${error.message}`);
      }

      console.log('✅ Chaîne ajoutée avec succès');
      await fetchChannels(); // Rafraîchir la liste

      return {
        success: true,
        message: 'Chaîne ajoutée avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'ajout'
      };
    }
  };

  /**
   * Met à jour une chaîne existante
   */
  const updateChannel = async (id: string, channelData: Partial<YouTubeChannel>): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('✏️ Mise à jour de la chaîne:', id, channelData);

      const { error } = await supabase
        .from('youtube_channels')
        .update({
          ...channelData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
      }

      console.log('✅ Chaîne mise à jour avec succès');
      await fetchChannels(); // Rafraîchir la liste

      return {
        success: true,
        message: 'Chaîne mise à jour avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
      };
    }
  };

  /**
   * Supprime une chaîne
   */
  const deleteChannel = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('🗑️ Suppression de la chaîne:', id);

      const { error } = await supabase
        .from('youtube_channels')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
      }

      console.log('✅ Chaîne supprimée avec succès');
      await fetchChannels(); // Rafraîchir la liste

      return {
        success: true,
        message: 'Chaîne supprimée avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la suppression'
      };
    }
  };

  /**
   * Statistiques des chaînes
   */
  const getStats = () => {
    const total = channels.length;

    return {
      total
    };
  };

  return {
    channels,
    loading,
    error,
    refetch: fetchChannels,
    addChannel,
    updateChannel,
    deleteChannel,
    getStats
  };
}