-- Nettoyage des articles News+ dupliqués
-- Garde uniquement le plus récent de chaque groupe de doublons

-- Supprimer les doublons en gardant l'article le plus récent pour chaque slug de base
WITH duplicates AS (
  SELECT 
    id,
    slug,
    -- Extraire le slug de base (sans le timestamp)
    regexp_replace(slug, '-\d+$', '') as base_slug,
    published_at,
    ROW_NUMBER() OVER (
      PARTITION BY regexp_replace(slug, '-\d+$', '')
      ORDER BY published_at DESC
    ) as rn
  FROM news_plus_articles
)
DELETE FROM news_plus_articles
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
);

-- Afficher le nombre d'articles restants
SELECT 
  COUNT(*) as total_articles,
  COUNT(DISTINCT regexp_replace(slug, '-\d+$', '')) as unique_articles
FROM news_plus_articles;
