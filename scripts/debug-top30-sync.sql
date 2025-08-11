-- Script de diagnostic pour la synchronisation Top 30
-- À exécuter dans l'interface SQL Supabase

-- 1. Vérifier les données actuelles dans Supabase
SELECT 
  chart_date,
  COUNT(*) as total_entries,
  MIN(rank) as min_rank,
  MAX(rank) as max_rank,
  MAX(created_at) as last_insert
FROM top30_country 
GROUP BY chart_date 
ORDER BY chart_date DESC 
LIMIT 5;

-- 2. Vérifier les données d'aujourd'hui
SELECT 
  rank,
  title,
  artist,
  apple_music_url,
  created_at
FROM top30_country 
WHERE chart_date = CURRENT_DATE
ORDER BY rank;

-- 3. Vérifier les données les plus récentes (toutes dates)
SELECT 
  rank,
  title,
  artist,
  chart_date,
  created_at
FROM top30_country 
WHERE chart_date = (SELECT MAX(chart_date) FROM top30_country)
ORDER BY rank
LIMIT 10;

-- 4. Nettoyer les données d'aujourd'hui (si besoin)
-- DELETE FROM top30_country WHERE chart_date = CURRENT_DATE;

-- 5. Vérifier l'historique des synchronisations
SELECT 
  chart_date,
  COUNT(*) as entries,
  MIN(created_at) as first_insert,
  MAX(created_at) as last_insert
FROM top30_country 
GROUP BY chart_date 
ORDER BY chart_date DESC 
LIMIT 10;
