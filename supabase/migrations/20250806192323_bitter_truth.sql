/*
  # Fix YouTube Channels RLS Policies
  
  1. Security Updates
    - Update RLS policies to allow public read access
    - Allow authenticated users to insert, update, delete
    - Fix policy conditions for proper access control
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read YouTube channels" ON youtube_channels;
DROP POLICY IF EXISTS "Authenticated users can insert YouTube channels" ON youtube_channels;
DROP POLICY IF EXISTS "Authenticated users can update YouTube channels" ON youtube_channels;
DROP POLICY IF EXISTS "Authenticated users can delete YouTube channels" ON youtube_channels;

-- Create new policies with correct permissions
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
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete YouTube channels"
  ON youtube_channels
  FOR DELETE
  TO authenticated
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE youtube_channels ENABLE ROW LEVEL SECURITY;