import { useState, useEffect } from 'react';
import { supabase, CountryChartEntry } from '../lib/supabase';

/**
 * Hook personnalisé pour gérer les données du classement country PopVortex
 * 
 * Fonctionnalités:
 * - Récupération des données depuis Supabase
 * - Déclenchement du scraping PopVortex
 * - Gestion des états de chargement et d'erreur
 * - Mise à jour automatique après scraping
 */
export function useCountryChart() {
  const [chart, setChart] = useState<CountryChartEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    fetchChart();
  }, []);

  /**
   * Récupère les données du classement depuis Supabase
   * Prend automatiquement les données les plus récentes
   */
  const fetchChart = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Récupération du classement country depuis Supabase...');

      // Récupérer les données du classement le plus récent
      const { data, error } = await supabase
        .from('country_chart')
        .select('*, sync_type')
        .order('chart_date', { ascending: false })
        .order('position', { ascending: true });

      if (error) {
        throw new Error(`Erreur Supabase: ${error.message}`);
      }

      if (data && data.length > 0) {
        // Grouper par date et prendre la plus récente
        const latestDate = data[0].chart_date;
        const latestChart = data.filter(entry => entry.chart_date === latestDate);
        
        console.log(`✅ ${latestChart.length} entrées récupérées pour le ${latestDate}`);
        setChart(latestChart);
        setLastUpdate(latestDate);
      } else {
        console.log('ℹ️ Aucune donnée de classement trouvée');
        setChart([]);
        setLastUpdate(null);
      }
    } catch (err) {
      console.error('❌ Erreur lors de la récupération du classement:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Déclenche le scraping du classement PopVortex via l'Edge Function
   * @returns {Promise<{success: boolean, message: string}>} Résultat de l'opération
   */
  const updateChart = async (): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('🚀 Déclenchement de la mise à jour...');
      
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-popvortex-chart`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          automated: false,
          syncType: 'Manuel'
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      console.log('✅ Mise à jour terminée:', result);

      // Rafraîchir les données après la mise à jour réussie
      if (result.success) {
        await fetchChart();
      }

      return {
        success: result.success,
        message: result.message || 'Opération terminée avec succès'
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
   * Statistiques du classement
   */
  const getStats = () => {
    const total = chart.length;
    
    return {
      total
    };
  };

  return { 
    chart, 
    loading, 
    error, 
    lastUpdate,
    refetch: fetchChart,
    updateChart,
    getStats
  };
}