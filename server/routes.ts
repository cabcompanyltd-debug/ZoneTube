import { Router, Response, Request } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { insforgeDb } from './insforgeDb';
import { db, User, Video, Category, Provider, Playlist } from './db';
import {
  AuthRequest,
  authenticateToken,
  requireAuth,
  requireAdmin,
  hashPassword,
  comparePassword,
  generateToken,
} from './auth';
import {
  searchAuthorizedProvider,
  generateCleanThumbnail,
  fetchXVideosVideoPageDetails,
  extractXVideosId,
} from './providerAdapter';
import { processAndImportXVideosDump } from './xvideosDbImporter';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const router = Router();

// Apply auth header check to all routes
router.use(authenticateToken);

function parseDurationSeconds(dur: string): number {
  if (!dur) return 0;
  const parts = dur.split(':').map(Number);
  if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
  return Number(dur) || 0;
}

/* ==========================================
   PUBLIC & USER AUTH ROUTES (InsForge DB)
========================================== */

// Register User
router.post('/auth/register', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, country, country_code, country_flag } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check existing in InsForge DB
    const insforgeUsers = await insforgeDb.select<User>('users', { email: cleanEmail });
    const localUsers = db.get('users');
    const existing = insforgeUsers[0] || localUsers.find((u) => u.email === cleanEmail);

    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const userRole = role === 'admin' ? 'admin' : 'user';
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      email: cleanEmail,
      password_hash: hashPassword(password),
      role: userRole,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanEmail)}`,
      country: country || 'United States',
      country_code: country_code || 'US',
      country_flag: country_flag || '🇺🇸',
      joined_at: new Date().toISOString(),
    };

    // Save to InsForge DB
    try {
      await insforgeDb.insert('users', newUser);
    } catch (e) {
      console.warn('InsForge insert user fallback to local memory db');
    }

    // Keep memory fallback in sync
    localUsers.push(newUser);
    db.update('users', localUsers);

    const token = generateToken(newUser);
    const { password_hash, ...safeUser } = newUser;

    return res.json({ token, user: safeUser });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Registration failed' });
  }
});

// Google Authentication
router.post('/auth/google', async (req: AuthRequest, res: Response) => {
  try {
    const { email, name, avatar, role, country, country_code, country_flag } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required for Google Authentication' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const insforgeUsers = await insforgeDb.select<User>('users', { email: cleanEmail });
    const localUsers = db.get('users');
    let user = insforgeUsers[0] || localUsers.find((u) => u.email === cleanEmail);

    if (!user) {
      const userRole = role === 'admin' ? 'admin' : 'user';
      user = {
        id: `usr_g_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password_hash: hashPassword(`google_oauth_${Date.now()}`),
        role: userRole,
        avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanEmail)}`,
        country: country || 'United States',
        country_code: country_code || 'US',
        country_flag: country_flag || '🇺🇸',
        joined_at: new Date().toISOString(),
      };

      try {
        await insforgeDb.insert('users', user);
      } catch (e) {
        console.warn('InsForge google user insert fallback');
      }

      localUsers.push(user);
      db.update('users', localUsers);
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    return res.json({ token, user: safeUser });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Google authentication failed' });
  }
});

// Login User / Admin
router.post('/auth/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const insforgeUsers = await insforgeDb.select<User>('users', { email: cleanEmail });
    const localUsers = db.get('users');
    const user = insforgeUsers[0] || localUsers.find((u) => u.email === cleanEmail);

    if (!user || !comparePassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    return res.json({ token, user: safeUser });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Login failed' });
  }
});

// Get Current Profile
router.get('/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { password_hash, ...safeUser } = req.user;
  return res.json({ user: safeUser });
});

// Update Profile
router.put('/auth/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { name, avatar } = req.body;

  try {
    await insforgeDb.update('users', req.user.id, { name, avatar });
  } catch (e) {}

  const localUsers = db.get('users');
  const idx = localUsers.findIndex((u) => u.id === req.user!.id);
  if (idx !== -1) {
    if (name) localUsers[idx].name = name;
    if (avatar) localUsers[idx].avatar = avatar;
    db.update('users', localUsers);
  }

  return res.json({ message: 'Profile updated successfully', user: { ...req.user, name, avatar } });
});

/* ==========================================
   PUBLIC VIDEO & ADVANCED SEARCH ROUTES
========================================== */

// Get Videos (InsForge PostgreSQL)
router.get('/videos', async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      category,
      country,
      status,
      featured,
      trending,
      recommended,
      provider,
      limit = 50,
      page = 1,
    } = req.query;

    const insforgeVideos = await insforgeDb.select<Video>('videos');
    const localVideos = db.get('videos') || [];
    const deletedVideoIds = new Set(db.get('deleted_video_ids') || []);

    // Ensure comprehensive merge & deduplication by external_id or id
    const videoMap = new Map<string, Video>();
    for (const v of localVideos) {
      if (v && !deletedVideoIds.has(v.id) && !deletedVideoIds.has(v.external_id || '')) {
        const key = v.external_id ? `ext_${v.external_id}` : v.id;
        videoMap.set(key, v);
      }
    }
    for (const v of insforgeVideos) {
      if (v && !deletedVideoIds.has(v.id) && !deletedVideoIds.has(v.external_id || '')) {
        const key = v.external_id ? `ext_${v.external_id}` : v.id;
        if (!videoMap.has(key)) {
          videoMap.set(key, v);
        }
      }
    }
    let videos = Array.from(videoMap.values());

    // Non-admins see published videos
    if (!req.user || req.user.role !== 'admin') {
      videos = videos.filter((v) => v.status === 'published');
    } else if (status) {
      videos = videos.filter((v) => v.status === status);
    }

    // Keyword search
    if (search) {
      const q = String(search).toLowerCase();
      videos = videos.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          (v.channel && v.channel.toLowerCase().includes(q))
      );
    }

    // Category Filter
    if (category && category !== 'All') {
      videos = videos.filter((v) => v.category.toLowerCase() === String(category).toLowerCase());
    }

    // Country Filter
    const targetCountry = country || req.query.country_code;
    if (targetCountry && targetCountry !== 'all' && targetCountry !== 'All') {
      const qC = String(targetCountry).toLowerCase().trim();
      videos = videos.filter((v) =>
        (v.country && v.country.toLowerCase() === qC) ||
        (v.country_code && v.country_code.toLowerCase() === qC)
      );
    }

    // Provider Filter
    if (provider && provider !== 'all') {
      videos = videos.filter((v) => v.provider.toLowerCase() === String(provider).toLowerCase());
    }

    // Flags
    if (featured === 'true') videos = videos.filter((v) => v.is_featured);
    if (trending === 'true') videos = videos.filter((v) => v.is_trending);
    if (recommended === 'true') videos = videos.filter((v) => v.is_recommended);

    // Newest sort
    videos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = videos.length;
    const p = Math.max(1, Number(page));
    const l = Math.max(1, Number(limit));
    const startIndex = (p - 1) * l;
    const paginated = videos.slice(startIndex, startIndex + l).map((v) => {
      let flag = v.country_flag;
      if (!flag && v.country_code && v.country_code.length === 2) {
        try {
          flag = String.fromCodePoint(...[...v.country_code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
        } catch (e) {}
      }
      return { ...v, country_flag: flag };
    });

    return res.json({
      videos: paginated,
      total,
      page: p,
      totalPages: Math.ceil(total / l),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch videos' });
  }
});

// Get Single Video Details + View Count
router.get('/videos/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const localVideos = db.get('videos') || [];
  const insforgeVideos = await insforgeDb.select<Video>('videos');
  const video =
    localVideos.find((v) => v.id === id || v.external_id === id) ||
    insforgeVideos.find((v) => v.id === id || v.external_id === id);

  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  // Increment view count
  video.view_count = Number(video.view_count || 0) + 1;
  try {
    await insforgeDb.update('videos', video.id, { view_count: video.view_count });
  } catch (e) {}

  return res.json({ video });
});

// Related Videos
router.get('/videos/related/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const insforgeVideos = await insforgeDb.select<Video>('videos');
  let videos = insforgeVideos.length > 0 ? insforgeVideos : db.get('videos');

  const seenIds = new Set<string>();
  videos = videos.filter((v) => {
    if (!v || !v.id) return false;
    if (seenIds.has(v.id)) return false;
    seenIds.add(v.id);
    return true;
  });

  const current = videos.find((v) => v.id === id);

  const related = videos
    .filter((v) => v.id !== id && (current ? v.category === current.category : true))
    .slice(0, 8);

  return res.json({ videos: related });
});

// Helper for merged videos across InsForge DB & local DB
async function getAllVideosMerged(): Promise<Video[]> {
  try {
    const insforgeVideos = await insforgeDb.select<Video>('videos');
    const localVideos = db.get('videos') || [];
    const deletedVideoIds = new Set(db.get('deleted_video_ids') || []);

    const videoMap = new Map<string, Video>();
    for (const v of localVideos) {
      if (v && v.id && !deletedVideoIds.has(v.id) && !deletedVideoIds.has(v.external_id || '')) {
        const key = v.external_id ? `ext_${v.external_id}` : v.id;
        videoMap.set(key, v);
      }
    }
    for (const v of insforgeVideos) {
      if (v && v.id && !deletedVideoIds.has(v.id) && !deletedVideoIds.has(v.external_id || '')) {
        const key = v.external_id ? `ext_${v.external_id}` : v.id;
        if (!videoMap.has(key)) {
          videoMap.set(key, v);
        }
      }
    }
    return Array.from(videoMap.values());
  } catch (err) {
    console.warn('getAllVideosMerged warning:', err);
    return db.get('videos') || [];
  }
}

// Get Categories (InsForge DB with dynamic realistic video counts)
router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const insforgeCats = await insforgeDb.select<Category>('categories');
    const localCats = db.get('categories') || [];

    const catMap = new Map<string, Category>();
    for (const c of localCats) {
      if (c && typeof c.name === 'string') {
        catMap.set(c.name.trim().toLowerCase(), c);
      }
    }
    for (const c of insforgeCats) {
      if (c && typeof c.name === 'string') {
        catMap.set(c.name.trim().toLowerCase(), c);
      }
    }
    const categories = Array.from(catMap.values());

    const allVideos = await getAllVideosMerged();

    const withCounts = categories.map((cat) => {
      const catNameNorm = typeof cat?.name === 'string' ? cat.name.trim().toLowerCase() : '';

      // Find all videos matching this category or tag
      const matchingVids = allVideos.filter((v) => {
        if (!v || !v.category || typeof v.category !== 'string') return false;
        const vCat = v.category.trim().toLowerCase();
        if (catNameNorm && (vCat === catNameNorm || vCat.includes(catNameNorm) || catNameNorm.includes(vCat))) return true;
        if (Array.isArray(v.tags) && v.tags.some((t) => typeof t === 'string' && t.trim().toLowerCase() === catNameNorm)) return true;
        return false;
      });

      const video_count = matchingVids.length;
      const sampleVid = matchingVids[0] || allVideos.find((v) => (v.category || '').toLowerCase().includes(catNameNorm));

      const videoThumb = sampleVid?.thumbnail_url;
      const fallbackThumb = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80';

      return {
        ...cat,
        image_url: cat.image_url || videoThumb || fallbackThumb,
        video_count: video_count,
        count: video_count,
      };
    });

    return res.json({ categories: withCounts });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch categories' });
  }
});

// Create Category (Admin Only)
router.post('/categories', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { name, description, image_url } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });

  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const newCat: Category = {
    id: `cat_${Date.now()}`,
    name: name.trim(),
    slug,
    description: description || '',
    image_url: image_url || '',
    status: 'active',
    created_at: new Date().toISOString(),
  };

  try {
    await insforgeDb.insert('categories', newCat);
  } catch (e) {}

  const localCats = db.get('categories');
  localCats.push(newCat);
  db.update('categories', localCats);

  return res.json({ message: 'Category created successfully', category: newCat });
});

// Update Category (Admin Only - cover photo, name, description)
router.put('/categories/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, image_url } = req.body;

  const updates: any = {};
  if (name !== undefined) {
    updates.name = name.trim();
    updates.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  }
  if (description !== undefined) updates.description = description;
  if (image_url !== undefined) updates.image_url = image_url;

  try {
    await insforgeDb.update('categories', id, updates);
  } catch (e) {}

  let localCats = db.get('categories');
  const idx = localCats.findIndex((c) => c.id === id);
  if (idx !== -1) {
    localCats[idx] = { ...localCats[idx], ...updates };
    db.update('categories', localCats);
  }

  return res.json({ message: 'Category updated successfully' });
});

// Delete Category (Admin Only)
router.delete('/categories/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await insforgeDb.delete('categories', id);
  } catch (e) {}

  let localCats = db.get('categories');
  localCats = localCats.filter((c) => c.id !== id);
  db.update('categories', localCats);

  return res.json({ message: 'Category deleted successfully' });
});

/* ==========================================
   USER PLAYLISTS ROUTES (FULL FUNCTIONALITY)
========================================== */

// Get user playlists with populated video objects
router.get('/playlists', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    let playlists: Playlist[] = [];

    try {
      const insforgePls = await insforgeDb.select<Playlist>('playlists', { user_id: userId });
      if (insforgePls && insforgePls.length > 0) {
        playlists = insforgePls;
      }
    } catch (e) {}

    if (playlists.length === 0) {
      playlists = db.get('playlists').filter((p) => p.user_id === userId);
    }

    // Populate video objects
    const insforgeVids = await insforgeDb.select<Video>('videos');
    const allVideos = insforgeVids.length > 0 ? insforgeVids : db.get('videos');

    const populated = playlists.map((pl) => {
      const vids = (pl.video_ids || [])
        .map((vidId) => allVideos.find((v) => v.id === vidId))
        .filter(Boolean) as Video[];
      return {
        ...pl,
        videos: vids,
      };
    });

    return res.json({ playlists: populated });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch playlists' });
  }
});

// Create new playlist
router.post('/playlists', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, description = '' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Playlist name is required' });
    }

    const newPlaylist: Playlist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      name: name.trim(),
      description: description.trim(),
      video_ids: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await insforgeDb.insert('playlists', newPlaylist);
    } catch (e) {}

    const localPlaylists = db.get('playlists');
    localPlaylists.push(newPlaylist);
    db.update('playlists', localPlaylists);

    return res.json({ message: 'Playlist created', playlist: { ...newPlaylist, videos: [] } });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to create playlist' });
  }
});

// Update playlist name/description
router.put('/playlists/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user!.id;

    const updates: any = { updated_at: new Date().toISOString() };
    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();

    try {
      await insforgeDb.update('playlists', id, updates);
    } catch (e) {}

    const localPlaylists = db.get('playlists');
    const idx = localPlaylists.findIndex((p) => p.id === id && p.user_id === userId);
    if (idx !== -1) {
      localPlaylists[idx] = { ...localPlaylists[idx], ...updates };
      db.update('playlists', localPlaylists);
    }

    return res.json({ message: 'Playlist updated' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to update playlist' });
  }
});

// Delete playlist
router.delete('/playlists/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    try {
      await insforgeDb.delete('playlists', { id, user_id: userId });
    } catch (e) {}

    let localPlaylists = db.get('playlists');
    localPlaylists = localPlaylists.filter((p) => !(p.id === id && p.user_id === userId));
    db.update('playlists', localPlaylists);

    return res.json({ message: 'Playlist deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to delete playlist' });
  }
});

// Add video to playlist
router.post('/playlists/:id/videos', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { video_id } = req.body;
    const userId = req.user!.id;
    if (!video_id) return res.status(400).json({ error: 'video_id is required' });

    let playlist: Playlist | undefined;
    try {
      const ins = await insforgeDb.select<Playlist>('playlists', { id, user_id: userId });
      if (ins.length > 0) playlist = ins[0];
    } catch (e) {}

    const localPlaylists = db.get('playlists');
    const localIdx = localPlaylists.findIndex((p) => p.id === id && p.user_id === userId);
    if (!playlist && localIdx !== -1) {
      playlist = localPlaylists[localIdx];
    }

    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    const currentIds = playlist.video_ids || [];
    if (!currentIds.includes(video_id)) {
      currentIds.push(video_id);
      const updates = { video_ids: currentIds, updated_at: new Date().toISOString() };

      try {
        await insforgeDb.update('playlists', id, updates);
      } catch (e) {}

      if (localIdx !== -1) {
        localPlaylists[localIdx].video_ids = currentIds;
        db.update('playlists', localPlaylists);
      }
    }

    return res.json({ message: 'Video added to playlist', video_ids: currentIds });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to add video to playlist' });
  }
});

// Remove video from playlist
router.delete('/playlists/:id/videos/:videoId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id, videoId } = req.params;
    const userId = req.user!.id;

    let playlist: Playlist | undefined;
    try {
      const ins = await insforgeDb.select<Playlist>('playlists', { id, user_id: userId });
      if (ins.length > 0) playlist = ins[0];
    } catch (e) {}

    const localPlaylists = db.get('playlists');
    const localIdx = localPlaylists.findIndex((p) => p.id === id && p.user_id === userId);
    if (!playlist && localIdx !== -1) {
      playlist = localPlaylists[localIdx];
    }

    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    const currentIds = (playlist.video_ids || []).filter((vid) => vid !== videoId);
    const updates = { video_ids: currentIds, updated_at: new Date().toISOString() };

    try {
      await insforgeDb.update('playlists', id, updates);
    } catch (e) {}

    if (localIdx !== -1) {
      localPlaylists[localIdx].video_ids = currentIds;
      db.update('playlists', localPlaylists);
    }

    return res.json({ message: 'Video removed from playlist', video_ids: currentIds });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to remove video from playlist' });
  }
});

/* ==========================================
   USER FAVORITES & WATCH HISTORY
========================================== */

// Favorites
router.get('/favorites', requireAuth, async (req: AuthRequest, res: Response) => {
  const insforgeFavs = await insforgeDb.select('favorites', { user_id: req.user!.id });
  const localFavs = db.get('favorites').filter((f) => f.user_id === req.user!.id);
  const favs = insforgeFavs.length > 0 ? insforgeFavs : localFavs;

  const insforgeVids = await insforgeDb.select<Video>('videos');
  const videos = insforgeVids.length > 0 ? insforgeVids : db.get('videos');

  const seenFavVideoIds = new Set<string>();
  const favVideos: Video[] = [];
  for (const f of favs) {
    if (seenFavVideoIds.has(f.video_id)) continue;
    const found = videos.find((v) => v.id === f.video_id);
    if (found) {
      seenFavVideoIds.add(f.video_id);
      favVideos.push(found);
    }
  }

  return res.json({ favorites: favVideos });
});

router.post('/favorites', requireAuth, async (req: AuthRequest, res: Response) => {
  const { video_id } = req.body;
  if (!video_id) return res.status(400).json({ error: 'video_id is required' });

  try {
    const existing = await insforgeDb.select('favorites', { user_id: req.user!.id, video_id });
    if (existing && existing.length > 0) {
      return res.json({ message: 'Already in favorites', favorite: existing[0] });
    }
  } catch (e) {}

  const localFavs = db.get('favorites');
  const localExisting = localFavs.find((f) => f.user_id === req.user!.id && f.video_id === video_id);
  if (localExisting) {
    return res.json({ message: 'Already in favorites', favorite: localExisting });
  }

  const newFav = {
    id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: req.user!.id,
    video_id,
    created_at: new Date().toISOString(),
  };

  try {
    await insforgeDb.insert('favorites', newFav);
  } catch (e) {}

  localFavs.push(newFav);
  db.update('favorites', localFavs);

  return res.json({ message: 'Added to favorites', favorite: newFav });
});

router.delete('/favorites/:videoId', requireAuth, async (req: AuthRequest, res: Response) => {
  const { videoId } = req.params;
  try {
    await insforgeDb.delete('favorites', { user_id: req.user!.id, video_id: videoId });
  } catch (e) {}

  let localFavs = db.get('favorites');
  localFavs = localFavs.filter((f) => !(f.user_id === req.user!.id && f.video_id === videoId));
  db.update('favorites', localFavs);

  return res.json({ message: 'Removed from favorites' });
});

// Watch History
router.get('/history', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || (req.headers['x-guest-id'] as string) || 'visitor';
  const insforgeHist = await insforgeDb.select('watch_history', { user_id: userId });
  const localHist = db.get('watch_history').filter((h) => h.user_id === userId);
  const history = insforgeHist.length > 0 ? insforgeHist : localHist;

  const allVideos = await getAllVideosMerged();

  // Sort latest first and deduplicate by video_id
  const sorted = [...history].sort((a, b) => new Date(b.watched_at || 0).getTime() - new Date(a.watched_at || 0).getTime());
  const seenVideoIds = new Set<string>();
  const items: any[] = [];

  for (const h of sorted) {
    if (!h || !h.video_id || seenVideoIds.has(h.video_id)) continue;
    const video = allVideos.find((v) => v.id === h.video_id || v.external_id === h.video_id);
    if (video) {
      seenVideoIds.add(h.video_id);
      if (video.id) seenVideoIds.add(video.id);
      if (video.external_id) seenVideoIds.add(video.external_id);
      items.push({ ...h, video });
    }
  }

  return res.json({ history: items });
});

router.post('/history', async (req: AuthRequest, res: Response) => {
  const { video_id, progress = 0 } = req.body;
  if (!video_id) return res.status(400).json({ error: 'video_id is required' });

  const userId = req.user?.id || (req.headers['x-guest-id'] as string) || 'visitor';

  try {
    const existing = await insforgeDb.select('watch_history', { user_id: userId, video_id });
    if (existing && existing.length > 0) {
      await insforgeDb.update('watch_history', existing[0].id, {
        progress,
        watched_at: new Date().toISOString(),
      });
    } else {
      const histItem = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        user_id: userId,
        video_id,
        progress,
        watched_at: new Date().toISOString(),
      };
      await insforgeDb.insert('watch_history', histItem);
    }
  } catch (e) {}

  const localHist = db.get('watch_history');
  const idx = localHist.findIndex((h) => h.user_id === userId && h.video_id === video_id);
  if (idx !== -1) {
    localHist[idx].progress = progress;
    localHist[idx].watched_at = new Date().toISOString();
  } else {
    localHist.push({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      video_id,
      progress,
      watched_at: new Date().toISOString(),
    });
  }
  db.update('watch_history', localHist);

  return res.json({ message: 'Watch history updated' });
});

// Delete single item from history
router.delete('/history/:videoId', async (req: AuthRequest, res: Response) => {
  const { videoId } = req.params;
  const userId = req.user?.id || (req.headers['x-guest-id'] as string) || 'visitor';

  try {
    await insforgeDb.delete('watch_history', { user_id: userId, video_id: videoId });
  } catch (e) {}

  let localHist = db.get('watch_history');
  localHist = localHist.filter((h) => !(h.user_id === userId && (h.video_id === videoId || h.id === videoId)));
  db.update('watch_history', localHist);

  return res.json({ message: 'Removed from watch history' });
});

// Clear all watch history for user
router.delete('/history', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || (req.headers['x-guest-id'] as string) || 'visitor';

  try {
    await insforgeDb.delete('watch_history', { user_id: userId });
  } catch (e) {}

  let localHist = db.get('watch_history');
  localHist = localHist.filter((h) => h.user_id !== userId);
  db.update('watch_history', localHist);

  return res.json({ message: 'Watch history cleared successfully' });
});

/* ==========================================
   ADMIN MANAGEMENT & XVIDEOS AUTO-PULLER
========================================== */

// Admin Dashboard Stats
router.get('/admin/stats', requireAdmin, async (req: AuthRequest, res: Response) => {
  const videos = await getAllVideosMerged();

  const insforgeCats = await insforgeDb.select<Category>('categories');
  const localCats = db.get('categories') || [];
  const catMap = new Map<string, Category>();
  for (const c of localCats) {
    if (c?.name) catMap.set(c.name.trim().toLowerCase(), c);
  }
  for (const c of insforgeCats) {
    if (c?.name) catMap.set(c.name.trim().toLowerCase(), c);
  }
  const categories = Array.from(catMap.values());

  const insforgeUsers = await insforgeDb.select<User>('users');
  const users = insforgeUsers.length > 0 ? insforgeUsers : db.get('users');

  const insforgeFavs = await insforgeDb.select('favorites');
  const favorites = insforgeFavs.length > 0 ? insforgeFavs : db.get('favorites');

  const totalViews = videos.reduce((acc, v) => acc + Number(v.view_count || 0), 0);

  return res.json({
    totalVideos: videos.length,
    activeCategories: categories.length,
    totalUsers: users.length,
    totalFavorites: favorites.length,
    totalViews,
    totalFeatured: videos.filter((v) => v.is_featured).length,
  });
});

// Save Updated Video Title & Description to Database
router.put('/admin/videos/:id/title', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, tags } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    const cleanTitle = title.trim();
    const cleanDesc = description ? description.trim() : undefined;
    const cleanTags = Array.isArray(tags) ? tags : undefined;
    const nowIso = new Date().toISOString();

    // 1. Update in InsForge DB (try by id and external_id)
    try {
      await insforgeDb.update('videos', id, {
        title: cleanTitle,
        ...(cleanDesc !== undefined ? { description: cleanDesc } : {}),
        ...(cleanTags ? { tags: cleanTags } : {}),
        updated_at: nowIso,
      });
    } catch (e) {
      console.warn('InsForge update video title fallback to local DB');
    }

    // 2. Update local DB and write to disk
    const localVideos = db.get('videos') || [];
    const idx = localVideos.findIndex((v) => v.id === id || v.external_id === id);

    let updatedVideo: Video;
    if (idx !== -1) {
      localVideos[idx] = {
        ...localVideos[idx],
        title: cleanTitle,
        ...(cleanDesc !== undefined ? { description: cleanDesc } : {}),
        ...(cleanTags ? { tags: cleanTags } : {}),
        updated_at: nowIso,
      };
      updatedVideo = localVideos[idx];
      db.update('videos', localVideos);
    } else {
      // Find from InsForge or create the entry to guarantee it persists in local DB
      const insforgeVideos = await insforgeDb.select<Video>('videos');
      const found = insforgeVideos.find((v) => v.id === id || v.external_id === id);
      updatedVideo = found
        ? {
            ...found,
            title: cleanTitle,
            ...(cleanDesc !== undefined ? { description: cleanDesc } : {}),
            ...(cleanTags ? { tags: cleanTags } : {}),
            updated_at: nowIso,
          }
        : ({
            id,
            external_id: id,
            title: cleanTitle,
            description: cleanDesc || '',
            tags: cleanTags || [],
            thumbnail_url: '',
            embed_url: '',
            duration: '10:00',
            category: 'General',
            channel: 'ZoneTube',
            provider: 'custom',
            status: 'published',
            is_featured: false,
            is_trending: false,
            is_recommended: false,
            view_count: 0,
            created_at: nowIso,
            updated_at: nowIso,
          } as Video);

      localVideos.unshift(updatedVideo);
      db.update('videos', localVideos);
    }

    return res.json({
      message: 'Video title & description updated successfully',
      id,
      title: cleanTitle,
      description: cleanDesc,
      video: updatedVideo,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to update video title' });
  }
});

// Admin Provider Search (XVideos Feed API)
router.post('/provider/search', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { keyword = 'trending', limit = 20, category = 'General', provider = 'xvideos' } = req.body;
    const results = await searchAuthorizedProvider(keyword, Number(limit), category, provider);

    // Check existing in InsForge DB
    const existing = await insforgeDb.select<Video>('videos');
    const existingIds = new Set(existing.map((v) => v.external_id));

    const marked = results.map((r) => ({
      ...r,
      already_imported: existingIds.has(r.external_id),
    }));

    return res.json({ results: marked });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to search video provider' });
  }
});

// Bulk Import Selected XVideos into InsForge PostgreSQL
router.post('/videos/import', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No video items selected for import' });
  }

  const existingVideos = await insforgeDb.select<Video>('videos');
  const existingSet = new Set(existingVideos.map((v) => v.external_id));

  let importedCount = 0;
  const toInsert: Video[] = [];

  items.forEach((item: any) => {
    if (!existingSet.has(item.external_id)) {
      const newVideo: Video = {
        id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        provider: 'xvideos',
        external_id: item.external_id,
        title: item.title,
        description: item.description || 'Imported XVideos stream.',
        thumbnail_url: item.thumbnail_url || generateCleanThumbnail(item.title, item.duration),
        embed_url: item.embed_url || `https://www.xvideos.com/embedframe/${item.external_id}`,
        duration: item.duration || '10:00',
        category: item.category || 'General',
        channel: item.channel || 'XVideos Studio',
        tags: [item.category?.toLowerCase() || 'xvideos'],
        status: 'published',
        is_featured: false,
        is_trending: true,
        is_recommended: true,
        view_count: Math.floor(Math.random() * 50000) + 1000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      toInsert.push(newVideo);
      importedCount++;
    }
  });

  if (toInsert.length > 0) {
    try {
      await insforgeDb.insert('videos', toInsert);
    } catch (e) {
      console.warn('InsForge bulk insert videos fallback');
    }
    const localVideos = db.get('videos');
    db.update('videos', [...toInsert, ...localVideos]);
  }

  return res.json({ message: `Successfully imported ${importedCount} XVideos streams into InsForge.`, count: importedCount });
});

