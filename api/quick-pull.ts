import axios from 'axios';
import { createClient } from '@insforge/sdk';

interface VercelRequest {
  method?: string;
  body?: any;
  query?: any;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: any) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

const INSFORGE_BASE_URL = 'https://2y4k8jwr.us-east.insforge.app';
const INSFORGE_ANON_KEY = 'ik_44baf229fbf982d963b2277e284be487';

const insforge = createClient({
  baseUrl: INSFORGE_BASE_URL,
  anonKey: INSFORGE_ANON_KEY,
});

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
}

function extractXVideosId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const iframeMatch = trimmed.match(/src=["']?([^"'\s>]+)["']?/i);
  const targetStr = iframeMatch?.[1] || trimmed;

  const embedMatch = targetStr.match(/embedframe\/([a-zA-Z0-9_-]+)/i);
  if (embedMatch?.[1]) return embedMatch[1];

  const videoMatch = targetStr.match(/video\.?([a-zA-Z0-9_-]+)/i);
  if (videoMatch?.[1]) return videoMatch[1];

  if (/^[a-zA-Z0-9_-]{4,30}$/.test(targetStr)) {
    return targetStr;
  }
  return '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = req.body || req.query || {};
  const inputStr = body.titleOrUrl || body.embed_url || body.url || body.title || '';
  const category = body.category || 'General';
  const customTitle = body.customTitle || '';
  const customThumb = body.customThumb || '';
  const parsedTags = Array.isArray(body.tags)
    ? body.tags
    : (typeof body.tags === 'string'
        ? body.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
        : [category.toLowerCase()]);

  const extractedId = extractXVideosId(inputStr);

  let realEmbedUrl = inputStr;
  let realTitle = customTitle;
  let realThumb = customThumb;
  let channelName = 'XVideos Network';
  let fetchedTags: string[] = [];
  let fetchedDuration = '10:00';

  if (extractedId) {
    realEmbedUrl = `https://www.xvideos.com/embedframe/${extractedId}`;
    try {
      // Fetch embedframe HTML directly (lightweight & 100% reliable)
      const embedRes = await axios.get(realEmbedUrl, {
        timeout: 7000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        validateStatus: (status) => status < 500,
      });

      if (embedRes.status === 200 && typeof embedRes.data === 'string') {
        const html = embedRes.data;

        // Extract title
        const titleMatch =
          html.match(/setVideoTitle\s*\(\s*['"]([^'"]+)['"]\s*\)/i) ||
          html.match(/["']tf["']\s*:\s*["']([^"']+)["']/i) ||
          html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch?.[1]) {
          const raw = titleMatch[1].replace(/\s*-\s*XVideos\.com$/i, '').trim();
          if (raw && !raw.toLowerCase().includes('embed video') && !raw.toLowerCase().includes('not found')) {
            realTitle = decodeHtmlEntities(raw);
          }
        }

        // Extract thumbnail
        const thumb169Match = html.match(/setThumbUrl169\s*\(\s*['"]([^'"]+)['"]\s*\)/i);
        const thumbMatch = html.match(/setThumbUrl\s*\(\s*['"]([^'"]+)['"]\s*\)/i);
        const jsonThumbMatch = html.match(/["']i["']\s*:\s*["'](https?:\\?\/\\?\/[^"']+)["']/i);

        if (thumb169Match?.[1]) {
          realThumb = thumb169Match[1].replace(/\\/g, '');
        } else if (thumbMatch?.[1]) {
          realThumb = thumbMatch[1].replace(/\\/g, '');
        } else if (jsonThumbMatch?.[1]) {
          realThumb = jsonThumbMatch[1].replace(/\\/g, '');
        }

        // Extract uploader / channel
        const uploaderMatch =
          html.match(/setUploaderName\s*\(\s*['"]([^'"]+)['"]\s*\)/i) ||
          html.match(/["']pn["']\s*:\s*["']([^"']+)["']/i);
        if (uploaderMatch?.[1]) {
          channelName = decodeHtmlEntities(uploaderMatch[1].replace(/\\/g, '').trim());
        }

        // Extract duration
        const jsonDurMatch = html.match(/["']d["']\s*:\s*["']([^"']+)["']/i);
        if (jsonDurMatch?.[1]) {
          const rawD = jsonDurMatch[1].trim();
          if (rawD.includes('min')) {
            const numM = parseInt(rawD, 10);
            if (!isNaN(numM)) fetchedDuration = `${numM}:00`;
          } else {
            fetchedDuration = rawD;
          }
        }
      }
    } catch (e) {
      console.warn('Axios fetch error in serverless quick-pull:', e);
    }
  }

  if (!realTitle) {
    realTitle =
      customTitle ||
      `${category} Stream #${extractedId ? extractedId.toUpperCase() : Date.now().toString().slice(-4)}`;
  }

  if (!realThumb) {
    realThumb =
      customThumb ||
      (extractedId ? `https://thumb-cdn77.xvideos-cdn.com/keys/${extractedId}/0/xv_3_t.jpg` : '');
  }

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
      category.toLowerCase(),
      'xvideos',
      'hd',
      'trending',
    ])
  ).filter(Boolean);

  const userCountry = body.country || 'United States';
  const userCountryCode = (body.country_code || 'US').toUpperCase();
  const userCountryFlag = body.country_flag || '🇺🇸';

  if (body.preview) {
    return res.status(200).json({
      success: true,
      preview: true,
      video: {
        title: realTitle,
        thumbnail_url: realThumb,
        channel: channelName,
        tags: finalTags,
        duration: fetchedDuration,
        embed_url: realEmbedUrl,
        category,
        country: userCountry,
        country_code: userCountryCode,
        country_flag: userCountryFlag,
      },
    });
  }

  const vidId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newVideo = {
    id: vidId,
    provider: 'xvideos',
    external_id: extractedId || vidId,
    user_id: 'admin',
    title: realTitle,
    description: `Official HD stream imported for ${category}. Channel: ${channelName}`,
    thumbnail_url: realThumb,
    embed_url: realEmbedUrl,
    category,
    channel: channelName,
    country: userCountry,
    country_code: userCountryCode,
    country_flag: userCountryFlag,
    tags: finalTags,
    duration: fetchedDuration,
    status: 'published',
    views: Math.floor(Math.random() * 25000) + 2000,
    view_count: Math.floor(Math.random() * 25000) + 2000,
    likes: 48,
    dislikes: 0,
    rating: 4.9,
    is_featured: true,
    is_trending: true,
    is_recommended: true,
    uploader: channelName || 'Administrator',
    created_at: new Date().toISOString(),
  };

  try {
    await insforge.database.from('videos').insert([newVideo]);
  } catch (e) {
    console.warn('InsForge DB insert error in serverless quick-pull:', e);
  }

  return res.status(200).json({
    message: `Successfully imported stream: "${realTitle}"`,
    video: newVideo,
  });
}
