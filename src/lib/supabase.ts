import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content?: string;
  image_url?: string;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface CountryChartEntry {
  id: string;
  position: number;
  title: string;
  artist: string;
  chart_date: string;
  created_at: string;
  updated_at: string;
}

export interface CountryNewsItem {
  id: string;
  title: string;
  link: string;
  pub_date: string;
  description: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface YouTubeChannel {
  id: string;
  artist: string;
  youtube_url: string;
  channel_id: string;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  title: string;
  artist: string;
  youtube_id: string;
  thumbnail_url?: string;
  duration?: string;
  created_at: string;
  updated_at: string;
}

export interface Top30Entry {
  id: string;
  rank: number;
  title: string;
  artist: string;
  apple_music_url?: string;
  chart_date: string;
  created_at: string;
  updated_at: string;
}