import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface CountryVideo {
  id: string;
  video_id: string;
  title: string;
  published_at: string;
  channel_id: string;
  channel_title: string;
  artist: string;
  url: string;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CountryVideosSyncMetadata {
  id: string;
  last_sync_at: string;
  cutoff_date: string;
  total_channels: number;
  total_videos: number;
  sync_duration_ms: number | null;
  created_at: string;
}

export interface UseCountryVideosReturn {
  videos: CountryVideo[];
  loading: boolean;
  error: string | null;
  syncMetadata: CountryVideosSyncMetadata | null;
  refetch: () => Promise<void>;
  syncVideos: () => Promise<void>;
  syncing: boolean;
}

export function useCountryVideos(): UseCountryVideosReturn {
  const [videos, setVideos] = useState<CountryVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncMetadata, setSyncMetadata] = useState<CountryVideosSyncMetadata | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch videos ordered by published_at DESC
      const { data: videosData, error: videosError } = await supabase
        .from('country_videos')
        .select('*')
        .order('published_at', { ascending: false });

      if (videosError) throw videosError;

      // Fetch latest sync metadata
      const { data: metadataData, error: metadataError } = await supabase
        .from('country_videos_sync_metadata')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (metadataError && metadataError.code !== 'PGRST116') {
        console.warn('Error fetching sync metadata:', metadataError);
      }

      setVideos(videosData || []);
      setSyncMetadata(metadataData || null);
    } catch (err) {
      console.error('Error fetching country videos:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des vidéos');
    } finally {
      setLoading(false);
    }
  };

  const syncVideos = async () => {
    try {
      setSyncing(true);
      setError(null);

      // Call the sync Edge Function
      const { data, error } = await supabase.functions.invoke('sync-country-videos', {
        body: {
          trigger: 'manual',
          source: 'admin_panel',
          timestamp: new Date().toISOString()
        }
      });

      if (error) throw error;

      // Refresh data after sync
      await fetchVideos();
      
      return data;
    } catch (err) {
      console.error('Error syncing country videos:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la synchronisation');
      throw err;
    } finally {
      setSyncing(false);
    }
  };

  const refetch = fetchVideos;

  useEffect(() => {
    fetchVideos();
  }, []);

  return {
    videos,
    loading,
    error,
    syncMetadata,
    refetch,
    syncVideos,
    syncing
  };
}
