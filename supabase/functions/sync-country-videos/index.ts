import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChannelMeta {
  artist: string;
  youtubeUrl: string;
}

interface VideoData {
  videoId: string;
  title: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  artist: string;
  url: string;
  thumbnailUrl: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse body safely (cron may send empty or malformed body)
    let trigger = 'unknown'
    let source = 'unknown'
    try {
      const body = await req.json()
      trigger = body.trigger || 'unknown'
      source = body.source || 'unknown'
    } catch {
      // Body parsing failed, use defaults
    }
    const startTime = Date.now()
    
    console.log(`[sync-country-videos] Starting sync - trigger: ${trigger}, source: ${source}`)

    // Read channels from CSV data (we'll use the existing youtube_channels table)
    const { data: channels, error: channelsError } = await supabaseClient
      .from('youtube_channels')
      .select('channel_id, artist, youtube_url')

    if (channelsError) {
      throw new Error(`Failed to fetch channels: ${channelsError.message}`)
    }

    if (!channels || channels.length === 0) {
      throw new Error('No YouTube channels found')
    }

    console.log(`[sync-country-videos] Found ${channels.length} channels to process`)

    const CUTOFF_ISO = '2025-08-01T00:00:00Z'
    const cutoffTime = new Date(CUTOFF_ISO).getTime()
    const BATCH_SIZE = 10
    const allVideos = new Map<string, VideoData>()

    // Process channels in batches
    for (let i = 0; i < channels.length; i += BATCH_SIZE) {
      const batch = channels.slice(i, i + BATCH_SIZE)
      console.log(`[sync-country-videos] Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(channels.length/BATCH_SIZE)}`)
      
      const results = await Promise.allSettled(
        batch.map(async (channel) => {
          try {
            const videos = await fetchChannelVideos(channel.channel_id, {
              artist: channel.artist || '',
              youtubeUrl: channel.youtube_url || ''
            }, cutoffTime)
            return videos
          } catch (err) {
            console.warn(`[sync-country-videos] Error for channel ${channel.channel_id}: ${err.message}`)
            return []
          }
        })
      )

      for (const result of results) {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          for (const video of result.value) {
            allVideos.set(video.videoId, video)
          }
        }
      }
    }

    const videos = Array.from(allVideos.values())
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    console.log(`[sync-country-videos] Found ${videos.length} videos to sync`)

    // Insert/update videos in database with conflict resolution
    if (videos.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('country_videos')
        .upsert(
          videos.map(video => ({
            video_id: video.videoId,
            title: video.title,
            published_at: video.publishedAt,
            channel_id: video.channelId,
            channel_title: video.channelTitle,
            artist: video.artist,
            url: video.url,
            thumbnail_url: video.thumbnailUrl
          })),
          { 
            onConflict: 'video_id',
            ignoreDuplicates: false 
          }
        )

      if (insertError) {
        throw new Error(`Failed to insert videos: ${insertError.message}`)
      }
    }

    // Record sync metadata
    const syncDuration = Date.now() - startTime
    const { error: metadataError } = await supabaseClient
      .from('country_videos_sync_metadata')
      .insert({
        last_sync_at: new Date().toISOString(),
        cutoff_date: CUTOFF_ISO,
        total_channels: channels.length,
        total_videos: videos.length,
        sync_duration_ms: syncDuration
      })

    if (metadataError) {
      console.warn(`[sync-country-videos] Failed to record metadata: ${metadataError.message}`)
    }

    // Update sync_history if exists
    try {
      await supabaseClient
        .from('sync_history')
        .update({
          last_sync_at: new Date().toISOString(),
          sync_count: supabaseClient.sql`sync_count + 1`,
          last_result: `${videos.length} vidéos synchronisées`
        })
        .eq('sync_type', 'country_videos')
    } catch (err) {
      console.warn(`[sync-country-videos] Failed to update sync_history: ${err.message}`)
    }

    const result = {
      success: true,
      message: 'Synchronisation terminée',
      lastSyncAt: new Date().toISOString(),
      cutoffDate: CUTOFF_ISO,
      totalChannels: channels.length,
      totalVideos: videos.length,
      syncDurationMs: syncDuration,
      trigger,
      source
    }

    console.log(`[sync-country-videos] Completed in ${syncDuration}ms`)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('[sync-country-videos] Error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function fetchChannelVideos(channelId: string, channelMeta: ChannelMeta, cutoffTime: number): Promise<VideoData[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CountryMusicHub/1.0)'
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for channel ${channelId}`)
  }

  const xmlText = await response.text()
  return extractVideosFromFeed(xmlText, channelMeta, cutoffTime)
}

function extractVideosFromFeed(xml: string, channelMeta: ChannelMeta, cutoffTime: number): VideoData[] {
  const videos: VideoData[] = []
  
  // Parse XML manually (simple approach for RSS feeds)
  const entryRegex = /<entry>(.*?)<\/entry>/gs
  let match

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1]
    
    try {
      // Extract video data
      const videoId = extractXmlValue(entry, 'yt:videoId')
      const title = extractXmlValue(entry, 'title')
      const published = extractXmlValue(entry, 'published')
      
      if (!videoId || !title || !published) continue
      
      const publishedDate = new Date(published)
      if (publishedDate.getTime() <= cutoffTime) continue
      
      // Filter for "official" videos
      if (!title.toLowerCase().includes('official')) continue
      
      // Extract additional data
      const channelId = extractXmlValue(entry, 'yt:channelId') || ''
      const channelTitle = extractXmlValue(entry, 'name') || channelMeta.artist || ''
      
      // Extract thumbnail
      let thumbnailUrl: string | null = null
      const thumbnailMatch = entry.match(/<media:thumbnail url="([^"]+)"/)
      if (thumbnailMatch) {
        thumbnailUrl = thumbnailMatch[1]
      }

      videos.push({
        videoId,
        title: decodeHtmlEntities(title),
        publishedAt: publishedDate.toISOString(),
        channelId,
        channelTitle: decodeHtmlEntities(channelTitle),
        artist: channelMeta.artist || '',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnailUrl
      })
    } catch (err) {
      console.warn(`[extractVideosFromFeed] Error parsing entry: ${err.message}`)
      continue
    }
  }

  return videos
}

function extractXmlValue(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]+)</${tagName}>`)
  const match = xml.match(regex)
  return match ? match[1].trim() : null
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
