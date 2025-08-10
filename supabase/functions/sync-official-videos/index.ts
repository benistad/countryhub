/*
  # Sync Official Videos (YouTube uploads)

  Purpose:
  - Fetch recent uploads from managed YouTube channels and persist to `official_videos`
  - Skip videos present in `official_videos_blacklist`
  - Upsert by `video_id` to avoid duplicates
  - Record sync stats in `official_videos_sync_metadata`
  - Update `youtube_channels.last_sync_at` for processed channels

  Scheduling:
  - Pair with `setup-official-videos-cron` to run daily

  Request body (optional):
  - limit: number of channels to process (default: 500)
  - hours: lookback window in hours for new videos (default: 24)
  - maxResultsPerChannel: max videos to fetch per channel (default: 10)
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

type Channel = {
  id: string;
  artist: string | null;
  channel_id: string;
  uploads_playlist_id: string | null;
  last_sync_at: string | null;
};

type VideoRecord = {
  video_id: string;
  title: string;
  channel_title: string | null;
  artist: string | null;
  published_at: string; // ISO
  thumbnail_url: string | null;
  url: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!supabaseUrl || !supabaseKey) {
      return json({ success: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, 500);
    }

    const youtubeApiKeys: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const key = Deno.env.get(`YOUTUBE_API_KEY_${i}`);
      if (key) youtubeApiKeys.push(key);
    }
    if (youtubeApiKeys.length === 0) {
      return json({ success: false, error: 'No YouTube API keys found (YOUTUBE_API_KEY_1..N)' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = (await safeJson(req)) || {};
    const limit = clampInt(body.limit, 1, 2000, 500);
    const hours = clampInt(body.hours, 1, 720, 24); // between 1h and 30 days
    const maxResultsPerChannel = clampInt(body.maxResultsPerChannel, 1, 50, 10);

    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    const cutoffISO = cutoffDate.toISOString();

    // 1) Pick channels to process: those with uploads_playlist_id, oldest first
    const { data: channels, error: chErr } = await supabase
      .from('youtube_channels')
      .select('id, artist, channel_id, uploads_playlist_id, last_sync_at')
      .not('uploads_playlist_id', 'is', null)
      .order('last_sync_at', { ascending: true, nullsFirst: true })
      .limit(limit);

    if (chErr) throw new Error(`Error fetching channels: ${chErr.message}`);

    if (!channels || channels.length === 0) {
      return json({ success: true, message: 'No channels to process', processedChannels: 0, inserted: 0, upserted: 0 });
    }

    let processedChannels = 0;
    let candidateVideos: VideoRecord[] = [];

    // 2) For each channel, fetch latest uploads via playlistItems
    for (const c of channels as Channel[]) {
      try {
        if (!c.uploads_playlist_id) continue;
        const items = await getPlaylistItemsSince(youtubeApiKeys, c.uploads_playlist_id, cutoffISO, maxResultsPerChannel);
        const mapped = items.map((it) => mapPlaylistItemToRecord(it, c.artist));
        candidateVideos.push(...mapped);
        processedChannels++;
        // Short pause to be gentle
        await sleep(50);
      } catch (e) {
        // Continue with next channel
        console.warn(`Channel error (${c.artist ?? c.channel_id}):`, e?.message || e);
      }
    }

    // Deduplicate by video_id
    const byId = new Map<string, VideoRecord>();
    for (const v of candidateVideos) {
      if (!byId.has(v.video_id)) byId.set(v.video_id, v);
    }
    const uniqueVideos = Array.from(byId.values());

    // 3) Filter out blacklisted
    let filtered = uniqueVideos;
    if (uniqueVideos.length > 0) {
      const ids = uniqueVideos.map(v => v.video_id);
      // chunk IN queries to avoid URL size limits
      const chunkSize = 500;
      const blacklisted = new Set<string>();
      for (let i = 0; i < ids.length; i += chunkSize) {
        const slice = ids.slice(i, i + chunkSize);
        const { data: bl, error: blErr } = await supabase
          .from('official_videos_blacklist')
          .select('video_id')
          .in('video_id', slice);
        if (blErr) throw new Error(`Error fetching blacklist: ${blErr.message}`);
        (bl || []).forEach(r => blacklisted.add(r.video_id));
      }
      filtered = uniqueVideos.filter(v => !blacklisted.has(v.video_id));
    }

    // 4) Upsert into official_videos in batches
    let upserted = 0;
    const batchSize = 500;
    for (let i = 0; i < filtered.length; i += batchSize) {
      const batch = filtered.slice(i, i + batchSize);
      const { error: upErr, count } = await supabase
        .from('official_videos')
        .upsert(batch, { onConflict: 'video_id', ignoreDuplicates: true, count: 'exact' });
      if (upErr) throw new Error(`Upsert error: ${upErr.message}`);
      upserted += count ?? 0;
    }

    // 5) Update last_sync_at for processed channels (best effort)
    const channelIds = (channels as Channel[]).map(c => c.id);
    if (channelIds.length > 0) {
      await supabase.from('youtube_channels')
        .update({ last_sync_at: new Date().toISOString() })
        .in('id', channelIds);
    }

    // 6) Insert sync metadata
    const successCount = upserted;
    const totalVideos = filtered.length;
    const errorCount = Math.max(0, totalVideos - successCount);
    const successRate = totalVideos > 0 ? Math.round((successCount / totalVideos) * 10000) / 100 : 100.0;

    const { error: metaErr } = await supabase
      .from('official_videos_sync_metadata')
      .insert([{ 
        last_sync_at: new Date().toISOString(),
        cutoff_date: cutoffISO,
        total_channels: processedChannels,
        total_videos: totalVideos,
        success_count: successCount,
        error_count: errorCount,
        success_rate: successRate,
      }]);
    if (metaErr) console.warn('Metadata insert warning:', metaErr.message);

    return json({
      success: true,
      message: 'Official videos sync complete',
      processedChannels,
      candidates: candidateVideos.length,
      filtered,
      inserted: upserted,
      cutoffISO,
      limit,
      hours,
      maxResultsPerChannel,
    }, 200);

  } catch (error) {
    console.error('❌ Sync error:', error);
    return json({ success: false, error: error?.message || String(error) }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function safeJson(req: Request): Promise<any | null> {
  try {
    if (req.method === 'GET') return null;
    const text = await req.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function clampInt(value: any, min: number, max: number, dflt: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return dflt;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

// Fetch latest uploads from an uploads playlist since cutoff
async function getPlaylistItemsSince(apiKeys: string[], uploadsPlaylistId: string, cutoffISO: string, maxResults: number) {
  const cutoff = new Date(cutoffISO).getTime();
  const items: any[] = [];
  let pageToken: string | undefined = undefined;
  let usedKeyIndex = 0;

  while (true) {
    const apiKey = apiKeys[usedKeyIndex % apiKeys.length];
    usedKeyIndex++;

    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('playlistId', uploadsPlaylistId);
    url.searchParams.set('maxResults', String(Math.min(50, maxResults)));
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    url.searchParams.set('key', apiKey);

    const resp = await fetch(url.toString());
    if (!resp.ok) {
      // try next key on rate limit/quota
      if (resp.status === 403 || resp.status === 429) {
        await sleep(200);
        continue;
      }
      throw new Error(`YouTube API error ${resp.status}`);
    }
    const data = await resp.json();
    if (Array.isArray(data.items)) {
      for (const it of data.items) {
        const publishedAt = it?.snippet?.publishedAt ? new Date(it.snippet.publishedAt).getTime() : 0;
        if (publishedAt >= cutoff) items.push(it);
      }
    }
    pageToken = data.nextPageToken;

    // Stop if no more pages or enough items
    if (!pageToken || items.length >= maxResults) break;
  }

  // Trim to maxResults
  return items.slice(0, maxResults);
}

function mapPlaylistItemToRecord(item: any, artist: string | null): VideoRecord {
  const videoId = item?.snippet?.resourceId?.videoId || '';
  const title = item?.snippet?.title || '';
  const channelTitle = item?.snippet?.channelTitle || null;
  const publishedAt = item?.snippet?.publishedAt || new Date().toISOString();
  const thumbnail = item?.snippet?.thumbnails?.high?.url
    || item?.snippet?.thumbnails?.medium?.url
    || item?.snippet?.thumbnails?.default?.url
    || null;
  return {
    video_id: videoId,
    title,
    channel_title: channelTitle,
    artist: artist || null,
    published_at: publishedAt,
    thumbnail_url: thumbnail,
    url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
  };
}