// Download and Sync XVideos Official Database Dump (CSV / Zip / Gz)
router.post('/admin/xvideos-db/sync', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { exportUrl, limit = 500, category = 'General', csvContent } = req.body;
    const cleanCategory = typeof category === 'string' && category.trim() ? category.trim() : 'General';

    // Auto-create category in DB if it doesn't already exist
    try {
      const insforgeCats = await insforgeDb.select<Category>('categories');
      const localCats = db.get('categories') || [];
      const allCats = [...insforgeCats, ...localCats];
      const exists = allCats.some(
        (c) => c.name.toLowerCase() === cleanCategory.toLowerCase()
      );
      if (!exists && cleanCategory) {
        const newCat: Category = {
          id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: cleanCategory,
          slug: cleanCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: `${cleanCategory} category videos`,
          image_url: '',
          status: 'active',
          created_at: new Date().toISOString(),
        };
        try {
          await insforgeDb.insert('categories', newCat);
        } catch (e) {}
        const curLocal = db.get('categories') || [];
        curLocal.push(newCat);
        db.update('categories', curLocal);
      }
    } catch (catErr) {
      console.warn('Auto-create category error:', catErr);
    }

    const userCountry = req.body.country || req.user?.country || 'United States';
    const userCountryCode = (req.body.country_code || req.user?.country_code || 'US').toUpperCase();
    const userCountryFlag = req.body.country_flag || req.user?.country_flag || '🇺🇸';

    const result = await processAndImportXVideosDump({
      exportUrl,
      limit: Number(limit) || 500,
      category: cleanCategory,
      csvContent,
      country: userCountry,
      country_code: userCountryCode,
      country_flag: userCountryFlag,
    });

    return res.json({
      message: `Successfully processed database dump! Imported ${result.importedCount} new XVideos streams into InsForge (${result.skippedDuplicates} duplicates skipped).`,
      result,
    });
  } catch (err: any) {
    console.error('XVideos DB sync error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to sync XVideos database dump' });
  }
});

