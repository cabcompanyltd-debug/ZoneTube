import { createClient } from '@insforge/sdk';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...vals] = trimmed.split('=');
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
}

const insforgeUrl = process.env.VITE_INSFORGE_URL || 'https://2y4k8jwr.us-east.insforge.app';
const insforgeAnonKey = process.env.VITE_INSFORGE_ANON_KEY || '';

const insforge = createClient({
  baseUrl: insforgeUrl,
  anonKey: insforgeAnonKey,
});

async function run() {
  console.log('Querying top videos from InsForge database to update defaultVideos.ts...');
  const { data: videos, error } = await insforge.database
    .from('videos')
    .select('*')
    .order('views', { ascending: false })
    .limit(28);

  if (error || !videos || videos.length === 0) {
    console.error('Failed to query videos:', error);
    process.exit(1);
  }

  console.log(`Fetched ${videos.length} videos from database.`);

  const formattedVideos = videos.map((v: any, index: number) => {
    let cleanEmbed = v.embed_url || '';
    if (cleanEmbed.includes('src=')) {
      const match = cleanEmbed.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) cleanEmbed = match[1];
    }
    if (cleanEmbed.includes('video.')) {
      const match = cleanEmbed.match(/xvideos\.com\/video\.?([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) cleanEmbed = `https://www.xvideos.com/embedframe/${match[1]}`;
    }
    if (!cleanEmbed && v.id) {
      const extId = v.id.replace('vid_ebony_', '').replace('vid_', '');
      cleanEmbed = `https://www.xvideos.com/embedframe/${extId}`;
    }

    const tags = Array.isArray(v.tags) && v.tags.length > 0
      ? v.tags
      : (v.category ? [v.category.toLowerCase(), 'hd', 'stream'] : ['stream', 'hd']);

    return {
      id: v.id,
      title: v.title,
      description: v.description || `High quality ${v.category} stream experience.`,
      thumbnail_url: v.thumbnail_url,
      video_url: '',
      embed_url: cleanEmbed,
      duration: v.duration || '10:00',
      category: v.category || 'General',
      view_count: v.views || 25000,
      likes: v.likes || 1200,
      dislikes: v.dislikes || 5,
      rating: v.rating || 4.9,
      is_featured: index < 4,
      is_trending: true,
      channel: v.uploader || 'ZoneTube Network',
      tags,
      created_at: v.created_at || new Date().toISOString(),
    };
  });

  const tsContent = `import { Video } from '../types';

export const DEFAULT_VIDEOS: Video[] = ${JSON.stringify(formattedVideos, null, 2)};
`;

  fs.writeFileSync(path.join(process.cwd(), 'src/data/defaultVideos.ts'), tsContent, 'utf-8');
  console.log('✅ Updated src/data/defaultVideos.ts with authentic real video items and thumbnails!');
}

run().catch(console.error);
