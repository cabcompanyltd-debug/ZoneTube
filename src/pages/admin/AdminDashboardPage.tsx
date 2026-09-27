import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { AdminLog } from '../../types';

interface Stats {
  totalVideos: number;
  activeCategories: number;
  totalUsers: number;
  totalFavorites: number;
  totalViews: number;
  totalFeatured: number;
  recentLogs: AdminLog[];
}

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const statsRes = await api.get('/admin/stats');
      const s = statsRes.data || {};
      setStats(s);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-[#151821] rounded-2xl" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Total Videos', value: (stats?.totalVideos ?? 0).toLocaleString(), icon: '📹', color: 'from-red-600/20 to-red-950/40' },
    { label: 'Active Categories', value: (stats?.activeCategories ?? 0).toString(), icon: '🏷️', color: 'from-amber-600/20 to-amber-950/40' },
    { label: 'Registered Users', value: (stats?.totalUsers ?? 0).toString(), icon: '👥', color: 'from-blue-600/20 to-blue-950/40' },
    { label: 'Total Favorites', value: (stats?.totalFavorites ?? 0).toLocaleString(), icon: '❤️', color: 'from-emerald-600/20 to-emerald-950/40' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white">Platform Dashboard</h1>
          <p className="text-xs text-zinc-400 mt-1">Real-time overview of ZoneTube platform metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            type="button"
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>🔄</span> Refresh Stats
          </button>
          <span className="px-3 py-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 text-xs font-bold rounded-full">
            ● System Healthy
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl bg-gradient-to-br ${c.color} border border-white/10 shadow-xl flex items-center justify-between`}
          >
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{c.label}</p>
              <h3 className="text-2xl font-black text-white mt-1">{c.value}</h3>
            </div>
            <span className="text-3xl p-3 bg-white/5 rounded-2xl border border-white/10">{c.icon}</span>
          </div>
        ))}
      </div>

      {/* Views Activity Chart Representation */}
      <div className="p-6 bg-[#151821] border border-white/10 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Playback Traffic Trends</h3>
            <p className="text-xs text-zinc-400">Total accumulated views: {(stats?.totalViews ?? 0).toLocaleString()}</p>
          </div>
          <span className="text-xs text-zinc-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
            Last 7 Days
          </span>
        </div>

        <div className="h-44 flex items-end justify-between gap-2 pt-6">
          {[40, 65, 52, 80, 74, 92, 88].map((h, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
              <div
                style={{ height: `${h}%` }}
                className="w-full bg-gradient-to-t from-red-800 to-[var(--accent-red)] rounded-t-lg transition-all duration-500 group-hover:brightness-125"
              />
              <span className="text-[10px] text-zinc-400 font-bold">Day {index + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Admin Activity Logs */}
      <div className="p-6 bg-[#151821] border border-white/10 rounded-3xl shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white">Recent System & Admin Actions</h3>
        <div className="space-y-2">
          {(stats?.recentLogs || []).map((log) => (
            <div
              key={log.id}
              className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 bg-white/5 rounded-lg text-sm">📜</span>
                <div>
                  <p className="font-bold text-white">{log.action}</p>
                  <p className="text-zinc-400 text-[11px]">By {log.admin_name}</p>
                </div>
              </div>
              <span className="text-zinc-500 text-[11px] font-mono">
                {log?.created_at ? new Date(log.created_at).toLocaleString() : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
