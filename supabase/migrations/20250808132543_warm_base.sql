/*
  # Create Top30 Table

  1. New Tables
    - `top30_country`
      - `id` (uuid, primary key)
      - `rank` (integer, position in chart)
      - `title` (text, song title)
      - `artist` (text, artist name)
      - `apple_music_url` (text, optional Apple Music link)
      - `chart_date` (date, chart week)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `top30_country` table
    - Add policy for public read access
    - Add policy for authenticated users to manage data

  3. Indexes
    - Index on chart_date for performance
    - Index on rank for sorting
    - Unique constraint on rank + chart_date
*/

CREATE TABLE IF NOT EXISTS top30_country (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank integer NOT NULL,
  title text NOT NULL,
  artist text NOT NULL,
  apple_music_url text,
  chart_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE top30_country ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_top30_country_chart_date ON top30_country (chart_date DESC);
CREATE INDEX IF NOT EXISTS idx_top30_country_rank ON top30_country (rank);
CREATE UNIQUE INDEX IF NOT EXISTS idx_top30_country_unique_rank_date ON top30_country (rank, chart_date);

-- RLS Policies
CREATE POLICY "Anyone can read top30 country"
  ON top30_country
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert top30 country"
  ON top30_country
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update top30 country"
  ON top30_country
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete top30 country"
  ON top30_country
  FOR DELETE
  TO authenticated
  USING (true);