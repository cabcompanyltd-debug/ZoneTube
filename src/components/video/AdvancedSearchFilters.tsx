import React, { useState } from 'react';
import { SearchFilterParams, Category, Provider } from '../../types';

interface AdvancedSearchFiltersProps {
  filters: SearchFilterParams;
  onFilterChange: (newFilters: Partial<SearchFilterParams>) => void;
  categories: Category[];
  providers: Provider[];
  onReset: () => void;
}

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  filters,
  onFilterChange,
  categories,
  providers,
  onReset,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    (filters.category && filters.category !== 'All') ||
    (filters.provider && filters.provider !== 'all') ||
    (filters.duration && filters.duration !== 'all') ||
    (filters.date && filters.date !== 'all') ||
    (filters.sort && filters.sort !== 'newest') ||
    !!filters.channel;

  return (
    <div className="bg-[#151821] border border-white/10 rounded-2xl p-4 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🎛️</span>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Search Filters & Sorting
          </span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-[var(--accent-red)] text-white text-[10px] font-black rounded-full">
              Active Filters
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors"
            >
              Reset Filters
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white rounded-lg border border-white/10 transition-colors font-bold"
          >
            {isExpanded ? 'Hide Filters ▲' : 'Advanced Filters ▼'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-3 border-t border-white/10 animate-fade-in">
          {/* Upload Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Upload Date
            </label>
            <select
              value={filters.date || 'all'}
              onChange={(e) => onFilterChange({ date: e.target.value as any })}
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--accent-red)]"
            >
              <option value="all">Any Time</option>
              <option value="hour">Last Hour</option>
              <option value="today">Today (24 Hours)</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Video Duration */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Duration
            </label>
            <select
              value={filters.duration || 'all'}
              onChange={(e) => onFilterChange({ duration: e.target.value as any })}
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--accent-red)]"
            >
              <option value="all">Any Duration</option>
              <option value="short">Short (&lt; 4 mins)</option>
              <option value="medium">Medium (4 - 20 mins)</option>
              <option value="long">Long (&gt; 20 mins)</option>
            </select>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Category
            </label>
            <select
              value={filters.category || 'All'}
              onChange={(e) => onFilterChange({ category: e.target.value })}
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--accent-red)]"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Provider / Source */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Provider API
            </label>
            <select
              value={filters.provider || 'all'}
              onChange={(e) => onFilterChange({ provider: e.target.value })}
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--accent-red)]"
            >
              <option value="all">All Providers</option>
              {providers.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Sort Order
            </label>
            <select
              value={filters.sort || 'newest'}
              onChange={(e) => onFilterChange({ sort: e.target.value as any })}
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--accent-red)]"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Viewed</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A - Z</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
