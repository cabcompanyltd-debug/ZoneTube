export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'visitor' | 'user';
  avatar?: string;
  country?: string;
  country_code?: string;
  country_flag?: string;
  joined_at: string;
}

export interface Video {
  id: string;
  provider: string;
  external_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  embed_url: string;
  video_url?: string;
  duration: string;
  category: string;
  channel: string;
  country?: string;
  country_code?: string;
  country_flag?: string;
  tags?: string[];
  status: 'published' | 'hidden';
  is_featured: boolean;
  is_trending: boolean;
  is_recommended: boolean;
  view_count: number;
  views?: number;
  likes?: number;
  dislikes?: number;
  rating?: number;
  user_id?: string;
  uploader?: string;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  icon?: string;
  video_count?: number;
  count?: number;
  status?: 'active' | 'inactive';
  created_at?: string;
}

export interface Provider {
  id: string;
  name: string;
  slug: string;
  status: 'connected' | 'disconnected';
  api_url: string;
  api_key?: string;
  rate_limit?: number;
  configuration?: Record<string, any>;
  created_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string;
  video_ids: string[];
  created_at: string;
  updated_at: string;
  videos?: Video[];
}

export interface WatchHistoryItem {
  id: string;
  user_id: string;
  video_id: string;
  progress: number;
  watched_at: string;
  video: Video;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export type ThemeMode = 'dark' | 'light' | 'cyber' | 'emerald';

export interface SiteSettings {
  site_name: string;
  logo: string;
  accent_color: string;
  default_theme_mode?: ThemeMode;
  homepage_title: string;
  homepage_description: string;
  default_results_per_page: number;
  enable_registration: boolean;
  enable_favorites: boolean;
  enable_history: boolean;
  enable_comments: boolean;
  maintenance_mode: boolean;
  banner_ad_image?: string;
  banner_ad_link?: string;
  banner_ad_title?: string;
  banner_ad_code?: string;
}

export interface SearchResultItem {
  external_id: string;
  provider: string;
  title: string;
  description: string;
  thumbnail_url: string;
  embed_url: string;
  duration: string;
  channel: string;
  category: string;
  published_at?: string;
  already_imported?: boolean;
  is_deleted?: boolean;
}

export interface SearchFilterParams {
  search?: string;
  category?: string;
  provider?: string;
  channel?: string;
  duration?: 'all' | 'short' | 'medium' | 'long';
  date?: 'all' | 'hour' | 'today' | 'week' | 'month' | 'year';
  sort?: 'newest' | 'oldest' | 'popular' | 'title';
  limit?: number;
  page?: number;
}