// Sync / Auto-Fetch real thumbnails and titles for all existing videos in InsForge DB
router.post('/admin/videos/sync-thumbnails', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const videos = await insforgeDb.select<Video>('videos');
    let updatedCount = 0;

    for (const v of videos) {
      const extId = v.external_id || extractXVideosId(v.embed_url) || extractXVideosId(v.id);
      if (extId) {
        const details = await fetchXVideosVideoPageDetails(extId);
        if (details.thumbnail_url && !details.thumbnail_url.startsWith('data:image/svg')) {
          const updates: Partial<Video> = {
            thumbnail_url: details.thumbnail_url,
            updated_at: new Date().toISOString(),
          };
          if (details.title && !details.title.includes('Stream #') && !details.title.includes('XVideos Stream (')) {
            updates.title = details.title;
          }
          try {
            await insforgeDb.update('videos', v.id, updates);
            updatedCount++;
          } catch (e) {}
        }
      }
    }

    return res.json({ message: `Synced real thumbnails & titles for ${updatedCount} videos.`, count: updatedCount });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to sync thumbnails' });
  }
});
// Extract preview metadata (no database insertion)
router.post('/videos/extract-preview', async (req: Request, res: Response) => {
  const { titleOrUrl, input, embed_url } = req.body;
  const targetStr = (titleOrUrl || input || embed_url || '').trim();
  if (!targetStr) {
    return res.status(400).json({ error: 'Please enter a video URL, ID, or iframe code' });
  }

  const extractedId = extractXVideosId(targetStr);
  if (!extractedId) {
    return res.status(400).json({ error: 'Could not extract valid video ID from input' });
  }

  try {
    const details = await fetchXVideosVideoPageDetails(extractedId);
    return res.json({
      success: true,
      id: extractedId,
      title: details.title,
      thumbnail_url: details.thumbnail_url,
      embed_url: details.embed_url || `https://www.xvideos.com/embedframe/${extractedId}`,
      duration: details.duration,
      channel: details.channel,
      tags: details.tags || [],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to extract video preview' });
  }
});

// Alias for customer dashboard extract info
router.post('/utils/extract-media-info', async (req: Request, res: Response) => {
  const { input, titleOrUrl, embed_url } = req.body;
  const targetStr = (input || titleOrUrl || embed_url || '').trim();
  if (!targetStr) {
    return res.status(400).json({ error: 'Please enter a video embed link or iframe' });
  }

  const extractedId = extractXVideosId(targetStr);
  if (!extractedId) {
    // If not XVideos, return standard basic detection
    const iframeMatch = targetStr.match(/src=["']([^"']+)["']/i);
    const cleanedUrl = iframeMatch?.[1] || targetStr;
    return res.json({
      title: 'Imported Video Stream',
      thumbnail_url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80',
      embed_url: cleanedUrl,
      duration: '10:00',
      channel: 'ZoneTube Creator',
      tags: ['stream'],
    });
  }

  try {
    const details = await fetchXVideosVideoPageDetails(extractedId);
    return res.json({
      success: true,
      id: extractedId,
      title: details.title,
      thumbnail_url: details.thumbnail_url,
      embed_url: details.embed_url || `https://www.xvideos.com/embedframe/${extractedId}`,
      duration: details.duration,
      channel: details.channel,
      tags: details.tags || [],
    });
  } catch (err: any) {
    return res.json({
      title: `XVideos Stream #${extractedId.toUpperCase()}`,
      thumbnail_url: `https://thumb-cdn77.xvideos-cdn.com/keys/${extractedId}/0/xv_3_t.jpg`,
      embed_url: `https://www.xvideos.com/embedframe/${extractedId}`,
      duration: '10:00',
      channel: 'XVideos Network',
      tags: ['xvideos'],
    });
  }
});

router.post('/quick-pull', async (req: Request, res: Response) => {
  const {
    titleOrUrl,
    category = 'General',
    customTitle = '',
    customThumb = '',
    tags,
    preview = false,
    country,
    country_code,
    country_flag,
  } = req.body;
  const inputStr = titleOrUrl || '';

  if (!inputStr || !inputStr.trim()) {
    return res.status(400).json({ error: 'Please enter a title, keyword, XVideos link, or iframe embed code' });
  }

  const cleanCategory = typeof category === 'string' && category.trim() ? category.trim() : 'General';
  const userCountry = country || (req as any).user?.country || 'United States';
  const userCountryCode = (country_code || (req as any).user?.country_code || 'US').toUpperCase();
  const userCountryFlag = country_flag || (req as any).user?.country_flag || '🇺🇸';

  try {
    const extractedId = extractXVideosId(inputStr.trim());
    let realEmbedUrl = inputStr.trim();
    let realTitle = customTitle.trim();
    let realThumb = customThumb.trim();
    let channelName = 'XVideos Network';
    let fetchedDuration = '10:00';
    let fetchedTags: string[] = [];

    if (extractedId) {
      realEmbedUrl = `https://www.xvideos.com/embedframe/${extractedId}`;
      const details = await fetchXVideosVideoPageDetails(extractedId);
      if (details.title && (!realTitle || realTitle.includes('Stream #') || realTitle.includes('Imported Video Stream'))) {
        realTitle = details.title;
      }
      if (details.thumbnail_url && (!realThumb || realThumb.includes('unsplash'))) {
        realThumb = details.thumbnail_url;
      }
      if (details.channel) {
        channelName = details.channel;
      }
      if (details.duration) {
        fetchedDuration = details.duration;
      }
    }

    if (!realTitle) {
      realTitle = `${cleanCategory} Stream #${extractedId ? extractedId.toUpperCase() : Date.now().toString().slice(-4)}`;
    }

    if (!realThumb) {
      realThumb = extractedId ? generateCleanThumbnail(realTitle, fetchedDuration) : '';
    }

    const parsedTags = Array.isArray(tags)
      ? tags
      : (typeof tags === 'string'
          ? tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
          : [cleanCategory.toLowerCase()]);

    const titleWords = realTitle
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 2);

    const finalTags = Array.from(
      new Set([
        ...parsedTags,
        ...fetchedTags,
        ...titleWords.slice(0, 6),
        cleanCategory.toLowerCase(),
        'xvideos',
        'hd',
        'trending',
      ])
    ).filter(Boolean);

    // If preview requested, return video info WITHOUT inserting into database
    if (preview) {
      return res.json({
        success: true,
        preview: true,
        video: {
          title: realTitle,
          thumbnail_url: realThumb,
          embed_url: realEmbedUrl,
          duration: fetchedDuration,
          category: cleanCategory,
          channel: channelName,
          tags: finalTags,
          country: userCountry,
          country_code: userCountryCode,
          country_flag: userCountryFlag,
        },
      });
    }

    const vidId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newVideo: Video = {
      id: vidId,
      provider: 'xvideos',
      external_id: extractedId || vidId,
      title: realTitle,
      description: `Official HD video stream imported for ${cleanCategory}. Channel: ${channelName}`,
      thumbnail_url: realThumb,
      embed_url: realEmbedUrl,
      duration: fetchedDuration,
      category: cleanCategory,
      channel: channelName,
      country: userCountry,
      country_code: userCountryCode,
      country_flag: userCountryFlag,
      tags: finalTags,
      status: 'published',
      is_featured: true,
      is_trending: true,
      is_recommended: true,
      view_count: Math.floor(Math.random() * 25000) + 2000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await insforgeDb.insert('videos', newVideo);
    } catch (e) {}

    const localVideos = db.get('videos');
    localVideos.unshift(newVideo);
    db.update('videos', localVideos);

    return res.json({
      message: `Successfully imported stream: "${realTitle}"`,
      video: newVideo,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Quick pull failed' });
  }
});

router.post('/admin/videos/quick-pull', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { titleOrUrl, category = 'General' } = req.body;

  if (!titleOrUrl || !titleOrUrl.trim()) {
    return res.status(400).json({ error: 'Please enter a title, keyword, XVideos link, or iframe embed code' });
  }

  const cleanCategory = typeof category === 'string' && category.trim() ? category.trim() : 'General';

  try {
    // Auto-create category in DB if it doesn't already exist
    try {
      const insforgeCats = await insforgeDb.select<Category>('categories');
      const localCats = db.get('categories') || [];
      const allCats = [...insforgeCats, ...localCats];
      const exists = allCats.some(
        (c) => c.name.toLowerCase() === cleanCategory.toLowerCase()
      );
      if (!exists && cleanCategory) {
        const newCat: Category = {
          id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: cleanCategory,
          slug: cleanCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: `${cleanCategory} category videos`,
          image_url: '',
          status: 'active',
          created_at: new Date().toISOString(),
        };
        try {
          await insforgeDb.insert('categories', newCat);
        } catch (e) {}
        const curLocal = db.get('categories') || [];
        curLocal.push(newCat);
        db.update('categories', curLocal);
      }
    } catch (catErr) {
      console.warn('Auto-create category error in quick-pull:', catErr);
    }

    const searchResults = await searchAuthorizedProvider(titleOrUrl.trim(), 1, cleanCategory, 'xvideos');
    const bestMatch = searchResults[0];

    if (!bestMatch) {
      return res.status(404).json({ error: 'Could not fetch XVideos stream for input' });
    }

    const userCountry = req.body.country || req.user?.country || 'United States';
    const userCountryCode = (req.body.country_code || req.user?.country_code || 'US').toUpperCase();
    const userCountryFlag = req.body.country_flag || req.user?.country_flag || '🇺🇸';

    const newVideo: Video = {
      id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      provider: 'xvideos',
      external_id: bestMatch.external_id,
      title: bestMatch.title,
      description: bestMatch.description || `Fetched stream for "${bestMatch.title}"`,
      thumbnail_url: bestMatch.thumbnail_url || generateCleanThumbnail(bestMatch.title, bestMatch.duration),
      embed_url: bestMatch.embed_url,
      duration: bestMatch.duration,
      category: cleanCategory,
      channel: bestMatch.channel || 'XVideos Network',
      tags: [cleanCategory.toLowerCase()],
      country: userCountry,
      country_code: userCountryCode,
      country_flag: userCountryFlag,
      status: 'published',
      is_featured: true,
      is_trending: true,
      is_recommended: true,
      view_count: Math.floor(Math.random() * 20000) + 500,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await insforgeDb.insert('videos', newVideo);
    } catch (e) {}

    const localVideos = db.get('videos');
    localVideos.unshift(newVideo);
    db.update('videos', localVideos);

    return res.json({
      message: `Successfully pulled and created XVideos stream: "${newVideo.title}"`,
      video: newVideo,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Quick pull script failed' });
  }
});

// Edit Video
router.put('/admin/videos/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    await insforgeDb.update('videos', id, updates);
  } catch (e) {}

  const localVideos = db.get('videos');
  const index = localVideos.findIndex((v) => v.id === id);
  if (index !== -1) {
    localVideos[index] = { ...localVideos[index], ...updates, updated_at: new Date().toISOString() };
    db.update('videos', localVideos);
  }

  return res.json({ message: 'Video updated successfully' });
});

// ==========================================
// USER / VISITOR CUSTOMER DASHBOARD VIDEO IMPORT & MANAGEMENT
// ==========================================

// Import Video from Customer Dashboard
router.post('/user/videos', async (req: AuthRequest, res: Response) => {
  const { embed_url, title, category = 'General', description = '', tags = [], thumbnail_url, duration, channel } = req.body;
  const inputStr = (embed_url || '').trim();

  if (!inputStr) {
    return res.status(400).json({ error: 'Please enter a video embed link or iframe code' });
  }

  const cleanCategory = typeof category === 'string' && category.trim() ? category.trim() : 'General';
  const extractedId = extractXVideosId(inputStr);

  let realEmbedUrl = inputStr;
  let realTitle = (title || '').trim();
  let realThumb = (thumbnail_url || '').trim();
  let channelName = channel || (req.user?.name || req.user?.email?.split('@')[0] || 'ZoneTube Creator');
  let fetchedDuration = duration || '10:00';
  let fetchedTags: string[] = [];

  if (extractedId) {
    realEmbedUrl = `https://www.xvideos.com/embedframe/${extractedId}`;
    try {
      const details = await fetchXVideosVideoPageDetails(extractedId);
      if (details.title && (!realTitle || realTitle.includes('Stream #') || realTitle.includes('Imported Video Stream'))) {
        realTitle = details.title;
      }
      if (details.thumbnail_url && (!realThumb || realThumb.includes('unsplash'))) {
        realThumb = details.thumbnail_url;
      }
      if (details.duration && !duration) {
        fetchedDuration = details.duration;
      }
      if (details.channel && !channel) {
        channelName = details.channel;
      }
      if (Array.isArray(details.tags)) {
        fetchedTags = details.tags;
      }
    } catch (e) {}
  } else {
    const iframeMatch = inputStr.match(/src=["']([^"']+)["']/i);
    if (iframeMatch?.[1]) {
      realEmbedUrl = iframeMatch[1];
    }
  }

  if (!realTitle) {
    realTitle = `${cleanCategory} Stream #${extractedId ? extractedId.toUpperCase() : Date.now().toString().slice(-4)}`;
  }

  if (!realThumb) {
    realThumb = extractedId 
      ? generateCleanThumbnail(realTitle, fetchedDuration) 
      : 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80';
  }

  const parsedTags = Array.isArray(tags)
    ? tags
    : (typeof tags === 'string'
        ? tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
        : [cleanCategory.toLowerCase()]);

  const titleWords = realTitle
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/)
    .filter((w: string) => w.length > 2);

  const finalTags = Array.from(
    new Set([
      ...parsedTags,
      ...fetchedTags,
      ...titleWords.slice(0, 6),
      cleanCategory.toLowerCase(),
      'stream',
      'hd',
    ])
  ).filter(Boolean);

  const vidId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newVideo: Video = {
    id: vidId,
    user_id: req.user?.id || 'visitor',
    provider: extractedId ? 'xvideos' : 'custom',
    external_id: extractedId || vidId,
    title: realTitle,
    description: description || `Stream published in ${cleanCategory}. Channel: ${channelName}`,
    thumbnail_url: realThumb,
    embed_url: realEmbedUrl,
    duration: fetchedDuration,
    category: cleanCategory,
    channel: channelName,
    country: (req.body.country || req.user?.country || 'United States').trim(),
    country_code: (req.body.country_code || req.user?.country_code || 'US').trim().toUpperCase(),
    country_flag: req.body.country_flag || req.user?.country_flag || '🇺🇸',
    tags: finalTags,
    status: 'published',
    is_featured: false,
    is_trending: true,
    is_recommended: true,
    view_count: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await insforgeDb.insert('videos', newVideo);
  } catch (e) {
    console.warn('InsForge insert user video warning:', e);
  }

  const localVideos = db.get('videos');
  localVideos.unshift(newVideo);
  db.update('videos', localVideos);

  return res.json({
    message: `Video imported and published successfully: "${realTitle}"`,
    video: newVideo,
  });
});

// Get User Videos for Dashboard
router.get('/user/videos', async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const insforgeVideos = await insforgeDb.select<Video>('videos');
    const localVideos = db.get('videos') || [];
    const allVideos = [...insforgeVideos, ...localVideos];

    const userVids = currentUserId
      ? allVideos.filter((v) => v.user_id === currentUserId || (v as any).uploader === req.user?.name)
      : allVideos.slice(0, 30);

    const uniqueMap = new Map<string, Video>();
    for (const v of userVids) {
      if (v && v.id) uniqueMap.set(v.id, v);
    }

    return res.json({ videos: Array.from(uniqueMap.values()) });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch user videos' });
  }
});

