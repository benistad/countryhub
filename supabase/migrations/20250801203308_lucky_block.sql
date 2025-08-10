/*
  # Create Billboard Chart Table

  1. New Tables
    - `billboard_chart`
      - `id` (uuid, primary key)
      - `position` (integer, chart position)
      - `title` (text, song title)
      - `artist` (text, artist name)
      - `chart_name` (text, chart type like 'hot-100', 'country-songs')
      - `weeks_on_chart` (integer, number of weeks on chart)
      - `peak_position` (integer, highest position reached)
      - `last_week_position` (integer, previous week position)
      - `chart_date` (date, chart week)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `billboard_chart` table
    - Add policies for public read access
    - Add policies for authenticated users to manage data

  3. Indexes
    - Index on chart_date for performance
    - Index on position for sorting
    - Unique constraint on position + chart_name + chart_date
*/

CREATE TABLE IF NOT EXISTS billboard_chart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position integer NOT NULL,
  title text NOT NULL,
  artist text NOT NULL,
  chart_name text NOT NULL DEFAULT 'hot-100',
  weeks_on_chart integer DEFAULT 1,
  peak_position integer,
  last_week_position integer,
  chart_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE billboard_chart ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_billboard_chart_date ON billboard_chart (chart_date DESC);
CREATE INDEX IF NOT EXISTS idx_billboard_chart_position ON billboard_chart (position);
CREATE INDEX IF NOT EXISTS idx_billboard_chart_name ON billboard_chart (chart_name);

-- Unique constraint to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_billboard_chart_unique_position_date 
ON billboard_chart (position, chart_name, chart_date);

-- RLS Policies
CREATE POLICY "Anyone can read billboard chart"
  ON billboard_chart
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert billboard chart"
  ON billboard_chart
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update billboard chart"
  ON billboard_chart
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete billboard chart"
  ON billboard_chart
  FOR DELETE
  TO authenticated
  USING (true);