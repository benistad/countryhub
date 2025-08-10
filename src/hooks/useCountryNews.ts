import { useState, useEffect } from 'react';
import { supabase, CountryNewsItem } from '../lib/supabase';

/**
 * Hook personnalisé pour gérer les actualités country depuis le flux RSS
 * 
 * Fonctionnalités:
 * - Récupération des actualités depuis Supabase
 * - Déclenchement de la synchronisation RSS
 * - Gestion des états de chargement et d'erreur
 * - Mise à jour automatique après synchronisation
 */
export function useCountryNews() {
  const [news, setNews] = useState<CountryNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  /**
   * Récupère les actualités depuis Supabase
   */
  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📰 Récupération des actualités country depuis Supabase...');

      const { data, error } = await supabase
        .from('country_news')
        .select('*')
        .order('pub_date', { ascending: false })
        .limit(50); // Limiter à 50 articles récents

      if (error) {
        throw new Error(`Erreur Supabase: ${error.message}`);
      }

      console.log(`✅ ${data?.length || 0} actualités récupérées`);
      setNews(data || []);
      
      if (data && data.length > 0) {
        setLastUpdate(data[0].pub_date);
      }
    } catch (err) {
      console.error('❌ Erreur lors de la récupération des actualités:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Déclenche la synchronisation RSS via l'Edge Function
   * @returns {Promise<{success: boolean, message: string}>} Résultat de l'opération
   */
  const syncNews = async (): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('🚀 Déclenchement de la synchronisation RSS...');
      
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-gnews-country`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      console.log('✅ Synchronisation terminée:', result);

      // Afficher plus de détails sur le résultat
      if (result.debug) {
        console.log('🔍 Debug info:', result.debug);
      }
      if (result.sampleArticles) {
        console.log('📄 Exemples d\'articles:', result.sampleArticles);
      }

      // Rafraîchir les données après la synchronisation réussie
      if (result.success) {
        await fetchNews();
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

  return { 
    news, 
    loading, 
    error, 
    lastUpdate,
    refetch: fetchNews,
    syncNews
  };
}