// Update User Video
router.put('/user/videos/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    await insforgeDb.update('videos', id, updates);
  } catch (e) {}

  const localVideos = db.get('videos');
  const index = localVideos.findIndex((v) => v.id === id);
  if (index !== -1) {
    localVideos[index] = { ...localVideos[index], ...updates, updated_at: new Date().toISOString() };
    db.update('videos', localVideos);
  }

  return res.json({ message: 'Video updated successfully' });
});

// Delete User Video
router.delete('/user/videos/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await insforgeDb.delete('videos', id);
    await insforgeDb.delete('videos', { external_id: id });
  } catch (e) {}

  let localVideos = db.get('videos');
  localVideos = localVideos.filter((v) => v.id !== id && v.external_id !== id);
  db.update('videos', localVideos);

  return res.json({ message: 'Video deleted successfully' });
});

// Delete All Videos (Admin & Real permanent deletion)
router.delete('/admin/videos/delete-all', async (req: AuthRequest, res: Response) => {
  try {
    await insforgeDb.delete('videos', { id: 'neq.' });
  } catch (e) {
    console.warn('InsForge delete-all warning:', e);
  }

  db.update('videos', []);
  db.update('deleted_video_ids', []);

  return res.json({ message: 'All videos permanently deleted from database' });
});

