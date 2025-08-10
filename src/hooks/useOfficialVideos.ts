import { useState, useCallback } from 'react';
import { useSupabaseOfficialVideos } from './useSupabaseOfficialVideos';
import { supabase } from '../lib/supabase';

export interface Video {
  videoId: string;
  title: string;
  channelTitle: string;
  artist: string;
  publishedAt: string;
  thumbnailUrl: string;
  url: string;
}

export interface VideosData {
  lastSyncAt: string;
  cutoffDate: string;
  totalChannels: number;
  totalVideos: number;
  videos: Video[];
}

interface ChannelData {
  id: string;
  artist: string;
  youtube_url: string;
  channel_id: string;
}

export const useOfficialVideos = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { saveVideosToSupabase, getVideosFromSupabase, getLastSyncDate } = useSupabaseOfficialVideos();

  // Fonction pour lire le CSV des chaînes YouTube
  const readChannelsFromCSV = useCallback(async (): Promise<ChannelData[]> => {
    try {
      const response = await fetch('/youtube_channels_rows.csv');
      if (!response.ok) {
        throw new Error('Impossible de charger le fichier CSV des chaînes');
      }
      
      const csvText = await response.text();
      const lines = csvText.split('\n');
      const headers = lines[0].split(',');
      
      const channels: ChannelData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        if (values.length >= 4) {
          channels.push({
            id: values[0],
            artist: values[1],
            youtube_url: values[2],
            channel_id: values[3]
          });
        }
      }
      
      return channels;
    } catch (err) {
      throw new Error(`Erreur lors de la lecture du CSV: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  }, []);

  // Fonction pour récupérer le flux RSS d'une chaîne YouTube
  const fetchChannelFeed = useCallback(async (channelId: string): Promise<string> => {
    try {
      // Essayer plusieurs proxies CORS en cas d'échec
      const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)}`,
        `https://cors-anywhere.herokuapp.com/https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
      ];
      
      for (const proxyUrl of proxies) {
        try {
          const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/xml, text/xml, */*',
            },
          });
          
          if (response.ok) {
            const text = await response.text();
            if (text && text.includes('<feed')) {
              return text;
            }
          }
        } catch (proxyErr) {
          console.warn(`Proxy ${proxyUrl} failed:`, proxyErr);
          continue;
        }
      }
      
      throw new Error('Tous les proxies ont échoué');
    } catch (err) {
      console.warn(`Impossible de récupérer le flux pour la chaîne ${channelId}:`, err);
      return '';
    }
  }, []);

  // Fonction pour parser les vidéos depuis le XML RSS
  const parseVideosFromXML = useCallback((xmlContent: string, channel: any, cutoffDate: Date, blacklistedIds: Set<string>): Video[] => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      const entries = xmlDoc.querySelectorAll('entry');
      
      const videos: Video[] = [];
      
      entries.forEach((entry) => {
        const title = entry.querySelector('title')?.textContent || '';
        const videoId = entry.querySelector('yt\\:videoId')?.textContent || '';
        const publishedAt = entry.querySelector('published')?.textContent || '';
        const thumbnailUrl = entry.querySelector('media\\:thumbnail')?.getAttribute('url') || '';
        const channelTitle = entry.querySelector('author name')?.textContent || '';
        
        if (videoId && title && publishedAt) {
          const publishDate = new Date(publishedAt);
          
          // Filtrer par date (après le cutoff), par titre contenant "official" et vérifier la blacklist
          const isAfterCutoff = publishDate > cutoffDate;
          const hasOfficial = title.toLowerCase().includes('official');
          const isNotBlacklisted = !blacklistedIds.has(videoId);
          
          if (isAfterCutoff && hasOfficial && isNotBlacklisted) {
            videos.push({
              videoId,
              title,
              channelTitle: channel.artist,
              artist: channel.artist,
              publishedAt,
              thumbnailUrl,
              url: `https://www.youtube.com/watch?v=${videoId}`
            });
          } else if (isAfterCutoff && hasOfficial && !isNotBlacklisted) {
            console.log(`🚫 Vidéo ignorée (blacklistée): ${title}`);
          }
        }
      });
      
      return videos;
    } catch (err) {
      console.error('Erreur lors du parsing XML:', err);
      return [];
    }
  }, []);

  // Fonction principale de synchronisation
  const syncOfficialVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Début de la synchronisation des vidéos officielles...');
      
      // 1. Récupérer la date de dernière synchronisation
      const lastSyncDate = await getLastSyncDate();
      
      // 2. Déterminer la date de coupure pour filtrer les vidéos
      let cutoffDate: Date;
      if (lastSyncDate) {
        // Si on a une dernière sync, on prend cette date comme point de départ
        cutoffDate = new Date(lastSyncDate);
        console.log(`📅 Synchronisation incrémentale depuis: ${cutoffDate.toLocaleString('fr-FR')}`);
      } else {
        // Première synchronisation : utiliser le 1er août 2025
        cutoffDate = new Date('2025-08-01T00:00:00Z');
        console.log(`📅 Première synchronisation depuis: ${cutoffDate.toLocaleString('fr-FR')}`);
      }
      
      // 3. Lire les chaînes depuis le CSV
      const channels = await readChannelsFromCSV();
      if (channels.length === 0) {
        throw new Error('Aucune chaîne trouvée dans le fichier CSV');
      }
      
      console.log(`🎯 Date de coupure pour la synchronisation: ${cutoffDate.toISOString()}`);
      console.log(`📊 Début de la synchronisation des ${channels.length} chaînes YouTube...`);

      // Récupérer la blacklist des vidéos supprimées manuellement
      const { data: blacklistedVideos, error: blacklistError } = await supabase
        .from('official_videos_blacklist')
        .select('video_id');

      const blacklistedIds = new Set(
        blacklistedVideos?.map((item: any) => item.video_id) || []
      );

      if (blacklistError) {
        console.warn('Erreur lors de la récupération de la blacklist:', blacklistError);
      } else {
        console.log(`📋 ${blacklistedIds.size} vidéo(s) dans la blacklist`);
      }

      const allVideos: Video[] = [];
      const batchSize = 5; // Traiter 5 chaînes à la fois pour éviter les limites de tauxbilité
      let successCount = 0;
      let errorCount = 0; 
      for (let i = 0; i < channels.length; i += batchSize) {
        const batch = channels.slice(i, i + batchSize);
        console.log(`🔍 Traitement du batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(channels.length / batchSize)} (${batch.length} chaînes)`);
        
        const batchPromises = batch.map(async (channel) => {
          try {
            const xmlFeed = await fetchChannelFeed(channel.channel_id);
            if (xmlFeed) {
              const videos = parseVideosFromXML(xmlFeed, channel, cutoffDate, blacklistedIds);
              if (videos.length > 0) {
                successCount++;
                console.log(`✅ ${channel.artist}: ${videos.length} vidéos trouvées`);
              }
              return videos;
            } else {
              errorCount++;
              return [];
            }
          } catch (err) {
            errorCount++;
            console.warn(`❌ Erreur pour ${channel.artist}:`, err);
            return [];
          }
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            allVideos.push(...result.value);
          }
        });
        
        // Pause plus longue entre les batches pour éviter le rate limiting
        if (i + batchSize < channels.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.log(`📊 Résultats: ${successCount} succès, ${errorCount} erreurs sur ${channels.length} chaînes`);
      
      // 3. Trier par date de publication (plus récent en premier)
      allVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      
      // 4. Vérifier si on a des résultats valides
      if (allVideos.length === 0) {
        const errorMessage = `Aucune vidéo officielle trouvée. ${errorCount} chaînes sur ${channels.length} sont inaccessibles (problèmes CORS/réseau). Vérifiez votre connexion internet et réessayez.`;
        console.error(`❌ ${errorMessage}`);
        
        return {
          success: false,
          message: errorMessage
        };
      }
      
      // 5. Créer l'objet de données final
      const videosData: VideosData = {
        lastSyncAt: new Date().toISOString(),
        cutoffDate: '2025-08-01T00:00:00Z',
        totalChannels: channels.length,
        totalVideos: allVideos.length,
        videos: allVideos
      };
      
      // 6. Sauvegarder dans Supabase (synchronisation incrémentale)
      const saveSuccess = await saveVideosToSupabase(videosData, successCount, errorCount);
      
      // 7. Fallback localStorage si Supabase échoue
      if (!saveSuccess) {
        console.warn('⚠️ Sauvegarde Supabase échouée, utilisation du localStorage comme fallback');
        localStorage.setItem('officialVideosData', JSON.stringify(videosData));
      }
      
      // 8. Message de résultat avec détails sur les erreurs
      let resultMessage = `${allVideos.length} vidéos officielles trouvées`;
      
      if (errorCount > 0) {
        const successRate = Math.round((successCount / channels.length) * 100);
        resultMessage += ` (${successCount}/${channels.length} chaînes OK - ${successRate}% de réussite)`;
        
        if (successRate < 50) {
          resultMessage += `. Attention: Taux d'échec élevé, problèmes de connectivité détectés.`;
        }
      } else {
        resultMessage += ` (toutes les chaînes synchronisées avec succès)`;
      }
      
      // Ajouter info sur la sauvegarde incrémentale
      if (saveSuccess) {
        resultMessage += ` - Synchronisation incrémentale Supabase ✅`;
      } else {
        resultMessage += ` - Sauvegardé localement (Supabase indisponible) ⚠️`;
      }
      
      console.log(`✅ Synchronisation terminée: ${resultMessage}`);
      
      return {
        success: true,
        message: resultMessage,
        data: videosData
      };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('❌ Erreur lors de la synchronisation:', err);
      
      return {
        success: false,
        message: `Erreur de synchronisation: ${errorMessage}`
      };
    } finally {
      setLoading(false);
    }
  }, [readChannelsFromCSV, fetchChannelFeed, parseVideosFromXML]);

  // Fonction pour récupérer les données sauvegardées (Supabase en priorité, localStorage en fallback)
  const getStoredVideosData = useCallback(async (): Promise<VideosData | null> => {
    try {
      // 1. Essayer de récupérer depuis Supabase en priorité
      const supabaseData = await getVideosFromSupabase();
      if (supabaseData && supabaseData.videos.length > 0) {
        console.log('📥 Données récupérées depuis Supabase');
        return supabaseData;
      }
      
      // 2. Fallback vers localStorage si Supabase est vide ou échoue
      console.log('📱 Fallback vers localStorage');
      const stored = localStorage.getItem('officialVideosData');
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      console.warn('Erreur lors de la récupération des données:', err);
      // En cas d'erreur, essayer localStorage
      try {
        const stored = localStorage.getItem('officialVideosData');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
  }, [getVideosFromSupabase]);

  return {
    loading,
    error,
    syncOfficialVideos,
    getStoredVideosData
  };
};
