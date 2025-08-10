/*
  # Table Chart Songs - Version Propre

  1. Nouvelle Table
    - Structure simple et claire
    - Index optimisés
    - RLS configuré

  2. Sécurité
    - Lecture publique
    - Modification authentifiée uniquement
*/

-- Supprimer la table existante si elle existe
DROP TABLE IF EXISTS chart_songs CASCADE;

-- Créer la nouvelle table
CREATE TABLE chart_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position integer NOT NULL,
  title text NOT NULL,
  artist text NOT NULL,
  weeks_on_chart integer DEFAULT 1,
  change_direction text DEFAULT 'new' CHECK (change_direction IN ('up', 'down', 'same', 'new')),
  chart_week date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour les performances
CREATE INDEX idx_chart_songs_position ON chart_songs (position);
CREATE INDEX idx_chart_songs_week ON chart_songs (chart_week DESC);

-- Activer RLS
ALTER TABLE chart_songs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Anyone can read chart songs"
  ON chart_songs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert chart songs"
  ON chart_songs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update chart songs"
  ON chart_songs
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete chart songs"
  ON chart_songs
  FOR DELETE
  TO authenticated
  USING (true);