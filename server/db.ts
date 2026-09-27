import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  avatar: string;
  country?: string;
  country_code?: string;
  country_flag?: string;
  joined_at: string;
}

export interface Video {
  id: string;
  user_id?: string;
  provider: string;
  external_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  embed_url: string;
  duration: string;
  category: string;
  channel: string;
  country?: string;
  country_code?: string;
  country_flag?: string;
  tags: string[];
  status: 'published' | 'hidden';
  is_featured: boolean;
  is_trending: boolean;
  is_recommended: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Provider {
  id: string;
  name: string;
  slug: string;
  status: 'connected' | 'disconnected';
  api_url: string;
  api_key: string;
  rate_limit: number;
  configuration: Record<string, any>;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  video_id: string;
  created_at: string;
}

export interface WatchHistory {
  id: string;
  user_id: string;
  video_id: string;
  progress: number; // percentage or seconds
  watched_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string;
  video_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SiteSettings {
  site_name: string;
  logo: string;
  accent_color: string;
  homepage_title: string;
  homepage_description: string;
  default_results_per_page: number;
  enable_registration: boolean;
  enable_favorites: boolean;
  enable_history: boolean;
  enable_comments: boolean;
  maintenance_mode: boolean;
}

export interface DBData {
  users: User[];
  videos: Video[];
  categories: Category[];
  providers: Provider[];
  favorites: Favorite[];
  watch_history: WatchHistory[];
  playlists: Playlist[];
  admin_logs: AdminLog[];
  site_settings: SiteSettings;
  comments: any[];
  deleted_video_ids?: string[];
}

const DATA_FILE = path.join(process.cwd(), 'server', 'data.json');

// Default initial data
const INITIAL_DATA: DBData = {
  comments: [],
  site_settings: {
    site_name: 'ZoneTube',
    logo: 'ZoneTube',
    accent_color: '#E50914',
    homepage_title: 'Watch the videos you love.',
    homepage_description: 'Stream trending, popular, and high quality videos in 4K.',
    default_results_per_page: 20,
    enable_registration: true,
    enable_favorites: true,
    enable_history: true,
    enable_comments: true,
    maintenance_mode: false,
  },
  users: [
    {
      id: 'usr_admin_001',
      name: 'Administrator',
      email: 'admin@zonetube.com',
      password_hash: '$2a$10$wI5Q23J0Hn8b9T8Sj3i1aO.N5Y8a3a3a3a3a3a3a3a3a3a3a3a3a', // prehashed fallback
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      joined_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'usr_john_002',
      name: 'John Doe',
      email: 'john@example.com',
      password_hash: '$2a$10$wI5Q23J0Hn8b9T8Sj3i1aO.N5Y8a3a3a3a3a3a3a3a3a3a3a3a3a',
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      joined_at: '2026-02-15T12:00:00.000Z',
    },
  ],
  categories: [
    { id: 'cat_ebony', name: 'Ebony', slug: 'ebony', description: 'Exclusive Ebony streams, glamour, and beauty showcases.', image_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80', status: 'active', created_at: '2026-01-01T00:00:00Z' },
    { id: 'cat_1', name: 'Travel', slug: 'travel', description: 'Explore scenic places and travel guides.', image_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80', status: 'active', created_at: '2026-01-01T00:00:00Z' },
    { id: 'cat_2', name: 'Music', slug: 'music', description: 'New music mixes, concerts, and live performances.', image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80', status: 'active', created_at: '2026-01-01T00:00:00Z' },
    { id: 'cat_3', name: 'Technology', slug: 'technology', description: 'Tech reviews, tutorials, AI and gadget news.', image_url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=600&q=80', status: 'active', created_at: '2026-01-01T00:00:00Z' },
    { id: 'cat_4', name: 'Sports', slug: 'sports', description: 'Match highlights, workouts, and sports news.', image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80', status: 'active', created_at: '2026-01-01T00:00:00Z' },
    { id: 'cat_5', name: 'Food', slug: 'food', description: 'Delicious recipes, cooking tutorials, and street food.', image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', status: 'active', created_at: '2026-01-01T00:00:00Z' },
    { id: 'cat_6', name: 'Education', slug: 'education', description: 'Science, history, skills, and educational lessons.', image_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80', status: 'active', created_at: '2026-01-01T00:00:00Z' },
    { id: 'cat_7', name: 'Comedy', slug: 'comedy', description: 'Skits, standup comedy, and hilarious moments.', image_url: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=600&q=80', status: 'active', created_at: '2026-01-01T00:00:00Z' },
    { id: 'cat_8', name: 'Nature', slug: 'nature', description: 'Documentaries, wildlife, and 4K nature streams.', image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80', status: 'active', created_at: '2026-01-01T00:00:00Z' },
  ],
  providers: [
    {
      id: 'prov_yt_01',
      name: 'YouTube',
      slug: 'youtube',
      status: 'connected',
      api_url: 'https://www.googleapis.com/youtube/v3',
      api_key: process.env.YOUTUBE_API_KEY || '',
      rate_limit: 10000,
      configuration: { allow_embeds: true, search_enabled: true },
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'prov_pexels_02',
      name: 'Authorized Video Provider',
      slug: 'authorized_provider',
      status: 'connected',
      api_url: 'https://api.pexels.com/videos',
      api_key: '',
      rate_limit: 5000,
      configuration: { allow_embeds: true, search_enabled: true },
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'prov_xv_03',
      name: 'XVideos API',
      slug: 'xvideos',
      status: 'connected',
      api_url: 'https://www.xvideos.com/api/videofeed/v2/',
      api_key: '',
      rate_limit: 10000,
      configuration: { allow_embeds: true, search_enabled: true },
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
  videos: [],
  favorites: [],
  watch_history: [],
  playlists: [
    {
      id: 'pl_001',
      user_id: 'usr_john_002',
      name: 'My Favorite Travel Streams',
      description: 'Collection of breathtaking travel videos and island guides.',
      video_ids: ['vid_001', 'vid_002', 'vid_007'],
      created_at: '2026-09-23T12:00:00Z',
      updated_at: '2026-09-23T12:00:00Z',
    },
  ],
  admin_logs: [
    { id: 'log_01', admin_id: 'usr_admin_001', admin_name: 'Administrator', action: 'import_videos', target_type: 'video', target_id: 'vid_001', metadata: { count: 1, provider: 'youtube' }, created_at: '2026-09-20T10:00:00Z' },
    { id: 'log_02', admin_id: 'usr_admin_001', admin_name: 'Administrator', action: 'update_settings', target_type: 'site_settings', target_id: 'global', metadata: { updated: ['accent_color'] }, created_at: '2026-09-21T12:00:00Z' },
  ],
};

class Database {
  private data: DBData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DBData {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.playlists) parsed.playlists = [];
        return parsed;
      }
    } catch (err) {
      console.error('Error reading DB data file, using initial data:', err);
    }

    // Save initial data
    this.saveData(INITIAL_DATA);
    return INITIAL_DATA;
  }

  public saveData(data?: DBData): void {
    if (data) this.data = data;
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving DB data file:', err);
    }
  }

  public get<K extends keyof DBData>(key: K): DBData[K] {
    return this.data[key];
  }

  public update<K extends keyof DBData>(key: K, value: DBData[K]): void {
    this.data[key] = value;
    this.saveData();
  }
}

export const db = new Database();
