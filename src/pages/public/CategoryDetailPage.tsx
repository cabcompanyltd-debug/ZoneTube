import React, { useState, useEffect } from 'react';
import { Video } from '../../types';
import { VideoGrid } from '../../components/video/VideoGrid';
import realXVideosDump from '../../lib/realXVideosDump.json';
import api from '../../lib/api';

interface CategoryDetailPageProps {
  categoryName: string;
  onOpenVideo: (video: Video) => void;
  favoritesSet: Set<string>;
  onFavoriteToggle: (videoId: string, isFav: boolean) => void;
  onAddToPlaylist?: (video: Video) => void;
}

// Global category video cache for instant page loads
const categoryVideoCache: Record<string, Video[]> = {};

function getCategoryInitialVideos(catName: string): Video[] {
  const norm = (catName || '').toLowerCase().trim();
  if (categoryVideoCache[norm] && categoryVideoCache[norm].length > 0) {
    return categoryVideoCache[norm];
  }

  const dump = (realXVideosDump || []) as any[];
  // Filter dump for matching category or tags or title
  const matchedDump = dump.filter((v: any) => {
    const vCat = (v.category || '').toLowerCase();
    const vTitle = (v.title || '').toLowerCase();
    return vCat.includes(norm) || norm.includes(vCat) || vTitle.includes(norm);
  });

  const sourceList = matchedDump;

  const initialList: Video[] = sourceList.slice(0, 100).map((v: any, idx: number) => {
    let thumb = v.thumbUrl || '';
    if (typeof thumb === 'string' && thumb.includes('others-cdn.com')) {
      thumb = thumb.replace(/others-cdn\.com/g, 'xvideos-cdn.com');
    }
    if (!thumb) {
      thumb = `https://thumb-cdn77.xvideos-cdn.com/keys/${v.extId || 'omciktl411a'}/0/xv_3_t.jpg`;
    }

    const safeCatName = typeof catName === 'string' && catName.trim() ? catName : 'Category';
    const catFormatted = safeCatName.charAt(0).toUpperCase() + safeCatName.slice(1);

    return {
      id: `vid_cat_${v.extId || idx}_${idx}`,
      provider: 'xvideos',
      external_id: v.extId || `xv_${idx}`,
      title: v.title || 'HD Stream',
      description: `Official stream in ${catFormatted}.`,
      thumbnail_url: thumb,
      video_url: '',
      embed_url: v.embedUrl || `https://www.xvideos.com/embedframe/${v.extId}`,
      duration: v.duration || '10:00',
      category: catFormatted,
      status: 'published' as const,
      view_count: 3200 + idx * 60,
      likes: 180 + idx * 8,
      dislikes: 2,
      rating: 4.9,
      is_featured: idx < 8,
      is_trending: true,
      is_recommended: true,
      channel: v.channel || 'XVideos Network',
      tags: [norm],
      created_at: new Date().toISOString(),
    };
  });

  categoryVideoCache[norm] = initialList;
  return initialList;
}

export const CategoryDetailPage: React.FC<CategoryDetailPageProps> = ({
  categoryName,
  onOpenVideo,
  favoritesSet,
  onFavoriteToggle,
  onAddToPlaylist,
}) => {
  const [videos, setVideos] = useState<Video[]>(() => getCategoryInitialVideos(categoryName));
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const initial = getCategoryInitialVideos(categoryName);
    return initial.length === 0;
  });

  useEffect(() => {
    // Synchronously set initial cached/preloaded videos on category change
    const initial = getCategoryInitialVideos(categoryName);
    setVideos(initial);
    if (initial.length > 0) {
      setIsLoading(false);
    }

    const fetchCategoryVideos = async () => {
      try {
        const res = await api.get(`/videos?category=${encodeURIComponent(categoryName)}&limit=100`);
        const fetched = res.data.videos || [];
        if (fetched.length > 0) {
          const norm = (categoryName || '').toLowerCase().trim();
          categoryVideoCache[norm] = fetched;
          setVideos(fetched);
        }
      } catch (err) {
        console.error('Failed to refresh category videos:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryVideos();
  }, [categoryName]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-8 rounded-3xl bg-gradient-to-r from-red-950/60 via-[#151821] to-[#08090D] border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <span className="px-3 py-1 bg-[var(--accent-red)] text-white text-[10px] font-extrabold uppercase rounded-full tracking-wider">
            Category
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white mt-2 tracking-tight">
            {categoryName} Streams
          </h1>
          <p className="text-sm text-zinc-300 mt-2 max-w-2xl">
            Stream all top rated, popular, and trending videos in the {categoryName} genre.
          </p>
        </div>
      </div>

      <VideoGrid
        videos={videos}
        isLoading={isLoading}
        onOpenVideo={onOpenVideo}
        favoritesSet={favoritesSet}
        onFavoriteToggle={onFavoriteToggle}
        onAddToPlaylist={onAddToPlaylist}
        emptyTitle={`No videos in ${categoryName}`}
        emptyDescription="Check back soon as new videos are imported daily."
      />
    </div>
  );
};
