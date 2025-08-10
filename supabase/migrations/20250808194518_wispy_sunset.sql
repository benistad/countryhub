/*
  # Add uploads playlist ID to youtube_channels table
  
  1. New Columns
    - `uploads_playlist_id` (text) - Store the uploads playlist ID for each channel
    - `last_sync_at` (timestamp) - Track when each channel was last synced
    - `sync_priority` (integer) - Priority for sync rotation (lower = higher priority)
  
  2. Indexes
    - Add index on last_sync_at for efficient rotation queries
    - Add index on sync_priority for ordering
  
  3. Update existing channels
    - Set default values for new columns
*/

-- Add new columns to youtube_channels table
ALTER TABLE youtube_channels 
ADD COLUMN IF NOT EXISTS uploads_playlist_id text,
ADD COLUMN IF NOT EXISTS last_sync_at timestamptz DEFAULT now() - interval '1 day',
ADD COLUMN IF NOT EXISTS sync_priority integer DEFAULT 0;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_youtube_channels_last_sync 
ON youtube_channels (last_sync_at ASC);

CREATE INDEX IF NOT EXISTS idx_youtube_channels_sync_priority 
ON youtube_channels (sync_priority ASC, last_sync_at ASC);

-- Update existing channels with staggered last_sync_at to spread initial load
UPDATE youtube_channels 
SET last_sync_at = now() - interval '1 day' + (random() * interval '8 hours')
WHERE last_sync_at IS NULL OR last_sync_at = now() - interval '1 day';