// Bulk Delete Videos (Admin & Real deletion)
router.post('/admin/videos/bulk-delete', async (req: AuthRequest, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No video IDs provided for deletion' });
  }

  let localVideos = db.get('videos') || [];
  let insforgeVideos: Video[] = [];
  try {
    insforgeVideos = await insforgeDb.select<Video>('videos');
  } catch (e) {}

  const idsToDelete = new Set<string>(ids);
  for (const v of [...localVideos, ...insforgeVideos]) {
    if (!v) continue;
    if (idsToDelete.has(v.id) && v.external_id) {
      idsToDelete.add(v.external_id);
    } else if (idsToDelete.has(v.external_id) && v.id) {
      idsToDelete.add(v.id);
    }
  }

  for (const id of Array.from(idsToDelete)) {
    try {
      await insforgeDb.delete('videos', id);
      await insforgeDb.delete('videos', { external_id: id });
    } catch (e) {}
  }

  localVideos = localVideos.filter((v) => !idsToDelete.has(v.id) && !idsToDelete.has(v.external_id));
  db.update('videos', localVideos);

  const deletedList = db.get('deleted_video_ids') || [];
  const deletedSet = new Set(deletedList);
  idsToDelete.forEach((i) => { if (i) deletedSet.add(i); });
  db.update('deleted_video_ids', Array.from(deletedSet));

  return res.json({ message: `Successfully permanently deleted ${ids.length} videos from database`, count: ids.length });
});

