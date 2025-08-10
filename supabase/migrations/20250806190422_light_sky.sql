/*
  # Create YouTube Channels table

  1. New Tables
    - `youtube_channels`
      - `id` (uuid, primary key)
      - `artist` (text, artist name)
      - `youtube_url` (text, full YouTube channel URL)
      - `channel_id` (text, YouTube channel ID)
      - `status` (text, either "officiel" or "non officiel")
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `youtube_channels` table
    - Add policy for public read access
    - Add policies for authenticated users to manage data

  3. Indexes
    - Index on artist name for search
    - Index on status for filtering
    - Unique index on channel_id to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS youtube_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist text NOT NULL,
  youtube_url text NOT NULL,
  channel_id text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'non officiel',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraint to ensure status is either "officiel" or "non officiel"
ALTER TABLE youtube_channels 
ADD CONSTRAINT youtube_channels_status_check 
CHECK (status IN ('officiel', 'non officiel'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_youtube_channels_artist ON youtube_channels (artist);
CREATE INDEX IF NOT EXISTS idx_youtube_channels_status ON youtube_channels (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_youtube_channels_channel_id ON youtube_channels (channel_id);

-- Enable Row Level Security
ALTER TABLE youtube_channels ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read YouTube channels"
  ON youtube_channels
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert YouTube channels"
  ON youtube_channels
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update YouTube channels"
  ON youtube_channels
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete YouTube channels"
  ON youtube_channels
  FOR DELETE
  TO authenticated
  USING (true);

-- Add some sample data
INSERT INTO youtube_channels (artist, youtube_url, channel_id, status) VALUES
('Carrie Underwood', 'https://www.youtube.com/@CarrieUnderwoodOfficial', 'UCqOTBKHKKslC6bGX7g0yNYg', 'officiel'),
('Keith Urban', 'https://www.youtube.com/@KeithUrbanOfficial', 'UCmKuTLyZR1c-1Ej4T-XvYbg', 'officiel'),
('Blake Shelton', 'https://www.youtube.com/@BlakeShelton', 'UCqOTBKHKKslC6bGX7g0yNYg', 'officiel'),
('Luke Bryan', 'https://www.youtube.com/@LukeBryanOfficial', 'UCqOTBKHKKslC6bGX7g0yNYg', 'officiel'),
('Miranda Lambert', 'https://www.youtube.com/@MirandaLambertOfficial', 'UCqOTBKHKKslC6bGX7g0yNYg', 'officiel')
ON CONFLICT (channel_id) DO NOTHING;

-- Display summary
DO $$
DECLARE
    total_count integer;
    official_count integer;
    non_official_count integer;
BEGIN
    SELECT COUNT(*) INTO total_count FROM youtube_channels;
    SELECT COUNT(*) INTO official_count FROM youtube_channels WHERE status = 'officiel';
    SELECT COUNT(*) INTO non_official_count FROM youtube_channels WHERE status = 'non officiel';
    
    RAISE NOTICE '✅ Table youtube_channels créée avec succès !';
    RAISE NOTICE '📊 Total chaînes: %', total_count;
    RAISE NOTICE '🎵 Chaînes officielles: %', official_count;
    RAISE NOTICE '🎤 Chaînes non officielles: %', non_official_count;
END $$;