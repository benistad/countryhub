import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SyncHistoryEntry {
  id: string;
  sync_type: 'top30' | 'news' | 'official-videos' | 'country_videos';
  sync_trigger: 'manual' | 'automatic' | 'cron';
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'success' | 'error' | 'partial';
  duration_seconds: number | null;
  items_scanned: number;
  items_found: number;
  items_processed: number;
  items_inserted: number;
  items_updated: number;
  items_deleted: number;
  items_skipped: number;
  success_message: string | null;
  error_message: string | null;
  warnings: string[] | null;
  detailed_logs: any;
  metadata: any;
  created_at: string;
}

export interface SyncStats {
  lastSync: string | null;
  lastType: 'manual' | 'automatic' | null;
  itemCount: number;
  lastStatus: 'success' | 'error' | 'partial' | 'running' | null;
}

export const useSyncHistory = () => {
  const [history, setHistory] = useState<SyncHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger l'historique depuis Supabase
  const loadHistory = async (limit = 50) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sync_history_summary')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      setHistory(data || []);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement de l\'historique:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Obtenir les statistiques pour un type de sync donné
  const getSyncStats = (syncType: 'top30' | 'news' | 'official-videos' | 'country_videos'): SyncStats => {
    const typeHistory = history.filter(h => h.sync_type === syncType);
    const lastEntry = typeHistory[0]; // Le plus récent

    return {
      lastSync: lastEntry?.completed_at || lastEntry?.started_at || null,
      lastType: lastEntry?.sync_trigger === 'manual' ? 'manual' : 'automatic',
      itemCount: lastEntry?.items_processed || 0,
      lastStatus: lastEntry?.status || null
    };
  };

  // Obtenir les stats réelles depuis les tables de métadonnées
  const getRealSyncStats = async (syncType: 'top30' | 'news' | 'country_videos'): Promise<SyncStats> => {
    try {
      if (syncType === 'country_videos') {
        const { data, error } = await supabase
          .from('country_videos_sync_metadata')
          .select('*')
          .order('last_sync_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error || !data) {
          return { lastSync: null, lastType: 'automatic', itemCount: 0, lastStatus: null };
        }
        
        return {
          lastSync: data.last_sync_at,
          lastType: 'automatic',
          itemCount: data.total_videos || 0,
          lastStatus: 'success'
        };
      }
      
      if (syncType === 'top30') {
        const { data, error } = await supabase
          .from('top30_country')
          .select('updated_at')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        
        const { count } = await supabase
          .from('top30_country')
          .select('*', { count: 'exact', head: true });
        
        return {
          lastSync: data?.updated_at || null,
          lastType: 'automatic',
          itemCount: count || 0,
          lastStatus: data ? 'success' : null
        };
      }
      
      if (syncType === 'news') {
        const { data, error } = await supabase
          .from('country_news')
          .select('pub_date')
          .order('pub_date', { ascending: false })
          .limit(1)
          .single();
        
        const { count } = await supabase
          .from('country_news')
          .select('*', { count: 'exact', head: true });
        
        return {
          lastSync: data?.pub_date || null,
          lastType: 'automatic',
          itemCount: count || 0,
          lastStatus: data ? 'success' : null
        };
      }
      
      return { lastSync: null, lastType: null, itemCount: 0, lastStatus: null };
    } catch (err) {
      console.error(`Erreur lors de la récupération des stats pour ${syncType}:`, err);
      return { lastSync: null, lastType: null, itemCount: 0, lastStatus: null };
    }
  };

  // Créer une nouvelle entrée d'historique
  const createSyncEntry = async (
    syncType: 'top30' | 'news' | 'official-videos' | 'country_videos',
    syncTrigger: 'manual' | 'automatic' | 'cron',
    metadata: any = {}
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('create_sync_history_entry', {
        p_sync_type: syncType,
        p_sync_trigger: syncTrigger,
        p_metadata: metadata
      });

      if (error) throw error;
      
      // Recharger l'historique
      await loadHistory();
      
      return data;
    } catch (err) {
      console.error('Erreur lors de la création de l\'entrée d\'historique:', err);
      return null;
    }
  };

  // Mettre à jour une entrée d'historique
  const updateSyncEntry = async (
    syncId: string,
    updates: {
      status: 'running' | 'success' | 'error' | 'partial';
      itemsScanned?: number;
      itemsFound?: number;
      itemsProcessed?: number;
      itemsInserted?: number;
      itemsUpdated?: number;
      itemsDeleted?: number;
      itemsSkipped?: number;
      successMessage?: string;
      errorMessage?: string;
      warnings?: string[];
      detailedLogs?: any;
      metadata?: any;
    }
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('update_sync_history_entry', {
        p_sync_id: syncId,
        p_status: updates.status,
        p_items_scanned: updates.itemsScanned,
        p_items_found: updates.itemsFound,
        p_items_processed: updates.itemsProcessed,
        p_items_inserted: updates.itemsInserted,
        p_items_updated: updates.itemsUpdated,
        p_items_deleted: updates.itemsDeleted,
        p_items_skipped: updates.itemsSkipped,
        p_success_message: updates.successMessage,
        p_error_message: updates.errorMessage,
        p_warnings: updates.warnings,
        p_detailed_logs: updates.detailedLogs,
        p_metadata: updates.metadata
      });

      if (error) throw error;
      
      // Recharger l'historique
      await loadHistory();
      
      return true;
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'entrée d\'historique:', err);
      return false;
    }
  };

  // Obtenir l'historique filtré par type
  const getHistoryByType = (syncType: 'top30' | 'news' | 'official-videos') => {
    return history.filter(h => h.sync_type === syncType);
  };

  // Obtenir les statistiques globales
  const getGlobalStats = () => {
    const stats = {
      totalSyncs: history.length,
      successfulSyncs: history.filter(h => h.status === 'success').length,
      failedSyncs: history.filter(h => h.status === 'error').length,
      partialSyncs: history.filter(h => h.status === 'partial').length,
      runningSyncs: history.filter(h => h.status === 'running').length,
      averageDuration: 0,
      totalItemsProcessed: 0
    };

    const completedSyncs = history.filter(h => h.duration_seconds !== null);
    if (completedSyncs.length > 0) {
      stats.averageDuration = completedSyncs.reduce((sum, h) => sum + (h.duration_seconds || 0), 0) / completedSyncs.length;
    }

    stats.totalItemsProcessed = history.reduce((sum, h) => sum + h.items_processed, 0);

    return stats;
  };

  // Charger l'historique au montage du composant
  useEffect(() => {
    loadHistory();
  }, []);

  return {
    history,
    loading,
    error,
    loadHistory,
    getSyncStats,
    getRealSyncStats,
    createSyncEntry,
    updateSyncEntry,
    getHistoryByType,
    getGlobalStats
  };
};
