import React, { useState, useEffect } from 'react';
import { Category, Video } from '../../types';
import { DEFAULT_CATEGORIES } from '../../data/defaultCategories';
import api from '../../lib/api';

interface CategoriesPageProps {
  onNavigate: (path: string) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ onNavigate }) => {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchCatsAndVideos = async () => {
      try {
        const [catRes, vidRes] = await Promise.all([
          api.get('/categories'),
          api.get('/videos?limit=500'),
        ]);

        const rawCats: Category[] = catRes.data.categories || [];
        const rawVids: Video[] = vidRes.data.videos || [];

        if (rawVids.length > 0) {
          setVideos(rawVids);
        }
        if (rawCats.length > 0) {
          setCategories(rawCats);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatsAndVideos();
  }, []);

  // Map category to a cover photo extracted from the actual videos in that category folder
  const getCategoryThumbnail = (categoryName: string, catObj?: Category): string => {
    const cName = (categoryName || '').toLowerCase();
    
    // 1. Search videos list for a video matching this category
    const matchingVideo = videos.find((v) => {
      const vCat = (v.category || '').toLowerCase();
      const vTitle = (v.title || '').toLowerCase();
      const vTags = Array.isArray(v.tags) ? v.tags.map((t) => t.toLowerCase()) : [];
      return vCat.includes(cName) || cName.includes(vCat) || vTitle.includes(cName) || vTags.some((t) => t.includes(cName));
    });

    if (matchingVideo && matchingVideo.thumbnail_url) {
      let url = matchingVideo.thumbnail_url;
      if (url.includes('others-cdn.com')) url = url.replace(/others-cdn\.com/g, 'xvideos-cdn.com');
      return url;
    }

    // 2. Check category object image_url if provided
    if (catObj && catObj.image_url && typeof catObj.image_url === 'string' && catObj.image_url.startsWith('http')) {
      let url = catObj.image_url;
      if (url.includes('others-cdn.com')) url = url.replace(/others-cdn\.com/g, 'xvideos-cdn.com');
      return url;
    }

    // 3. Fallback to first available video in library
    if (videos[0]?.thumbnail_url) {
      let url = videos[0].thumbnail_url;
      if (url.includes('others-cdn.com')) url = url.replace(/others-cdn\.com/g, 'xvideos-cdn.com');
      return url;
    }

    return 'https://thumb-cdn77.xvideos-cdn.com/3321fe93-631a-489f-ac06-9c3a981f85e0/6/xv_15_t.jpg';
  };

  // Count videos in category accurately
  const getCategoryCount = (categoryName: string, fallbackCount?: number): number => {
    if (fallbackCount !== undefined && fallbackCount > 0) {
      return fallbackCount;
    }
    const matchedCount = videos.filter(
      (v) => v.category && v.category.toLowerCase() === categoryName.toLowerCase()
    ).length;
    return matchedCount > 0 ? matchedCount : 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>📁</span> All Categories
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Explore organized topics with thumbnails dynamically curated from real videos in each folder.
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-white/5 border border-white/10 rounded-full text-zinc-300 self-start sm:self-auto">
          {categories.length} Categories
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] sm:h-52 bg-[#151821] border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center bg-[#151821] border border-white/10 rounded-3xl space-y-3 max-w-lg mx-auto my-8">
          <span className="text-4xl block">📁</span>
          <h3 className="text-lg font-bold text-white">No Categories Created Yet</h3>
          <p className="text-xs text-zinc-400">
            Categories are created dynamically by the administrator. Go to Admin Dashboard &gt; Manage Categories to add new categories.
          </p>
          <button
            onClick={() => onNavigate('/admin')}
            className="mt-2 px-4 py-2 bg-[var(--accent-red)] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-md cursor-pointer"
          >
            ⚙ Admin Category Manager
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {categories
            .filter((cat, idx, arr) => cat?.name && arr.findIndex((c) => c?.name?.toLowerCase() === cat.name?.toLowerCase()) === idx)
            .map((cat, idx) => {
              const categoryThumb = getCategoryThumbnail(cat.name, cat);
              const rawCount = typeof cat.video_count === 'number' ? cat.video_count : (typeof cat.count === 'number' ? cat.count : getCategoryCount(cat.name));
              const formattedCount = Number(rawCount).toLocaleString();

              return (
                <div
                  key={`${cat.id || cat.name}-${idx}`}
                  onClick={() => onNavigate(`/category/${encodeURIComponent(cat.name)}`)}
                  className="group rounded-2xl bg-[#151821] border border-white/10 hover:border-[var(--accent-red)] cursor-pointer transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col shadow-xl"
                >
                  {/* Category thumbnail extracted from real videos of this folder with lazy loading */}
                  <div className="relative w-full aspect-[4/3] sm:aspect-video overflow-hidden bg-zinc-900">
                    <img
                      src={categoryThumb || 'https://thumb-cdn77.xvideos-cdn.com/3321fe93-631a-489f-ac06-9c3a981f85e0/6/xv_15_t.jpg'}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://thumb-cdn77.xvideos-cdn.com/3321fe93-631a-489f-ac06-9c3a981f85e0/6/xv_15_t.jpg';
                      }}
                    />
                    <div className="absolute top-2 right-2 z-10">
                      <span className="px-2 py-0.5 bg-black/80 backdrop-blur-md rounded-md text-[10px] sm:text-xs font-bold text-white border border-white/15 shadow-sm">
                        {formattedCount} {rawCount === 1 ? 'Video' : 'Videos'}
                      </span>
                    </div>
                  </div>

                  {/* Clean title and category metadata */}
                  <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 bg-[#151821]">
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-[var(--accent-red)] transition-colors truncate">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-zinc-400 line-clamp-1 mt-0.5">
                        {cat.description || `Browse videos in ${cat.name}`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
