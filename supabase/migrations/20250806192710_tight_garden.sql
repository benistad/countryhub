/*
  # Suppression du champ statut de la table youtube_channels
  
  1. Modifications
    - Supprime la colonne status
    - Supprime la contrainte de vérification
    - Supprime l'index sur le statut
  
  2. Sécurité
    - Maintient les politiques RLS existantes
*/

-- Supprimer la contrainte de vérification du statut
ALTER TABLE youtube_channels DROP CONSTRAINT IF EXISTS youtube_channels_status_check;

-- Supprimer l'index sur le statut
DROP INDEX IF EXISTS idx_youtube_channels_status;

-- Supprimer la colonne status
ALTER TABLE youtube_channels DROP COLUMN IF EXISTS status;