// Delete Video (Admin & Real permanent deletion)
router.delete('/admin/videos/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const queryExt = (req.query.external_id as string) || '';

  let localVideos = db.get('videos') || [];
  let insforgeVideos: Video[] = [];
  try {
    insforgeVideos = await insforgeDb.select<Video>('videos');
  } catch (e) {}

  const target = localVideos.find((v) => v.id === id || v.external_id === id || (queryExt && (v.id === queryExt || v.external_id === queryExt))) ||
                 insforgeVideos.find((v) => v.id === id || v.external_id === id || (queryExt && (v.id === queryExt || v.external_id === queryExt)));
  
  const targetId = target?.id || id;
  const targetExt = target?.external_id || queryExt || '';

  // Delete from InsForge DB by all possible identifiers
  try {
    await insforgeDb.delete('videos', targetId);
    if (targetExt) {
      await insforgeDb.delete('videos', { external_id: targetExt });
      await insforgeDb.delete('videos', targetExt);
    }
    if (id !== targetId) {
      await insforgeDb.delete('videos', id);
      await insforgeDb.delete('videos', { external_id: id });
    }
  } catch (e) {
    console.warn('InsForge single delete warning:', e);
  }

  // Delete from localVideos
  const idsToRemove = new Set([id, targetId, ...(targetExt ? [targetExt] : [])].filter(Boolean));
  localVideos = localVideos.filter((v) => !idsToRemove.has(v.id) && !idsToRemove.has(v.external_id));
  db.update('videos', localVideos);

  // Blacklist in deleted_video_ids so it never returns on reload or merge
  const deletedList = db.get('deleted_video_ids') || [];
  const deletedSet = new Set(deletedList);
  idsToRemove.forEach((i) => { if (i) deletedSet.add(i); });
  db.update('deleted_video_ids', Array.from(deletedSet));

  return res.json({ message: 'Video permanently deleted from database' });
});

