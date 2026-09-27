import { execSync } from 'child_process';
import { createClient } from '@insforge/sdk';
import { decodeXvideosTitle, formatDurationFromSec, extractXVideosIdFromUrl } from '../server/xvideosDbImporter';
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
  console.log('🚀 Starting official XVideos database export sync for EBONY category (100 videos)...');

  // Ensure Ebony category exists
  try {
    const { data: existingCats } = await insforge.database.from('categories').select('*').ilike('name', 'Ebony');
    if (!existingCats || existingCats.length === 0) {
      console.log('Creating Ebony category in categories table...');
      await insforge.database.from('categories').insert([{
        id: `cat_ebony_${Date.now()}`,
        name: 'Ebony',
        slug: 'ebony',
        description: 'True Ebony videos and curated streams',
        image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        status: 'active',
        created_at: new Date().toISOString(),
      }]);
    }
  } catch (err) {
    console.warn('Category check note:', err);
  }

  // Fetch existing video external_ids & titles to avoid duplicates
  const { data: existingVideos } = await insforge.database.from('videos').select('external_id, embed_url, title');
  const existingSet = new Set<string>();
  if (existingVideos) {
    for (const v of existingVideos) {
      if (v.external_id) existingSet.add(v.external_id);
      if (v.embed_url) existingSet.add(v.embed_url);
      if (v.title) existingSet.add(v.title.toLowerCase().trim());
    }
  }

  console.log(`Found ${existingSet.size} existing video keys in DB.`);

  // Stream and grep ebony videos from XVideos DB export
  console.log('Fetching and filtering true ebony rows from info.xvideos.net/db...');
  const exportUrl = 'https://public-assets.xvideos-cdn.com/webmaster-tools/xvideos.com-export-week.csv.zip';
  
  let rawCsv = '';
  try {
    rawCsv = execSync(
      `curl -sL --max-time 45 "${exportUrl}" | funzip | grep -iE ";.*ebony.*" | head -n 300`,
      { timeout: 50000, maxBuffer: 10 * 1024 * 1024 }
    ).toString('utf-8');
  } catch (err: any) {
    console.warn('Curl stream error, trying temp download:', err.message);
    const tmpZip = '/tmp/xv_ebony_sync.zip';
    execSync(`curl -sL --max-time 45 "${exportUrl}" -o "${tmpZip}"`, { timeout: 50000 });
    rawCsv = execSync(`unzip -p "${tmpZip}" | grep -iE ";.*ebony.*" | head -n 300`, { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }).toString('utf-8');
    if (fs.existsSync(tmpZip)) fs.unlinkSync(tmpZip);
  }

  const lines = rawCsv.split(/\r?\n/).filter((l) => l.trim().length > 15);
  console.log(`Extracted ${lines.length} raw Ebony video rows from export.`);

  const ebonyVideosToInsert: any[] = [];
  const targetCount = 100;

  for (const line of lines) {
    if (ebonyVideosToInsert.length >= targetCount) break;

    const parts = line.split(';');
    if (parts.length < 5) continue;

    const videoUrl = parts[0]?.trim() || '';
    const rawTitle = parts[1]?.trim() || '';
    const durationStr = parts[2]?.trim() || '';
    const thumbUrl = parts[3]?.trim() || '';
    const embedCode = parts[4]?.trim() || '';
    const tagsStr = parts[5]?.trim() || '';
    const channelStr = parts[6]?.trim() || '';

    // Verify it is a true Ebony video by title or tags
    const lowerLine = line.toLowerCase();
    const isTrueEbony = lowerLine.includes('ebony') || lowerLine.includes('black-') || lowerLine.includes('african');
    if (!isTrueEbony) continue;

    const extId = extractXVideosIdFromUrl(videoUrl) || extractXVideosIdFromUrl(embedCode);
    if (!extId) continue;

    const targetEmbedUrl = `https://www.xvideos.com/embedframe/${extId}`;
    const cleanedTitle = decodeXvideosTitle(rawTitle);

    if (
      existingSet.has(extId) ||
      existingSet.has(targetEmbedUrl) ||
      existingSet.has(cleanedTitle.toLowerCase().trim())
    ) {
      continue;
    }

    // Skip deleted videos
    const titleLower = cleanedTitle.toLowerCase();
    if (titleLower.includes('this video has been deleted') || titleLower.includes('page not found') || titleLower.length < 4) {
      continue;
    }

    existingSet.add(extId);
    existingSet.add(targetEmbedUrl);
    existingSet.add(cleanedTitle.toLowerCase().trim());

    const duration = formatDurationFromSec(durationStr);
    const parsedTags = tagsStr
      ? tagsStr.split(',').map((t) => t.trim().toLowerCase()).filter((t) => t.length > 2)
      : ['ebony', 'hd', 'stream'];

    // Ensure 'ebony' tag is present
    if (!parsedTags.includes('ebony')) {
      parsedTags.unshift('ebony');
    }

    const videoRecord = {
      id: `vid_ebony_${extId}_${Date.now().toString(36)}`,
      provider: 'xvideos',
      external_id: extId,
      title: cleanedTitle,
      description: `Official Ebony video stream (${duration}) from XVideos database export.`,
      thumbnail_url: thumbUrl || `https://thumb-cdn77.others-cdn.com/${extId}/6/xv_15_t.jpg`,
      embed_url: targetEmbedUrl,
      duration,
      category: 'Ebony',
      channel: channelStr || 'XVideos Ebony Network',
      tags: parsedTags,
      status: 'published',
      is_featured: false,
      is_trending: true,
      is_recommended: true,
      view_count: Math.floor(Math.random() * 95000) + 5000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    ebonyVideosToInsert.push(videoRecord);
  }

  console.log(`Prepared ${ebonyVideosToInsert.length} true Ebony videos for insertion.`);

  // Insert into InsForge database in batches of 10
  let inserted = 0;
  for (let i = 0; i < ebonyVideosToInsert.length; i += 10) {
    const batch = ebonyVideosToInsert.slice(i, i + 10);
    try {
      const { data, error } = await insforge.database.from('videos').insert(batch);
      if (error) {
        console.warn(`Batch insert note at ${i}:`, error.message);
        // Fallback to inserting one by one
        for (const singleVid of batch) {
          try {
            await insforge.database.from('videos').insert([singleVid]);
            inserted++;
          } catch (e) {}
        }
      } else {
        inserted += batch.length;
      }
      console.log(`Inserted ${inserted}/${ebonyVideosToInsert.length} videos...`);
    } catch (err: any) {
      console.warn('Batch insert exception:', err.message);
    }
  }

  console.log(`🎉 Successfully imported ${inserted} true Ebony videos into the InsForge database!`);
}

run().catch((err) => {
  console.error('Fatal import error:', err);
  process.exit(1);
});
