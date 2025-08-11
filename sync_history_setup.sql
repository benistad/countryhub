-- Script à exécuter manuellement dans l'interface SQL de Supabase
-- pour créer la table d'historique des synchronisations

-- Table pour l'historique détaillé des synchronisations
CREATE TABLE IF NOT EXISTS sync_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('top30', 'news', 'official-videos')),
  sync_trigger TEXT NOT NULL CHECK (sync_trigger IN ('manual', 'automatic', 'cron')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error', 'partial')) DEFAULT 'running',
  duration_seconds NUMERIC,
  
  -- Statistiques détaillées
  items_scanned INTEGER DEFAULT 0,
  items_found INTEGER DEFAULT 0,
  items_processed INTEGER DEFAULT 0,
  items_inserted INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_deleted INTEGER DEFAULT 0,
  items_skipped INTEGER DEFAULT 0,
  
  -- Messages et logs
  success_message TEXT,
  error_message TEXT,
  warnings TEXT[],
  detailed_logs JSONB,
  
  -- Métadonnées spécifiques
  metadata JSONB,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_sync_history_type_started ON sync_history(sync_type, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_history_status ON sync_history(status);
CREATE INDEX IF NOT EXISTS idx_sync_history_started_at ON sync_history(started_at DESC);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_sync_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS trigger_update_sync_history_updated_at ON sync_history;
CREATE TRIGGER trigger_update_sync_history_updated_at
  BEFORE UPDATE ON sync_history
  FOR EACH ROW
  EXECUTE FUNCTION update_sync_history_updated_at();

-- RLS (Row Level Security)
ALTER TABLE sync_history ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Allow read access to sync_history" ON sync_history;
DROP POLICY IF EXISTS "Allow insert/update via service role" ON sync_history;

-- Politique pour permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Allow read access to sync_history" ON sync_history
  FOR SELECT USING (true);

-- Politique pour permettre l'insertion/mise à jour via service role uniquement
CREATE POLICY "Allow insert/update via service role" ON sync_history
  FOR ALL USING (auth.role() = 'service_role');

-- Fonction utilitaire pour créer une nouvelle entrée d'historique
CREATE OR REPLACE FUNCTION create_sync_history_entry(
  p_sync_type TEXT,
  p_sync_trigger TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  sync_id UUID;
BEGIN
  INSERT INTO sync_history (sync_type, sync_trigger, metadata)
  VALUES (p_sync_type, p_sync_trigger, p_metadata)
  RETURNING id INTO sync_id;
  
  RETURN sync_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction utilitaire pour mettre à jour une entrée d'historique
CREATE OR REPLACE FUNCTION update_sync_history_entry(
  p_sync_id UUID,
  p_status TEXT,
  p_items_scanned INTEGER DEFAULT NULL,
  p_items_found INTEGER DEFAULT NULL,
  p_items_processed INTEGER DEFAULT NULL,
  p_items_inserted INTEGER DEFAULT NULL,
  p_items_updated INTEGER DEFAULT NULL,
  p_items_deleted INTEGER DEFAULT NULL,
  p_items_skipped INTEGER DEFAULT NULL,
  p_success_message TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_warnings TEXT[] DEFAULT NULL,
  p_detailed_logs JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE sync_history
  SET 
    status = p_status,
    completed_at = CASE WHEN p_status IN ('success', 'error', 'partial') THEN NOW() ELSE completed_at END,
    duration_seconds = CASE WHEN p_status IN ('success', 'error', 'partial') THEN EXTRACT(EPOCH FROM (NOW() - started_at)) ELSE duration_seconds END,
    items_scanned = COALESCE(p_items_scanned, items_scanned),
    items_found = COALESCE(p_items_found, items_found),
    items_processed = COALESCE(p_items_processed, items_processed),
    items_inserted = COALESCE(p_items_inserted, items_inserted),
    items_updated = COALESCE(p_items_updated, items_updated),
    items_deleted = COALESCE(p_items_deleted, items_deleted),
    items_skipped = COALESCE(p_items_skipped, items_skipped),
    success_message = COALESCE(p_success_message, success_message),
    error_message = COALESCE(p_error_message, error_message),
    warnings = COALESCE(p_warnings, warnings),
    detailed_logs = COALESCE(p_detailed_logs, detailed_logs),
    metadata = CASE WHEN p_metadata IS NOT NULL THEN metadata || p_metadata ELSE metadata END
  WHERE id = p_sync_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue pour faciliter les requêtes d'historique
CREATE OR REPLACE VIEW sync_history_summary AS
SELECT 
  id,
  sync_type,
  sync_trigger,
  started_at,
  completed_at,
  status,
  duration_seconds,
  items_scanned,
  items_found,
  items_processed,
  items_inserted,
  items_updated,
  items_deleted,
  items_skipped,
  success_message,
  error_message,
  CASE WHEN warnings IS NOT NULL THEN array_length(warnings, 1) ELSE 0 END as warning_count,
  metadata,
  created_at
FROM sync_history
ORDER BY started_at DESC;
