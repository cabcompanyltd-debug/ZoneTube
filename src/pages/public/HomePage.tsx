import React, { useState, useEffect } from 'react';
import { Video, Category } from '../../types';
import { VideoGrid } from '../../components/video/VideoGrid';
import { AdBanner } from '../../components/common/AdBanner';
import { useToast } from '../../contexts/ToastContext';
import { Country } from '../../data/countries';
import { DEFAULT_CATEGORIES } from '../../data/defaultCategories';
import realXVideosDump from '../../lib/realXVideosDump.json';
import api from '../../lib/api';

interface HomePageProps {
  onOpenVideo: (video: Video) => void;
  onNavigate: (path: string) => void;
  favoritesSet: Set<string>;
  onFavoriteToggle: (videoId: string, isFav: boolean) => void;
  onAddToPlaylist?: (video: Video) => void;
  selectedCountry?: Country | null;
  onClearCountry?: () => void;
}

// Module-level memory cache so navigating between pages and returning to Home renders instantly
let homeVideosMemoryCache: Video[] | null = null;
let homeCategoriesMemoryCache: Category[] | null = null;

function getInitialVideos(): Video[] {
  let customVids: Video[] = [];
  try {
    const raw = localStorage.getItem('zonetube_custom_videos');
    if (raw) {
      customVids = JSON.parse(raw);
    }
  } catch (e) {}

  if (homeVideosMemoryCache && homeVideosMemoryCache.length > 0) {
    if (customVids.length > 0) {
      const seen = new Set(homeVideosMemoryCache.map((v) => v.id));
      const newFromCustom = customVids.filter((v) => !seen.has(v.id));
      if (newFromCustom.length > 0) {
        homeVideosMemoryCache = [...newFromCustom, ...homeVideosMemoryCache];
      }
    }
    return homeVideosMemoryCache;
  }
  const dump = (realXVideosDump || []) as any[];
  const preloaded: Video[] = dump.slice(0, 100).map((v: any, idx: number) => {
    let thumb = v.thumbUrl || '';
    if (typeof thumb === 'string' && thumb.includes('others-cdn.com')) {
      thumb = thumb.replace(/others-cdn\.com/g, 'xvideos-cdn.com');
    }
    if (!thumb) {
      thumb = `https://thumb-cdn77.xvideos-cdn.com/keys/${v.extId || 'omciktl411a'}/0/xv_3_t.jpg`;
    }

    const catRaw = v.category || 'general';
    const catFormatted = catRaw.charAt(0).toUpperCase() + catRaw.slice(1);

    return {
      id: `vid_v_${v.extId || idx}_${idx}`,
      provider: 'xvideos',
      external_id: v.extId || `xv_${idx}`,
      title: v.title || 'HD Video Stream',
      description: `Official HD stream in ${catFormatted}.`,
      thumbnail_url: thumb,
      video_url: '',
      embed_url: v.embedUrl || `https://www.xvideos.com/embedframe/${v.extId}`,
      duration: v.duration || '10:00',
      category: catFormatted,
      status: 'published' as const,
      view_count: 2400 + idx * 45,
      likes: 120 + idx * 5,
      dislikes: 1,
      rating: 4.9,
      is_featured: idx < 12,
      is_trending: idx >= 6 && idx < 24,
      is_recommended: true,
      channel: v.channel || 'XVideos Network',
      tags: [catRaw],
      created_at: new Date().toISOString(),
    };
  });
  const initialCombined = [...customVids, ...preloaded];
  homeVideosMemoryCache = initialCombined;
  return initialCombined;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenVideo,
  onNavigate,
  favoritesSet,
  onFavoriteToggle,
  onAddToPlaylist,
  selectedCountry,
  onClearCountry,
}) => {
  const [allVideos, setAllVideos] = useState<Video[]>(getInitialVideos);
  const [categories, setCategories] = useState<Category[]>(() => homeCategoriesMemoryCache || DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Render loaded videos directly
  const [visibleCount, setVisibleCount] = useState<number>(100);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const { showToast } = useToast();

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setIsLoading(true);
        const queryParams = selectedCountry
          ? `?limit=1000&country=${encodeURIComponent(selectedCountry.code)}`
          : '?limit=1000';
        const [vidRes, catRes] = await Promise.all([
          api.get(`/videos${queryParams}`),
          api.get('/categories'),
        ]);

        const fetchedVideos: Video[] = vidRes.data.videos || [];
        let customVids: Video[] = [];
        try {
          const raw = localStorage.getItem('zonetube_custom_videos');
          if (raw) customVids = JSON.parse(raw);
        } catch (e) {}

        const seen = new Set<string>();
        const merged: Video[] = [];
        for (const v of [...customVids, ...fetchedVideos]) {
          if (!v || !v.id) continue;
          const ext = v.external_id || '';
          if (seen.has(v.id) || (ext && seen.has(ext))) continue;
          seen.add(v.id);
          if (ext) seen.add(ext);
          merged.push(v);
        }

        if (merged.length > 0) {
          if (!selectedCountry) {
            homeVideosMemoryCache = merged;
          }
          setAllVideos(merged);
        }
        const fetchedCats: Category[] = catRes.data.categories || [];
        if (fetchedCats.length > 0) {
          homeCategoriesMemoryCache = fetchedCats;
          setCategories(fetchedCats);
        }
      } catch (err: any) {
        console.warn('API fetch warning:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomeData();

    // Listen for real-time video upload events from User Dashboard or Admin Embedder
    const handleVideosUpdated = (e: any) => {
      const newVid = e.detail?.video;
      if (newVid) {
        setAllVideos((prev) => {
          const exists = prev.some((v) => v.id === newVid.id || (v.external_id && v.external_id === newVid.external_id));
          if (exists) return prev;
          const next = [newVid, ...prev];
          homeVideosMemoryCache = next;
          return next;
        });
      } else {
        loadHomeData();
      }
    };

    window.addEventListener('zonetube_videos_updated', handleVideosUpdated);
    window.addEventListener('storage', handleVideosUpdated);

    return () => {
      window.removeEventListener('zonetube_videos_updated', handleVideosUpdated);
      window.removeEventListener('storage', handleVideosUpdated);
    };
  }, [selectedCountry]);

  // Reset pagination when category or country changes
  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setVisibleCount(20);
  };

  useEffect(() => {
    setVisibleCount(20);
  }, [selectedCountry]);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 20);
      setIsLoadingMore(false);
    }, 200);
  };

  // 1. Filter by Country if selected
  const countryFilteredVideos = selectedCountry
    ? allVideos.filter(
        (v) =>
          (v.country_code && v.country_code.toUpperCase() === selectedCountry.code.toUpperCase()) ||
          (v.country && v.country.toLowerCase() === selectedCountry.name.toLowerCase()) ||
          (v.country_flag && v.country_flag === selectedCountry.flag)
      )
    : allVideos;

  // 2. Filter by Category
  const filteredVideos =
    selectedCategory === 'All'
      ? countryFilteredVideos
      : countryFilteredVideos.filter(
          (v) => v.category.toLowerCase() === selectedCategory.toLowerCase()
        );

  const trendingVideos =
    selectedCategory === 'All'
      ? countryFilteredVideos.filter((v) => v.is_trending).slice(0, 8)
      : filteredVideos.filter((v) => v.is_trending);

  const categoryVideoCounts = categories.map((cat) => {
    const matched = countryFilteredVideos.filter(
      (v) => v.category && v.category.toLowerCase() === cat.name.toLowerCase()
    ).length;
    return {
      ...cat,
      count: selectedCountry ? matched : (cat.count || cat.video_count || matched),
    };
  });

  // Displayed videos based on visibleCount pagination
  const displayedVideos = filteredVideos.slice(0, visibleCount);
  const hasMore = visibleCount < filteredVideos.length;

  // Split displayed videos into batches of 10 to place an AdBanner after every 10 videos
  const videoBatches: Video[][] = [];
  for (let i = 0; i < displayedVideos.length; i += 10) {
    videoBatches.push(displayedVideos.slice(i, i + 10));
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Active Country Filter Banner */}
      {selectedCountry && (
        <div className="p-4 bg-gradient-to-r from-red-950/70 via-[#151821] to-black/80 border border-red-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl animate-fade-in">
          <div className="flex items-center gap-3.5">
            <span className="text-3xl shrink-0">{selectedCountry.flag}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white">
                  Showing Streams from {selectedCountry.name} ({selectedCountry.code})
                </h2>
                <span className="px-2 py-0.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-full text-[10px] font-mono font-bold">
                  {countryFilteredVideos.length} {countryFilteredVideos.length === 1 ? 'Stream' : 'Streams'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Filtered strictly to video streams uploaded from or originating in {selectedCountry.name}.
              </p>
            </div>
          </div>
          {onClearCountry && (
            <button
              onClick={onClearCountry}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border border-white/10"
            >
              <span>🌐</span> Reset to Global (All Countries)
            </button>
          )}
        </div>
      )}

      {/* Category Pills Filter Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Filter by Category:
          </span>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => handleSelectCategory('All')}
              className="text-xs font-bold text-[var(--accent-red)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Reset Filter (Show All)
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {['All', ...Array.from(new Set(categories.map((c) => c.name)))].map((cat, idx) => {
            const isSel = selectedCategory === cat;
            return (
              <button
                key={`${cat}-${idx}`}
                onClick={() => handleSelectCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 border flex items-center gap-1.5 cursor-pointer ${
                  isSel
                    ? 'bg-white text-black border-white shadow-lg scale-105'
                    : 'bg-[#151821] text-zinc-300 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                <span>{cat}</span>
                {cat !== 'All' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSel ? 'bg-black text-white' : 'bg-white/10 text-zinc-400'
                    }`}
                  >
                    {
                      countryFilteredVideos.filter(
                        (v) => v.category.toLowerCase() === cat.toLowerCase()
                      ).length
                    }
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Category Header Banner if Filtered */}
      {selectedCategory !== 'All' && (
        <div className="p-4 bg-gradient-to-r from-red-950/40 via-[#151821] to-black border border-red-500/30 rounded-2xl flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-red-600/20 text-red-400 rounded-xl text-lg font-black">
              📁
            </span>
            <div>
              <h2 className="text-base font-black text-white">
                Showing {selectedCategory} Videos
              </h2>
              <p className="text-xs text-zinc-400">
                Found {filteredVideos.length} video stream(s) under "{selectedCategory}"
              </p>
            </div>
          </div>
          <button
            onClick={() => handleSelectCategory('All')}
            className="text-xs font-bold text-zinc-300 hover:text-white bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 cursor-pointer"
          >
            Clear Filter ✕
          </button>
        </div>
      )}

      {/* Recommended / Stream Feed with initial 20 videos & more */}
      <section className="space-y-6">
        {videoBatches.length > 0 ? (
          videoBatches.map((batch, batchIdx) => (
            <React.Fragment key={`batch-${batchIdx}`}>
              <VideoGrid
                videos={batch}
                onOpenVideo={onOpenVideo}
                favoritesSet={favoritesSet}
                onFavoriteToggle={onFavoriteToggle}
                onAddToPlaylist={onAddToPlaylist}
                isLoading={isLoading}
              />

              {/* Show AdBanner after every 10 videos (each batch) */}
              <AdBanner variant="horizontal" />
            </React.Fragment>
          ))
        ) : !isLoading ? (
          <div className="p-12 text-center bg-[#151821] border border-white/10 rounded-2xl space-y-4">
            <span className="text-4xl block">{selectedCountry ? selectedCountry.flag : '📹'}</span>
            <div>
              <h3 className="text-base font-bold text-white">
                {selectedCountry
                  ? `No video streams currently available for ${selectedCountry.name}`
                  : 'No video streams found for the current selection'}
              </h3>
              <p className="text-zinc-400 text-xs mt-1 max-w-md mx-auto">
                {selectedCountry
                  ? `Be the first to upload or import videos from ${selectedCountry.name} (${selectedCountry.code}), or switch back to Global to view all worldwide streams.`
                  : 'Try selecting a different category or clearing filters.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {selectedCountry && onClearCountry && (
                <button
                  onClick={onClearCountry}
                  className="px-5 py-2.5 bg-[var(--accent-red)] text-white text-xs font-bold rounded-xl cursor-pointer hover:brightness-110 transition-all shadow-md flex items-center gap-2"
                >
                  <span>🌐</span> Switch to Global (All Videos)
                </button>
              )}
              <button
                onClick={() => onNavigate('/dashboard')}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors border border-white/10 flex items-center gap-2"
              >
                <span>⚡</span> Import Video to this Location
              </button>
            </div>
          </div>
        ) : null}

        {/* Load More Button (Appends 20 more videos on click) */}
        {hasMore && (
          <div className="flex justify-center pt-4 pb-8">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              style={{
                backgroundColor: 'var(--accent-red)',
                boxShadow: '0 4px 16px var(--accent-glow, rgba(229,9,20,0.4))',
              }}
              className="px-8 py-3.5 text-white font-bold text-sm rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isLoadingMore ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Loading More Streams...</span>
                </>
              ) : (
                <>
                  <span>Load More Videos (+20)</span>
                  <span className="text-xs opacity-80">
                    ({displayedVideos.length} of {filteredVideos.length})
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {/* Trending Streams Section */}
      {trendingVideos.length > 0 && selectedCategory === 'All' && (
        <section className="space-y-4 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <h2 className="text-lg font-black text-white">Trending Streams</h2>
            </div>
            <button
              onClick={() => onNavigate('/explore')}
              className="text-xs font-bold text-[var(--accent-red)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              See All <span>→</span>
            </button>
          </div>

          <VideoGrid
            videos={trendingVideos}
            onOpenVideo={onOpenVideo}
            favoritesSet={favoritesSet}
            onFavoriteToggle={onFavoriteToggle}
            onAddToPlaylist={onAddToPlaylist}
            isLoading={isLoading}
          />
        </section>
      )}

      {/* Bottom Ad Banner */}
      <AdBanner variant="horizontal" />
    </div>
  );
};
