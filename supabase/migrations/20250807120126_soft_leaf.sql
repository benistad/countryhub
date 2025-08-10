/*
  # Add sync_type columns to track manual vs automatic synchronizations

  1. New Columns
    - Add `sync_type` column to `videos` table (VARCHAR, default 'Manuel')
    - Add `sync_type` column to `country_chart` table (VARCHAR, default 'Manuel')

  2. Purpose
    - Track whether each sync was manual or automatic
    - Display last sync type in admin panel
    - Better monitoring of automation vs manual operations

  3. Default Values
    - Default to 'Manuel' for existing records
    - New records will specify 'Automatique' or 'Manuel'
*/

-- Add sync_type column to videos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'sync_type'
  ) THEN
    ALTER TABLE videos ADD COLUMN sync_type VARCHAR(20) DEFAULT 'Manuel';
  END IF;
END $$;

-- Add sync_type column to country_chart table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'country_chart' AND column_name = 'sync_type'
  ) THEN
    ALTER TABLE country_chart ADD COLUMN sync_type VARCHAR(20) DEFAULT 'Manuel';
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_sync_type ON videos (sync_type);
CREATE INDEX IF NOT EXISTS idx_country_chart_sync_type ON country_chart (sync_type);