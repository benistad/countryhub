import { useState, useEffect } from 'react';
import { supabase, Top30Entry } from '../lib/supabase';

/**
 * Hook personnalisé pour gérer les données du Top 30 Country depuis Supabase
 * Les données sont synchronisées depuis Apify 2x/semaine pour économiser les coûts
 * 
 * Fonctionnalités:
 * - Récupération des données depuis Supabase (synchronisées depuis Apify)
 * - Gestion des états de chargement et d'erreur
 * - Fonction de synchronisation manuelle
 * - Statistiques des données
 */
export function useTop30() {
  const [items, setItems] = useState<Top30Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    fetchTop30FromSupabase();
  }, []);

  /**
   * Récupère les données depuis Supabase
   */
  const fetchTop30FromSupabase = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎵 Récupération des données Top 30 depuis Supabase...');

      // Récupérer les données les plus récentes depuis Supabase
      const { data, error } = await supabase
        .from('top30_country')
        .select('*')
        .order('chart_date', { ascending: false })
        .order('rank', { ascending: true });

      if (error) {
        throw new Error(`Erreur Supabase: ${error.message}`);
      }

      if (data && data.length > 0) {
        // Grouper par date et prendre la plus récente
        const latestDate = data[0].chart_date;
        const latestChart = data.filter(entry => entry.chart_date === latestDate);
        
        console.log(`✅ ${latestChart.length} entrées récupérées pour le ${latestDate}`);
        setItems(latestChart);
        setLastUpdate(latestDate);
      } else {
        console.log('ℹ️ Aucune donnée Top30 trouvée');
        setItems([]);
        setLastUpdate(null);
      }

    } catch (err) {
      console.error('❌ Erreur lors de la récupération depuis Supabase:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Déclenche une synchronisation manuelle depuis Apify
   */
  const syncFromApify = async (): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('🚀 Déclenchement de la synchronisation manuelle...');
      
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-top30-apify`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          automated: false
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      console.log('✅ Synchronisation terminée:', result);

      // Rafraîchir les données après la synchronisation réussie
      if (result.success) {
        await fetchTop30FromSupabase();
      }

      return {
        success: result.success,
        message: result.message || 'Synchronisation terminée avec succès'
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la synchronisation'
      };
    }
  };

  /**
   * Statistiques des données
   */
  const getStats = () => {
    const total = items.length;
    const withAppleMusic = items.filter(item => item.apple_music_url).length;
    const uniqueArtists = new Set(items.map(item => item.artist)).size;
    
    return {
      total,
      withAppleMusic,
      uniqueArtists,
      withoutAppleMusic: total - withAppleMusic
    };
  };

  return { 
    items, 
    loading, 
    error, 
    lastUpdate,
    refetch: fetchTop30FromSupabase,
    syncFromApify,
    getStats
  };
}