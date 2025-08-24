import { useEffect, useRef, useCallback } from 'react';
import { useTop30 } from './useTop30';
import { useCountryNews } from './useCountryNews';

/**
 * Hook personnalisé pour l'actualisation automatique de la homepage
 * 
 * Fonctionnalités:
 * - Détection automatique des nouvelles données (Top30, News, Vidéos)
 * - Rafraîchissement intelligent basé sur les timestamps
 * - Polling périodique pour vérifier les mises à jour
 * - Callbacks pour notifier les changements
 */
export function useHomepageAutoRefresh() {
  const { refetch: refetchTop30, lastUpdate: top30LastUpdate } = useTop30();
  const { refetch: refetchNews, lastUpdate: newsLastUpdate } = useCountryNews();
  
  // Références pour stocker les derniers timestamps connus
  const lastKnownTop30Update = useRef<string | null>(null);
  const lastKnownNewsUpdate = useRef<string | null>(null);
  
  // Callbacks pour notifier les changements
  const onDataUpdated = useRef<{
    onTop30Updated?: () => void;
    onNewsUpdated?: () => void;
    onVideosUpdated?: () => void;
  }>({});

  /**
   * Vérifie s'il y a de nouvelles données Top30
   */
  const checkTop30Updates = useCallback(async () => {
    try {
      if (top30LastUpdate && top30LastUpdate !== lastKnownTop30Update.current) {
        console.log('🎵 Nouvelles données Top30 détectées');
        lastKnownTop30Update.current = top30LastUpdate;
        onDataUpdated.current.onTop30Updated?.();
        return true;
      }
    } catch (error) {
      console.error('Erreur lors de la vérification Top30:', error);
    }
    return false;
  }, [top30LastUpdate]);

  /**
   * Vérifie s'il y a de nouvelles actualités
   */
  const checkNewsUpdates = useCallback(async () => {
    try {
      if (newsLastUpdate && newsLastUpdate !== lastKnownNewsUpdate.current) {
        console.log('📰 Nouvelles actualités détectées');
        lastKnownNewsUpdate.current = newsLastUpdate;
        onDataUpdated.current.onNewsUpdated?.();
        return true;
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des actualités:', error);
    }
    return false;
  }, [newsLastUpdate]);

  /**
   * Vérifie s'il y a de nouvelles vidéos officielles
   */
  // Les vidéos officielles ont été retirées du projet

  /**
   * Vérifie toutes les sources de données pour des mises à jour
   */
  const checkAllUpdates = useCallback(async () => {
    const updates = await Promise.all([
      checkTop30Updates(),
      checkNewsUpdates()
    ]);
    
    const hasUpdates = updates.some(Boolean);
    if (hasUpdates) {
      console.log('🔄 Mises à jour détectées, actualisation de la homepage');
    }
    
    return hasUpdates;
  }, [checkTop30Updates, checkNewsUpdates]);

  /**
   * Force le rafraîchissement de toutes les données
   */
  const forceRefreshAll = useCallback(async () => {
    console.log('🔄 Rafraîchissement forcé de toutes les données');
    
    try {
      await Promise.all([
        refetchTop30(),
        refetchNews(),
        // Les vidéos officielles sont rafraîchies via leur propre système
      ]);
      
      // Vérifier les mises à jour après le rafraîchissement
      setTimeout(checkAllUpdates, 1000);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement forcé:', error);
    }
  }, [refetchTop30, refetchNews, checkAllUpdates]);

  /**
   * Configure les callbacks de notification
   */
  const setUpdateCallbacks = useCallback((callbacks: {
    onTop30Updated?: () => void;
    onNewsUpdated?: () => void;
    onVideosUpdated?: () => void;
  }) => {
    onDataUpdated.current = callbacks;
  }, []);

  /**
   * Initialise les timestamps de référence
   */
  useEffect(() => {
    if (top30LastUpdate && !lastKnownTop30Update.current) {
      lastKnownTop30Update.current = top30LastUpdate;
    }
  }, [top30LastUpdate]);

  useEffect(() => {
    if (newsLastUpdate && !lastKnownNewsUpdate.current) {
      lastKnownNewsUpdate.current = newsLastUpdate;
    }
  }, [newsLastUpdate]);

  /**
   * Polling périodique pour vérifier les mises à jour (toutes les 2 minutes)
   */
  useEffect(() => {
    const interval = setInterval(() => {
      checkAllUpdates();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [checkAllUpdates]);

  /**
   * Vérification immédiate des mises à jour quand les données changent
   */
  useEffect(() => {
    checkTop30Updates();
  }, [checkTop30Updates]);

  useEffect(() => {
    checkNewsUpdates();
  }, [checkNewsUpdates]);

  return {
    checkAllUpdates,
    forceRefreshAll,
    setUpdateCallbacks,
    checkTop30Updates,
    checkNewsUpdates
  };
}
