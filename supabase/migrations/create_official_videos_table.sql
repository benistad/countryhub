-- Création de la table pour les vidéos officielles
CREATE TABLE IF NOT EXISTS official_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id VARCHAR(20) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  channel_title VARCHAR(255),
  artist VARCHAR(255),
  published_at TIMESTAMPTZ NOT NULL,
  thumbnail_url TEXT,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Création de la table pour les métadonnées de synchronisation
CREATE TABLE IF NOT EXISTS official_videos_sync_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  last_sync_at TIMESTAMPTZ NOT NULL,
  cutoff_date TIMESTAMPTZ NOT NULL,
  total_channels INTEGER NOT NULL,
  total_videos INTEGER NOT NULL,
  success_count INTEGER NOT NULL,
  error_count INTEGER NOT NULL,
  success_rate DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Création de la table de blacklist pour les vidéos supprimées manuellement
CREATE TABLE IF NOT EXISTS official_videos_blacklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id VARCHAR(20) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  artist VARCHAR(255),
  reason TEXT DEFAULT 'Suppression manuelle par admin',
  deleted_by VARCHAR(100) DEFAULT 'admin',
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_official_videos_video_id ON official_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_official_videos_published_at ON official_videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_official_videos_artist ON official_videos(artist);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_last_sync ON official_videos_sync_metadata(last_sync_at DESC);
CREATE INDEX IF NOT EXISTS idx_blacklist_video_id ON official_videos_blacklist(video_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_official_videos_updated_at 
    BEFORE UPDATE ON official_videos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Politique RLS (Row Level Security) - permettre la lecture publique
ALTER TABLE official_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON official_videos FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON official_videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON official_videos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON official_videos FOR DELETE USING (true);

ALTER TABLE official_videos_sync_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON official_videos_sync_metadata FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON official_videos_sync_metadata FOR INSERT WITH CHECK (true);

ALTER TABLE official_videos_blacklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON official_videos_blacklist FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON official_videos_blacklist FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON official_videos_blacklist FOR UPDATE USING (true);
CREATE POLICY "Allow public update on official_videos" 
    ON official_videos FOR UPDATE 
    USING (true);

CREATE POLICY "Allow public insert on sync_metadata" 
    ON official_videos_sync_metadata FOR INSERT 
    WITH CHECK (true);

-- Commentaires pour documenter les tables
COMMENT ON TABLE official_videos IS 'Table stockant les vidéos officielles synchronisées depuis YouTube';
COMMENT ON TABLE official_videos_sync_metadata IS 'Table stockant les métadonnées des synchronisations (statistiques, dates, etc.)';

COMMENT ON COLUMN official_videos.video_id IS 'ID unique de la vidéo YouTube (ex: dQw4w9WgXcQ)';
COMMENT ON COLUMN official_videos.title IS 'Titre de la vidéo';
COMMENT ON COLUMN official_videos.channel_title IS 'Nom de la chaîne YouTube';
COMMENT ON COLUMN official_videos.artist IS 'Nom de l''artiste (depuis le CSV)';
COMMENT ON COLUMN official_videos.published_at IS 'Date de publication de la vidéo sur YouTube';
COMMENT ON COLUMN official_videos.thumbnail_url IS 'URL de la miniature de la vidéo';
COMMENT ON COLUMN official_videos.url IS 'URL complète de la vidéo YouTube';