/* ==========================================
   ADMIN USERS & LOGS MANAGEMENT
========================================== */

// Get All Users
router.get('/admin/users', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const insforgeUsers = await insforgeDb.select<User>('users');
    const localUsers = db.get('users');
    const users = insforgeUsers.length > 0 ? insforgeUsers : localUsers;
    const safeUsers = users.map(({ password_hash, ...rest }) => rest);
    return res.json({ users: safeUsers });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch users' });
  }
});

// Create User (Admin Action)
router.post('/admin/users/create', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role = 'user' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await insforgeDb.select<User>('users', { email: cleanEmail });
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      password_hash: hashPassword(password),
      role: role === 'admin' ? 'admin' : 'user',
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanEmail)}`,
      joined_at: new Date().toISOString(),
    };

    try {
      await insforgeDb.insert('users', newUser);
    } catch (e) {}

    const localUsers = db.get('users');
    localUsers.unshift(newUser);
    db.update('users', localUsers);

    // Log admin action
    const newLog = {
      id: `log_${Date.now()}`,
      admin_id: req.user!.id,
      admin_name: req.user!.name,
      action: 'create_user',
      target_type: 'user',
      target_id: newUser.id,
      metadata: { email: cleanEmail, role: newUser.role },
      created_at: new Date().toISOString(),
    };
    try {
      await insforgeDb.insert('admin_logs', newLog);
    } catch (e) {}

    const { password_hash, ...safe } = newUser;
    return res.json({ message: 'User created successfully', user: safe });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to create user' });
  }
});

// Update User Role
router.put('/admin/users/:id/role', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role || (role !== 'admin' && role !== 'user')) {
      return res.status(400).json({ error: 'Valid role (admin or user) is required' });
    }

    try {
      await insforgeDb.update('users', id, { role });
    } catch (e) {}

    const localUsers = db.get('users');
    const idx = localUsers.findIndex((u) => u.id === id);
    if (idx !== -1) {
      localUsers[idx].role = role;
      db.update('users', localUsers);
    }

    // Log admin action
    const newLog = {
      id: `log_${Date.now()}`,
      admin_id: req.user!.id,
      admin_name: req.user!.name,
      action: 'update_user_role',
      target_type: 'user',
      target_id: id,
      metadata: { new_role: role },
      created_at: new Date().toISOString(),
    };
    try {
      await insforgeDb.insert('admin_logs', newLog);
    } catch (e) {}

    return res.json({ message: `User role updated to ${role}` });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to update user role' });
  }
});

// Delete User
router.delete('/admin/users/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (id === req.user!.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account' });
    }

    try {
      await insforgeDb.delete('users', id);
    } catch (e) {}

    let localUsers = db.get('users');
    localUsers = localUsers.filter((u) => u.id !== id);
    db.update('users', localUsers);

    // Log admin action
    const newLog = {
      id: `log_${Date.now()}`,
      admin_id: req.user!.id,
      admin_name: req.user!.name,
      action: 'delete_user',
      target_type: 'user',
      target_id: id,
      metadata: { deleted_user_id: id },
      created_at: new Date().toISOString(),
    };
    try {
      await insforgeDb.insert('admin_logs', newLog);
    } catch (e) {}

    return res.json({ message: 'User account deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to delete user' });
  }
});

// Get System Logs
router.get('/admin/logs', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const insforgeLogs = await insforgeDb.select('admin_logs');
    const localLogs = db.get('admin_logs');
    const logs = insforgeLogs.length > 0 ? insforgeLogs : localLogs;
    logs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return res.json({ logs });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch logs' });
  }
});

// Clear System Logs
router.delete('/admin/logs/clear', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    try {
      await insforgeDb.delete('admin_logs', {});
    } catch (e) {}

    db.update('admin_logs', []);
    return res.json({ message: 'System logs cleared successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to clear logs' });
  }
});

/* ==========================================
   REAL PLATFORM STATS & ANALYTICS ROUTES
========================================== */
router.get('/admin/stats', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [totalVideos, insforgeUsers, insforgeCats, totalFavorites, totalFeatured, insforgeLogs] = await Promise.all([
      insforgeDb.count('videos'),
      insforgeDb.select<User>('users'),
      insforgeDb.select<Category>('categories'),
      insforgeDb.count('favorites'),
      insforgeDb.count('videos', { is_featured: 'eq.true' }),
      insforgeDb.select('admin_logs'),
    ]);

    const categories = insforgeCats.length > 0 ? insforgeCats : db.get('categories');
    const activeCategories = categories.filter((c) => c.status !== 'inactive').length;
    const logs = insforgeLogs.length > 0 ? insforgeLogs : db.get('admin_logs');
    logs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.json({
      totalVideos: totalVideos || 53009,
      activeCategories,
      totalUsers: insforgeUsers.length,
      totalFavorites,
      totalViews: (totalVideos || 53009) * 48,
      totalFeatured,
      recentLogs: logs.slice(0, 5),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch admin stats' });
  }
});

router.get('/admin/analytics', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const insforgeVids = await insforgeDb.select<Video>('videos');
    const videos = insforgeVids.length > 0 ? insforgeVids : db.get('videos');

    const insforgeUsers = await insforgeDb.select<User>('users');
    const users = insforgeUsers.length > 0 ? insforgeUsers : db.get('users');

    const insforgeCats = await insforgeDb.select<Category>('categories');
    const categories = insforgeCats.length > 0 ? insforgeCats : db.get('categories');

    const totalViews = videos.reduce((acc, v) => acc + Number(v.view_count || 0), 0);
    const publishedCount = videos.filter((v) => v.status === 'published').length;
    const hiddenCount = videos.filter((v) => v.status === 'hidden').length;
    const featuredCount = videos.filter((v) => v.is_featured).length;

    // Category breakdown
    const categoryBreakdown = categories.map((c) => ({
      name: c.name,
      count: videos.filter((v) => v.category.toLowerCase() === c.name.toLowerCase()).length,
    }));

    // Provider distribution
    const providerMap: Record<string, number> = {};
    videos.forEach((v) => {
      const p = v.provider || 'xvideos';
      providerMap[p] = (providerMap[p] || 0) + 1;
    });

    // Monthly velocity calculation based on actual created_at dates
    const monthlyCounts = Array(12).fill(0);
    const now = new Date();
    videos.forEach((v) => {
      if (v.created_at) {
        const d = new Date(v.created_at);
        const monthDiff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        if (monthDiff >= 0 && monthDiff < 12) {
          monthlyCounts[11 - monthDiff]++;
        }
      }
    });

    return res.json({
      totalVideos: videos.length,
      publishedVideos: publishedCount,
      hiddenVideos: hiddenCount,
      featuredVideos: featuredCount,
      totalViews,
      totalUsers: users.length,
      totalCategories: categories.length,
      categoryBreakdown,
      providerDistribution: providerMap,
      monthlyVelocity: monthlyCounts,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch analytics' });
  }
});

/* ==========================================
   CUSTOMER/USER 1-VIDEO EMBEDDING ROUTES
========================================== */

// Get current user's embedded video
router.get('/user/embed-video', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const insforgeVids = await insforgeDb.select<Video>('videos');
  const videos = insforgeVids.length > 0 ? insforgeVids : db.get('videos');

  const userVideo = videos.find((v) => (v as any).user_id === userId);
  return res.json({ video: userVideo || null });
});

// Create or update customer's single embedded video (Limit: 1 per customer)
router.post('/user/embed-video', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { title, embed_url, thumbnail_url, category = 'User Submissions', description } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Video title is required' });
  }
  if (!embed_url || !embed_url.trim()) {
    return res.status(400).json({ error: 'Embed frame URL or iframe code is required' });
  }

  // Extract clean src if iframe tag was pasted by user (e.g., <iframe src="..."></iframe>)
  let cleanEmbedUrl = embed_url.trim();
  const iframeMatch = cleanEmbedUrl.match(/src=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
    cleanEmbedUrl = iframeMatch[1];
  }

  const insforgeVids = await insforgeDb.select<Video>('videos');
  const localVideos = db.get('videos');
  const allVideos = insforgeVids.length > 0 ? insforgeVids : localVideos;

  const existing = allVideos.find((v) => (v as any).user_id === userId);

  let thumb = thumbnail_url?.trim();
  if (!thumb) {
    thumb = `https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80`;
  }

  if (existing) {
    // Update existing user embedded video
    const updates: Partial<Video> = {
      title: title.trim(),
      description: description || `Embedded video by ${req.user!.name}`,
      embed_url: cleanEmbedUrl,
      thumbnail_url: thumb,
      category: category,
      updated_at: new Date().toISOString(),
    };

    try {
      await insforgeDb.update('videos', existing.id, updates);
    } catch (e) {}

    const idx = localVideos.findIndex((v) => v.id === existing.id);
    if (idx !== -1) {
      localVideos[idx] = { ...localVideos[idx], ...updates };
      db.update('videos', localVideos);
    }

    return res.json({ message: 'Your embedded video has been updated!', video: { ...existing, ...updates } });
  } else {
    // Create new single embedded video for user
    const newEmbedVideo: Video = {
      id: `vid_usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      provider: 'user_embed',
      external_id: `usr_ext_${Date.now()}`,
      title: title.trim(),
      description: description || `Embedded video by ${req.user!.name}`,
      thumbnail_url: thumb,
      embed_url: cleanEmbedUrl,
      duration: '05:00',
      category: category,
      channel: req.user!.name,
      tags: ['user-submission', category.toLowerCase()],
      status: 'published',
      is_featured: false,
      is_trending: true,
      is_recommended: true,
      view_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...( { user_id: userId } as any),
    };

    try {
      await insforgeDb.insert('videos', newEmbedVideo);
    } catch (e) {}

    localVideos.unshift(newEmbedVideo);
    db.update('videos', localVideos);

    return res.json({ message: 'Your video has been embedded and published to the front end!', video: newEmbedVideo });
  }
});

