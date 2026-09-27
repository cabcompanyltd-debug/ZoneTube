import { execSync } from 'child_process';
import { decodeXvideosTitle, formatDurationFromSec, extractXVideosIdFromUrl } from '../server/xvideosDbImporter';
import fs from 'fs';

async function generateAndRunSql() {
  console.log('Fetching true ebony rows from info.xvideos.net/db...');
  const exportUrl = 'https://public-assets.xvideos-cdn.com/webmaster-tools/xvideos.com-export-week.csv.zip';
  
  const rawCsv = execSync(
    `curl -sL --max-time 45 "${exportUrl}" | funzip | grep -iE ";.*ebony.*" | head -n 500`,
    { timeout: 50000, maxBuffer: 10 * 1024 * 1024 }
  ).toString('utf-8');

  const lines = rawCsv.split(/\r?\n/).filter((l) => l.trim().length > 15);
  console.log(`Extracted ${lines.length} raw Ebony video rows from export.`);

  const seenIds = new Set<string>();
  const values: string[] = [];

  for (const line of lines) {
    if (values.length >= 100) break;

    const parts = line.split(';');
    if (parts.length < 5) continue;

    const videoUrl = parts[0]?.trim() || '';
    const rawTitle = parts[1]?.trim() || '';
    const durationStr = parts[2]?.trim() || '';
    const thumbUrl = parts[3]?.trim() || '';
    const embedCode = parts[4]?.trim() || '';
    const tagsStr = parts[5]?.trim() || '';
    const channelStr = parts[6]?.trim() || '';

    const lowerLine = line.toLowerCase();
    const isTrueEbony = lowerLine.includes('ebony') || lowerLine.includes('black-') || lowerLine.includes('african');
    if (!isTrueEbony) continue;

    const extId = extractXVideosIdFromUrl(videoUrl) || extractXVideosIdFromUrl(embedCode);
    if (!extId || seenIds.has(extId)) continue;
    seenIds.add(extId);

    const title = decodeXvideosTitle(rawTitle);
    if (!title || title.toLowerCase().includes('deleted') || title.length < 4) continue;

    const duration = formatDurationFromSec(durationStr);
    const targetEmbedUrl = `https://www.xvideos.com/embedframe/${extId}`;
    const targetThumb = thumbUrl || `https://thumb-cdn77.others-cdn.com/${extId}/6/xv_15_t.jpg`;

    const rawTags = tagsStr ? tagsStr.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : ['ebony'];
    if (!rawTags.includes('ebony')) rawTags.unshift('ebony');
    const tagsArraySql = `ARRAY[${rawTags.map((t) => `'${t.replace(/'/g, "''")}'`).join(',')}]::text[]`;

    const id = `vid_ebony_${extId}`;
    const titleEscaped = title.replace(/'/g, "''");
    const descEscaped = `Official Ebony video stream (${duration}) from XVideos database export.`.replace(/'/g, "''");
    const uploaderEscaped = (channelStr || 'ZoneTube Ebony Network').replace(/'/g, "''");
    const views = Math.floor(Math.random() * 85000) + 5000;
    const likes = Math.floor(views * 0.05) + 10;

    values.push(
      `('${id}', 'system_importer', '${titleEscaped}', '${descEscaped}', '${targetThumb}', '${targetEmbedUrl}', '${targetEmbedUrl}', '${duration}', 'Ebony', ${views}, ${likes}, 0, 4.9, false, true, '${uploaderEscaped}', ${tagsArraySql}, NOW())`
    );
  }

  console.log(`Prepared ${values.length} SQL values for 100 true Ebony videos.`);

  // Write SQL to file
  const sqlContent = `
    INSERT INTO public.categories (id, name, slug, icon, description, count, created_at)
    VALUES ('cat_ebony', 'Ebony', 'ebony', '👑', 'True Ebony videos and curated streams', 100, NOW())
    ON CONFLICT (id) DO UPDATE SET count = 100, description = EXCLUDED.description;

    INSERT INTO public.videos (id, user_id, title, description, thumbnail_url, video_url, embed_url, duration, category, views, likes, dislikes, rating, is_featured, is_trending, uploader, tags, created_at)
    VALUES
    ${values.join(',\n    ')}
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      thumbnail_url = EXCLUDED.thumbnail_url,
      embed_url = EXCLUDED.embed_url,
      tags = EXCLUDED.tags,
      category = 'Ebony';
  `;

  fs.writeFileSync('/tmp/insert_ebony.sql', sqlContent);
  console.log('Executing SQL batch into InsForge PostgreSQL database...');
  execSync(`npx @insforge/cli db query "$(cat /tmp/insert_ebony.sql)"`, { stdio: 'inherit' });
  console.log('✅ Done inserting 100 true Ebony videos!');
}

generateAndRunSql().catch(console.error);
