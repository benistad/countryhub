import express from 'express';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import cron from 'node-cron';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static('dist')); // Serve Vite build

// Configuration
const CSV_PATH = path.join(__dirname, 'youtube_channels_rows.csv');
const DATA_PATH = path.join(__dirname, 'data', 'official_videos.json');
const CUTOFF_DATE = new Date('2025-08-01T00:00:00Z');
const CUTOFF_ISO = CUTOFF_DATE.toISOString();

// Utility functions
function ensureDataDir() {
  const dataDir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readCsvChannels() {
  if (!fs.existsSync(CSV_PATH)) {
    console.warn(`[csv] File not found: ${CSV_PATH}`);
    return new Map();
  }
  
  const csv = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = csv.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  const channelIdIndex = headers.indexOf('channel_id');
  const artistIndex = headers.indexOf('artist');
  
  if (channelIdIndex === -1) {
    console.warn('[csv] No channel_id column found');
    return new Map();
  }
  
  const channelMap = new Map();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const channelId = cols[channelIdIndex];
    const artist = artistIndex >= 0 ? cols[artistIndex] : '';
    if (channelId) {
      channelMap.set(channelId, artist);
    }
  }
  
  console.log(`[csv] Loaded ${channelMap.size} channels`);
  return channelMap;
}

async function fetchChannelFeedXml(channelId) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)' }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return await response.text();
}

function extractVideosFromFeed(xml, artist) {
  const videos = [];
  const entryRegex = /<entry>(.*?)<\/entry>/gs;
  let match;
  
  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    
    const videoId = (entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1];
    const title = (entry.match(/<title>(.*?)<\/title>/) || [])[1];
    const published = (entry.match(/<published>(.*?)<\/published>/) || [])[1];
    const channelTitle = (entry.match(/<name>(.*?)<\/name>/) || [])[1];
    const channelId = (entry.match(/<uri>.*?channel\/(.*?)<\/uri>/) || [])[1];
    
    if (!videoId || !title || !published) continue;
    
    const publishedAt = new Date(published);
    if (publishedAt <= CUTOFF_DATE) continue;
    
    if (!title.toLowerCase().includes('official')) continue;
    
    videos.push({
      videoId,
      title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
      url: `https://www.youtube.com/watch?v=${videoId}`,
      publishedAt: publishedAt.toISOString(),
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      channelTitle,
      artist,
      channelId
    });
  }
  
  return videos;
}

async function syncOfficialVideos() {
  console.log('[sync] Starting official videos sync...');
  const channelMap = readCsvChannels();
  const channelIds = Array.from(channelMap.keys());
  const BATCH_SIZE = 10;
  const allVideos = new Map();
  
  for (let i = 0; i < channelIds.length; i += BATCH_SIZE) {
    const batch = channelIds.slice(i, i + BATCH_SIZE);
    console.log(`[sync] Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(channelIds.length/BATCH_SIZE)}`);
    
    const results = await Promise.allSettled(
      batch.map(async (channelId) => {
        try {
          const xml = await fetchChannelFeedXml(channelId);
          const videos = extractVideosFromFeed(xml, channelMap.get(channelId));
          return videos;
        } catch (err) {
          console.warn(`[sync] Error for channel ${channelId}: ${err.message}`);
          return [];
        }
      })
    );
    
    for (const result of results) {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        for (const video of result.value) {
          allVideos.set(video.videoId, video);
        }
      }
    }
  }
  
  const videos = Array.from(allVideos.values())
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  
  ensureDataDir();
  const payload = {
    lastSyncAt: new Date().toISOString(),
    cutoffDate: CUTOFF_ISO,
    totalChannels: channelIds.length,
    totalVideos: videos.length,
    videos
  };
  
  fs.writeFileSync(DATA_PATH, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`[sync] Completed: ${videos.length} videos from ${channelIds.length} channels`);
  
  return payload;
}

// API Routes
app.get('/api/official-videos', (req, res) => {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      return res.json({
        lastSyncAt: null,
        cutoffDate: CUTOFF_ISO,
        totalChannels: 0,
        totalVideos: 0,
        videos: []
      });
    }
    
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    res.json(data);
  } catch (err) {
    console.error('[api] Error reading videos:', err);
    res.status(500).json({ error: 'Failed to load videos' });
  }
});

app.post('/api/official-videos/sync', async (req, res) => {
  try {
    const data = await syncOfficialVideos();
    res.json(data);
  } catch (err) {
    console.error('[api] Sync error:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Schedule daily sync at 3:30 AM
cron.schedule('30 3 * * *', () => {
  console.log('[cron] Starting scheduled sync...');
  syncOfficialVideos().catch(err => {
    console.error('[cron] Scheduled sync failed:', err);
  });
});

// Initial sync on startup if no data exists
if (!fs.existsSync(DATA_PATH)) {
  console.log('[startup] No data found, performing initial sync...');
  syncOfficialVideos().catch(err => {
    console.error('[startup] Initial sync failed:', err);
  });
}

app.listen(PORT, () => {
  console.log(`[server] CountryMusicHUB server running on port ${PORT}`);
});
