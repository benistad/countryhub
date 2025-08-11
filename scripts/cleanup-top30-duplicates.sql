-- Script de nettoyage manuel pour résoudre les contraintes de clé unique Top30
-- À exécuter dans l'interface SQL Supabase AVANT de relancer la synchronisation

-- 1. Vérifier les données existantes et les doublons potentiels
SELECT 
  chart_date,
  rank,
  COUNT(*) as count,
  STRING_AGG(title, ' | ') as titles
FROM top30_country 
GROUP BY chart_date, rank
HAVING COUNT(*) > 1
ORDER BY chart_date DESC, rank;

-- 2. Voir toutes les données actuelles
SELECT 
  chart_date,
  COUNT(*) as total_entries,
  MIN(created_at) as first_entry,
  MAX(created_at) as last_entry
FROM top30_country 
GROUP BY chart_date 
ORDER BY chart_date DESC;

-- 3. SOLUTION IMMÉDIATE : Supprimer toutes les données Top30 existantes
-- ATTENTION: Cela supprimera toutes les données Top30 existantes
-- Décommentez la ligne suivante pour exécuter la suppression complète :

-- DELETE FROM top30_country;

-- 4. Vérifier que la table est vide après suppression
-- SELECT COUNT(*) as remaining_entries FROM top30_country;

-- 5. Après avoir exécuté ce script, vous pouvez relancer la synchronisation
-- dans l'admin panel sans erreur de contrainte unique