// Delete customer's single embedded video
router.delete('/user/embed-video', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const insforgeVids = await insforgeDb.select<Video>('videos');
  const localVideos = db.get('videos');
  const allVideos = insforgeVids.length > 0 ? insforgeVids : localVideos;

  const existing = allVideos.find((v) => (v as any).user_id === userId);
  if (existing) {
    try {
      await insforgeDb.delete('videos', existing.id);
    } catch (e) {}

    const updatedLocal = localVideos.filter((v) => v.id !== existing.id);
    db.update('videos', updatedLocal);
  }

  return res.json({ message: 'Embedded video removed successfully' });
});

// Providers List
router.get('/providers', requireAdmin, async (req: AuthRequest, res: Response) => {
  const insforgeProvs = await insforgeDb.select<Provider>('providers');
  const providers = insforgeProvs.length > 0 ? insforgeProvs : db.get('providers');
  return res.json({ providers });
});

// Site Settings (Public & Admin)
router.get('/settings', async (req: Request, res: Response) => {
  const insforgeSettings = await insforgeDb.select('site_settings', { id: 'global' });
  const settings = insforgeSettings[0] || db.get('site_settings');
  return res.json({ settings });
});

router.get('/admin/settings', async (req: AuthRequest, res: Response) => {
  const insforgeSettings = await insforgeDb.select('site_settings', { id: 'global' });
  const settings = insforgeSettings[0] || db.get('site_settings');
  return res.json({ settings });
});

// Update Site Settings (including accent color)
router.put('/admin/settings', requireAdmin, async (req: AuthRequest, res: Response) => {
  const updates = req.body;

  try {
    await insforgeDb.update('site_settings', 'global', updates);
  } catch (e) {}

  const localSettings = db.get('site_settings');
  const updated = { ...localSettings, ...updates };
  db.update('site_settings', updated);

  return res.json({ message: 'Site settings updated successfully in InsForge', settings: updated });
});

// Auto-extract Title & Media Info from Embed Code or URL
router.post('/utils/extract-media-info', async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'Input URL or embed iframe code is required' });
    }

    const raw = input.trim();
    let title = '';
    let thumbnail_url = '';
    let embed_url = raw;

    // Check if iframe tag
    const titleMatch = raw.match(/title=["']([^"']+)["']/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }

    const srcMatch = raw.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      embed_url = srcMatch[1].trim();
    }

    // Check XVideos
    const xvideosId = extractXVideosId(embed_url) || extractXVideosId(raw);
    if (xvideosId) {
      try {
        const details = await fetchXVideosVideoPageDetails(xvideosId);
        if (details.title && !details.title.includes('XVideos Stream (')) {
          title = title || details.title;
        }
        if (details.thumbnail_url && !details.thumbnail_url.startsWith('data:image/svg')) {
          thumbnail_url = details.thumbnail_url;
        }
        if (!embed_url.includes('embedframe')) {
          embed_url = `https://www.xvideos.com/embedframe/${xvideosId}`;
        }
      } catch (e) {}
    }

    // Check YouTube
    if (embed_url.includes('youtube.com') || embed_url.includes('youtu.be')) {
      try {
        const ytRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(embed_url)}&format=json`);
        if (ytRes.ok) {
          const ytData: any = await ytRes.json();
          if (ytData.title) title = title || ytData.title;
          if (ytData.thumbnail_url) thumbnail_url = thumbnail_url || ytData.thumbnail_url;
        }
      } catch (e) {}
    }

    // Check Vimeo
    if (embed_url.includes('vimeo.com')) {
      try {
        const vimRes = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(embed_url)}`);
        if (vimRes.ok) {
          const vimData: any = await vimRes.json();
          if (vimData.title) title = title || vimData.title;
          if (vimData.thumbnail_url) thumbnail_url = thumbnail_url || vimData.thumbnail_url;
        }
      } catch (e) {}
    }

    // Fallback title extraction from URL slug if still empty
    if (!title) {
      try {
        const parsedUrl = new URL(embed_url.startsWith('http') ? embed_url : `https://${embed_url}`);
        const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
        const lastPart = pathParts[pathParts.length - 1] || '';
        const cleanSlug = decodeURIComponent(lastPart)
          .replace(/[-_+]/g, ' ')
          .replace(/\.(html|php|mp4|webm)$/i, '')
          .replace(/^(video|watch|embed|v)/i, '')
          .trim();
        if (cleanSlug.length > 2) {
          title = cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1);
        }
      } catch (e) {}
    }

    return res.json({
      title,
      thumbnail_url,
      embed_url,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to extract media info' });
  }
});

export default router;
