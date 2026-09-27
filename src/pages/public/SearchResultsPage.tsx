import React, { useState, useEffect } from 'react';
import { Video, Category, Provider, SearchFilterParams } from '../../types';
import { VideoGrid } from '../../components/video/VideoGrid';
import { AdvancedSearchFilters } from '../../components/video/AdvancedSearchFilters';
import { getCountryFlag } from '../../lib/countries';
import api from '../../lib/api';

interface SearchResultsPageProps {
  searchQuery: string;
  onOpenVideo: (video: Video) => void;
  favoritesSet: Set<string>;
  onFavoriteToggle: (videoId: string, isFav: boolean) => void;
  onAddToPlaylist: (video: Video) => void;
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  searchQuery,
  onOpenVideo,
  favoritesSet,
  onFavoriteToggle,
  onAddToPlaylist,
}) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [filterParams, setFilterParams] = useState<SearchFilterParams>({
    category: 'All',
    provider: 'all',
    duration: 'all',
    date: 'all',
    sort: 'newest',
  });

  const urlParams = new URLSearchParams(window.location.search);
  const countryParam = urlParams.get('country');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get('q') || urlParams.get('search') || '';
    if (qParam) {
      setLocalSearch(qParam);
    } else if (searchQuery) {
      setLocalSearch(searchQuery);
    }
  }, [searchQuery, window.location.search]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, provRes] = await Promise.all([
          api.get('/categories'),
          api.get('/providers'),
        ]);
        setCategories(catRes.data.categories || []);
        setProviders(provRes.data.providers || []);
      } catch (err) {
        console.error('Failed to load filter categories/providers:', err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams();
        if (localSearch) queryParams.set('search', localSearch);
        
        const currentUrlParams = new URLSearchParams(window.location.search);
        const cParam = currentUrlParams.get('country');
        if (cParam) queryParams.set('country', cParam);

        if (filterParams.category && filterParams.category !== 'All') queryParams.set('category', filterParams.category);
        if (filterParams.provider && filterParams.provider !== 'all') queryParams.set('provider', filterParams.provider);
        if (filterParams.duration && filterParams.duration !== 'all') queryParams.set('duration', filterParams.duration);
        if (filterParams.date && filterParams.date !== 'all') queryParams.set('date', filterParams.date);
        if (filterParams.sort) queryParams.set('sort', filterParams.sort);
        queryParams.set('limit', '60');

        const res = await api.get(`/videos?${queryParams.toString()}`);
        setVideos(res.data.videos || []);
      } catch (err) {
        console.error('Failed to load search results:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [localSearch, filterParams]);

  const handleFilterChange = (updated: Partial<SearchFilterParams>) => {
    setFilterParams((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilterParams({
      category: 'All',
      provider: 'all',
      duration: 'all',
      date: 'all',
      sort: 'newest',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>🔍</span>
            <span>{localSearch ? `Search results for "${localSearch}"` : 'Search Stream Catalog'}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {isLoading ? 'Searching through streams...' : `${videos.length} video streams found`}
          </p>
        </div>

        <div className="w-full sm:w-auto relative">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Refine search keyword..."
            className="w-full sm:w-72 bg-[#151821] border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--accent-red)] transition-all"
          />
          <span className="absolute right-3.5 top-3 text-zinc-400">
            {isLoading ? (
              <i className="fa-solid fa-spinner fa-spin text-xs text-[var(--accent-red)]" />
            ) : (
              <i className="fa-solid fa-magnifying-glass text-xs" />
            )}
          </span>
        </div>
      </div>

      {countryParam && (
        <div className="p-4 bg-gradient-to-r from-red-950/50 via-[#151821] to-black border border-red-500/40 rounded-2xl flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getCountryFlag(countryParam)}</span>
            <div>
              <h2 className="text-base font-black text-white">
                Browsing Streams from {countryParam}
              </h2>
              <p className="text-xs text-zinc-400">
                Showing {videos.length} video stream(s) associated with {countryParam}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              window.history.pushState({}, '', '/search');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="text-xs font-bold text-zinc-300 hover:text-white bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 cursor-pointer"
          >
            Clear Country ✕
          </button>
        </div>
      )}

      <AdvancedSearchFilters
        filters={filterParams}
        onFilterChange={handleFilterChange}
        categories={categories}
        providers={providers}
        onReset={handleResetFilters}
      />

      <VideoGrid
        videos={videos}
        isLoading={isLoading}
        onOpenVideo={onOpenVideo}
        favoritesSet={favoritesSet}
        onFavoriteToggle={onFavoriteToggle}
        onAddToPlaylist={onAddToPlaylist}
        emptyTitle="No matching videos found"
        emptyDescription={`No streams matched your query "${localSearch}" with selected duration, date, or category filters. Try resetting filters.`}
      />
    </div>
  );
};

