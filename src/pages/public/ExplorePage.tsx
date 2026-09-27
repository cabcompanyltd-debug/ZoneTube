import React, { useState, useEffect } from 'react';
import { Video, Category } from '../../types';
import { VideoGrid } from '../../components/video/VideoGrid';
import { DEFAULT_CATEGORIES } from '../../data/defaultCategories';
import api from '../../lib/api';

interface ExplorePageProps {
  onOpenVideo: (video: Video) => void;
  favoritesSet: Set<string>;
  onFavoriteToggle: (videoId: string, isFav: boolean) => void;
  onAddToPlaylist?: (video: Video) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  onOpenVideo,
  favoritesSet,
  onFavoriteToggle,
  onAddToPlaylist,
}) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vidRes, catRes] = await Promise.all([
          api.get('/videos?limit=100'),
          api.get('/categories'),
        ]);
        const fetchedVideos: Video[] = vidRes.data.videos || [];
        if (fetchedVideos.length > 0) {
          setVideos(fetchedVideos);
        }
        const fetchedCats: Category[] = catRes.data.categories || [];
        if (fetchedCats.length > 0) {
          setCategories(fetchedCats);
        }
      } catch (err) {
        console.error('Failed to load explore videos:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = videos.filter((v) => {
    if (!v) return false;
    if (selectedCategory === 'All') return true;
    const vCat = typeof v.category === 'string' ? v.category : '';
    return vCat.toLowerCase() === (selectedCategory || '').toLowerCase();
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'popular') return (b.view_count || 0) - (a.view_count || 0);
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Explore Platform</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Browse all authorized video streams by category and popularity.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#151821] p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {['All', ...Array.from(new Set(categories.map((c) => c.name)))].map((cat, idx) => (
            <button
              key={`${cat}-${idx}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${
                selectedCategory === cat
                  ? 'bg-[var(--accent-red)] text-white border-red-500 shadow-md'
                  : 'bg-black/40 text-zinc-300 border-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <label className="text-xs text-zinc-400 font-medium">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--accent-red)]"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Viewed</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      <VideoGrid
        videos={sorted}
        isLoading={isLoading}
        onOpenVideo={onOpenVideo}
        favoritesSet={favoritesSet}
        onFavoriteToggle={onFavoriteToggle}
        onAddToPlaylist={onAddToPlaylist}
        emptyTitle="No videos found in this category"
        emptyDescription="Try choosing another category or clearing your filter."
      />
    </div>
  );
};
