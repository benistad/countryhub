-- Fonction SQL pour nettoyer les anciens articles News+
CREATE OR REPLACE FUNCTION delete_old_news_plus_articles(keep_count INTEGER DEFAULT 100)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les articles au-delà du nombre à conserver
  WITH articles_to_keep AS (
    SELECT id
    FROM news_plus_articles
    ORDER BY published_at DESC
    LIMIT keep_count
  )
  DELETE FROM news_plus_articles
  WHERE id NOT IN (SELECT id FROM articles_to_keep);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques News+
CREATE OR REPLACE FUNCTION get_news_plus_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_articles', (SELECT COUNT(*) FROM news_plus_articles WHERE is_published = true),
    'featured_articles', (SELECT COUNT(*) FROM news_plus_articles WHERE is_published = true AND featured = true),
    'articles_by_category', (
      SELECT json_object_agg(category, count)
      FROM (
        SELECT category, COUNT(*) as count
        FROM news_plus_articles
        WHERE is_published = true
        GROUP BY category
      ) cat_counts
    ),
    'last_generation', (
      SELECT json_build_object(
        'generated_at', generated_at,
        'articles_generated', articles_generated,
        'status', status
      )
      FROM news_plus_generation_history
      ORDER BY generated_at DESC
      LIMIT 1
    ),
    'total_generations', (SELECT COUNT(*) FROM news_plus_generation_history)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON FUNCTION delete_old_news_plus_articles IS 'Supprime les anciens articles News+ en gardant seulement les N plus récents';
COMMENT ON FUNCTION get_news_plus_stats IS 'Retourne les statistiques complètes du système News+';
