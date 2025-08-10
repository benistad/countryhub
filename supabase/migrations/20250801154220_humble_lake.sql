/*
  # Create country_chart table

  1. New Tables
    - `country_chart`
      - `id` (uuid, primary key)
      - `position` (integer, chart position)
      - `title` (text, song title)
      - `artist` (text, artist name)
      - `chart_date` (date, when the chart was scraped)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `country_chart` table
    - Add policy for public read access
    - Add policy for authenticated users to insert/update/delete

  3. Indexes
    - Index on position for fast sorting
    - Index on chart_date for filtering by date
*/

CREATE TABLE IF NOT EXISTS country_chart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position integer NOT NULL,
  title text NOT NULL,
  artist text NOT NULL,
  chart_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE country_chart ENABLE ROW LEVEL SECURITY;

-- Policies for public read access
CREATE POLICY "Anyone can read country chart"
  ON country_chart
  FOR SELECT
  TO public
  USING (true);

-- Policies for authenticated users
CREATE POLICY "Authenticated users can insert country chart"
  ON country_chart
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update country chart"
  ON country_chart
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete country chart"
  ON country_chart
  FOR DELETE
  TO authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_country_chart_position 
  ON country_chart (position);

CREATE INDEX IF NOT EXISTS idx_country_chart_date 
  ON country_chart (chart_date DESC);

-- Unique constraint to prevent duplicates for same date
CREATE UNIQUE INDEX IF NOT EXISTS idx_country_chart_unique_position_date 
  ON country_chart (position, chart_date);