/*
  # Create country_news table for Music Row RSS feed

  1. New Tables
    - `country_news`
      - `id` (uuid, primary key)
      - `title` (text, article title)
      - `link` (text, article URL)
      - `pub_date` (timestamptz, publication date)
      - `description` (text, article description)
      - `created_at` (timestamptz, when imported)
      - `updated_at` (timestamptz, last update)

  2. Security
    - Enable RLS on `country_news` table
    - Add policies for public read and authenticated write

  3. Indexes
    - Index on pub_date for sorting
    - Unique index on link to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS country_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  link text UNIQUE NOT NULL,
  pub_date timestamptz,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE country_news ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read country news"
  ON country_news
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert country news"
  ON country_news
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update country news"
  ON country_news
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete country news"
  ON country_news
  FOR DELETE
  TO authenticated
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_country_news_pub_date 
  ON country_news (pub_date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_country_news_link 
  ON country_news (link);