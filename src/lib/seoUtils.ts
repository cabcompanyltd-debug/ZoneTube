export function slugifyTitle(title: string): string {
  if (!title || typeof title !== 'string') return 'video';
  return (title || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .substring(0, 70);
}

export function getSEOVideoUrl(video: { id: string; title?: string; external_id?: string }): string {
  if (!video) return '/';
  const id = video.id || video.external_id || '';
  const slug = slugifyTitle(video.title || '');
  return slug ? `/video/${slug}-${id}` : `/video/${id}`;
}

export function extractVideoIdFromParam(param: string): string {
  if (!param) return '';
  const decoded = decodeURIComponent(param);

  // 1. Check for vid_... or xv_... pattern
  const vidMatch = decoded.match(/(vid_[a-zA-Z0-9_]+|xv_[a-zA-Z0-9_]+)/i);
  if (vidMatch) {
    return vidMatch[1];
  }

  // 2. Otherwise split by hyphen to extract ID at the end
  const parts = decoded.split('-');
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }

  return decoded;
}
