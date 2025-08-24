-- Migration: Create country_videos table for YouTube video synchronization
-- This table stores official country music videos from YouTube channels

-- Create country_videos table
CREATE TABLE IF NOT EXISTS public.country_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id TEXT NOT NULL UNIQUE, -- YouTube video ID
    title TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    channel_id TEXT NOT NULL,
    channel_title TEXT NOT NULL,
    artist TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_country_videos_video_id ON public.country_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_country_videos_channel_id ON public.country_videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_country_videos_published_at ON public.country_videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_country_videos_artist ON public.country_videos(artist);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_country_videos_updated_at 
    BEFORE UPDATE ON public.country_videos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.country_videos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access on country_videos" 
    ON public.country_videos FOR SELECT 
    USING (true);

CREATE POLICY "Allow authenticated users to insert country_videos" 
    ON public.country_videos FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update country_videos" 
    ON public.country_videos FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete country_videos" 
    ON public.country_videos FOR DELETE 
    USING (auth.role() = 'authenticated');

-- Create country_videos_sync_metadata table for tracking sync status
CREATE TABLE IF NOT EXISTS public.country_videos_sync_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    last_sync_at TIMESTAMPTZ NOT NULL,
    cutoff_date TIMESTAMPTZ NOT NULL,
    total_channels INTEGER NOT NULL DEFAULT 0,
    total_videos INTEGER NOT NULL DEFAULT 0,
    sync_duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for sync metadata
ALTER TABLE public.country_videos_sync_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies for sync metadata
CREATE POLICY "Allow public read access on country_videos_sync_metadata" 
    ON public.country_videos_sync_metadata FOR SELECT 
    USING (true);

CREATE POLICY "Allow authenticated users to insert country_videos_sync_metadata" 
    ON public.country_videos_sync_metadata FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Add sync_history entry for country_videos if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sync_history') THEN
        INSERT INTO public.sync_history (sync_type, description, is_active)
        VALUES ('country_videos', 'Synchronisation des vidéos country YouTube', true)
        ON CONFLICT (sync_type) DO NOTHING;
    END IF;
END $$;
