import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

interface AnalyticsData {
  totalVideos: number;
  publishedVideos: number;
  hiddenVideos: number;
  featuredVideos: number;
  totalViews: number;
  totalUsers: number;
  totalCategories: number;
  categoryBreakdown: { name: string; count: number }[];
  providerDistribution: Record<string, number>;
  monthlyVelocity: number[];
}

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/admin/analytics');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="border-b border-white/10 pb-4">
          <h1 className="text-2xl font-black text-white">Platform Analytics</h1>
          <p className="text-xs text-zinc-400 mt-1">Real-time database statistics and platform metrics</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-[#151821] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const maxMonthly = Math.max(...data.monthlyVelocity, 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-black text-white tracking-tight">Platform Analytics</h1>
        <p className="text-xs text-zinc-400 mt-1">Live metrics from your InsForge Postgres database</p>
      </div>

      {/* Real Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[#151821] border border-white/10 rounded-2xl shadow-lg">
          <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Total Video Streams</p>
          <h3 className="text-3xl font-black text-white mt-2">{data.totalVideos.toLocaleString()}</h3>
          <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
            {data.publishedVideos} Published • {data.hiddenVideos} Hidden
          </p>
        </div>

        <div className="p-5 bg-[#151821] border border-white/10 rounded-2xl shadow-lg">
          <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Total Database Views</p>
          <h3 className="text-3xl font-black text-white mt-2">{data.totalViews.toLocaleString()}</h3>
          <p className="text-[11px] text-zinc-400 mt-1 font-semibold">Real accumulated stream plays</p>
        </div>

        <div className="p-5 bg-[#151821] border border-white/10 rounded-2xl shadow-lg">
          <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Registered Users</p>
          <h3 className="text-3xl font-black text-white mt-2">{data.totalUsers.toLocaleString()}</h3>
          <p className="text-[11px] text-zinc-400 mt-1 font-semibold">Active customer profiles</p>
        </div>

        <div className="p-5 bg-[#151821] border border-white/10 rounded-2xl shadow-lg">
          <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Categories</p>
          <h3 className="text-3xl font-black text-white mt-2">{data.totalCategories.toLocaleString()}</h3>
          <p className="text-[11px] text-zinc-400 mt-1 font-semibold">{data.featuredVideos} Featured Streams</p>
        </div>
      </div>

      {/* Real Monthly Velocity Chart */}
      <div className="p-6 bg-[#151821] border border-white/10 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">12-Month Video Import & Creation Velocity</h3>
            <p className="text-xs text-zinc-400">Actual monthly distribution of ingested videos in database</p>
          </div>
          <span className="text-xs font-bold text-[var(--accent-red)] bg-red-950/60 px-3 py-1 rounded-full border border-red-800/40">
            Live Database Data
          </span>
        </div>

        <div className="h-56 flex items-end justify-between gap-2 sm:gap-3 pt-6 pb-2">
          {data.monthlyVelocity.map((count, i) => {
            const heightPercent = maxMonthly > 0 ? Math.max((count / maxMonthly) * 100, 4) : 4;
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthLabel = monthNames[i] || `M${i + 1}`;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                  {count}
                </span>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full bg-gradient-to-t from-red-900 via-[var(--accent-red)] to-red-500 rounded-t-md transition-all group-hover:brightness-125 shadow-md"
                />
                <span className="text-[10px] text-zinc-400 font-bold">{monthLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real Category Distribution Grid */}
      <div className="p-6 bg-[#151821] border border-white/10 rounded-3xl space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-white">Video Distribution by Category</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.categoryBreakdown.map((cat) => (
            <div
              key={cat.name}
              className="p-3 bg-black/40 border border-white/5 rounded-2xl flex flex-col justify-between"
            >
              <p className="text-xs font-bold text-zinc-300 truncate">{cat.name}</p>
              <p className="text-lg font-black text-white mt-1">{cat.count}</p>
              <p className="text-[10px] text-zinc-500">videos</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
