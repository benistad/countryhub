-- Migration pour News+ : Articles générés par IA
-- Créé le: 2026-03-19

-- Table pour stocker les articles News+ générés par IA
CREATE TABLE IF NOT EXISTS news_plus_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contenu de l'article
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL, -- Article complet généré par IA
  excerpt TEXT NOT NULL, -- Résumé court pour les cartes
  
  -- Métadonnées
  category TEXT NOT NULL, -- album, tour, award, news
  artist TEXT, -- Artiste principal mentionné
  tags TEXT[] DEFAULT '{}', -- Tags pour filtrage
  
  -- Images
  featured_image_url TEXT,
  
  -- SEO
  meta_description TEXT,
  meta_keywords TEXT[],
  
  -- Tracking
  source_articles_count INTEGER DEFAULT 0, -- Nombre d'articles sources utilisés
  source_articles_urls TEXT[], -- URLs des articles sources
  
  -- Publication
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_published BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_news_plus_published_at ON news_plus_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_plus_category ON news_plus_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_plus_artist ON news_plus_articles(artist);
CREATE INDEX IF NOT EXISTS idx_news_plus_slug ON news_plus_articles(slug);
CREATE INDEX IF NOT EXISTS idx_news_plus_is_published ON news_plus_articles(is_published);

-- Table pour tracker les clusters d'articles sources
CREATE TABLE IF NOT EXISTS news_plus_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification du cluster
  topic_summary TEXT NOT NULL, -- Résumé du sujet
  article_ids TEXT[] NOT NULL, -- IDs des articles Google News du cluster
  
  -- Résultat
  generated_article_id UUID REFERENCES news_plus_articles(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Index pour clusters
CREATE INDEX IF NOT EXISTS idx_news_plus_clusters_status ON news_plus_clusters(status);
CREATE INDEX IF NOT EXISTS idx_news_plus_clusters_created_at ON news_plus_clusters(created_at DESC);

-- Table pour l'historique de génération
CREATE TABLE IF NOT EXISTS news_plus_generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Statistiques de la génération
  articles_analyzed INTEGER DEFAULT 0,
  clusters_created INTEGER DEFAULT 0,
  articles_generated INTEGER DEFAULT 0,
  
  -- Détails
  execution_time_ms INTEGER,
  ai_model_used TEXT,
  
  -- Status
  status TEXT DEFAULT 'success', -- success, partial, failed
  error_details JSONB,
  
  -- Timestamp
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour historique
CREATE INDEX IF NOT EXISTS idx_news_plus_history_generated_at ON news_plus_generation_history(generated_at DESC);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_news_plus_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER update_news_plus_articles_updated_at
  BEFORE UPDATE ON news_plus_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_news_plus_updated_at();

-- Politique RLS (Row Level Security)
ALTER TABLE news_plus_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_plus_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_plus_generation_history ENABLE ROW LEVEL SECURITY;

-- Permettre la lecture publique des articles publiés
CREATE POLICY "Articles publiés lisibles par tous"
  ON news_plus_articles FOR SELECT
  USING (is_published = true);

-- Permettre toutes les opérations pour les utilisateurs authentifiés (admin)
CREATE POLICY "Admin complet sur articles"
  ON news_plus_articles FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin complet sur clusters"
  ON news_plus_clusters FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin complet sur historique"
  ON news_plus_generation_history FOR ALL
  USING (auth.role() = 'authenticated');

-- Commentaires pour documentation
COMMENT ON TABLE news_plus_articles IS 'Articles News+ générés automatiquement par IA à partir des sources Google News';
COMMENT ON TABLE news_plus_clusters IS 'Clusters d''articles sources regroupés par sujet similaire';
COMMENT ON TABLE news_plus_generation_history IS 'Historique des exécutions de génération News+';
