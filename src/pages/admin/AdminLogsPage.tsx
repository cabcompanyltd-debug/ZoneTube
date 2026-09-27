import React, { useState, useEffect } from 'react';
import { AdminLog } from '../../types';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';

export const AdminLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'video' | 'user' | 'site_settings'>('all');
  const [isClearing, setIsClearing] = useState(false);

  const { showToast } = useToast();

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/logs');
      setLogs(res.data.logs || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch logs', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all system audit logs? This cannot be undone.')) {
      return;
    }

    try {
      setIsClearing(true);
      await api.delete('/admin/logs/clear');
      showToast('System audit logs cleared successfully');
      setLogs([]);
    } catch (err: any) {
      showToast(err.message || 'Failed to clear logs', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('import') || action.includes('video')) return '📹';
    if (action.includes('user') || action.includes('role')) return '👤';
    if (action.includes('setting')) return '⚙️';
    if (action.includes('delete')) return '🗑️';
    return '📜';
  };

  const filteredLogs = logs.filter((log) => {
    const matchesQuery =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.admin_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.target_type && log.target_type.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || log.target_type === categoryFilter;
    return matchesQuery && matchesCategory;
  });

  const importCount = logs.filter((l) => l.target_type === 'video' || l.action.includes('import')).length;
  const userCount = logs.filter((l) => l.target_type === 'user' || l.action.includes('user')).length;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span>📋</span> System & Access Audit Logs
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time audit log tracking administrative changes, user management actions, and stream imports on InsForge DB.
          </p>
        </div>

        {logs.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClearLogs}
            isLoading={isClearing}
            className="self-start sm:self-auto text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
          >
            🗑️ Clear Audit Logs
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-[#151821] border border-white/10 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Total Audit Events</p>
            <p className="text-2xl font-black text-white mt-1">{logs.length}</p>
          </div>
          <span className="p-3 bg-red-600/20 text-red-400 rounded-xl text-xl">📜</span>
        </div>

        <div className="p-5 bg-[#151821] border border-white/10 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Video & Import Events</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{importCount}</p>
          </div>
          <span className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl text-xl">📹</span>
        </div>

        <div className="p-5 bg-[#151821] border border-white/10 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Account & Auth Events</p>
            <p className="text-2xl font-black text-blue-400 mt-1">{userCount}</p>
          </div>
          <span className="p-3 bg-blue-600/20 text-blue-400 rounded-xl text-xl">🛡️</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#151821] border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action or administrator..."
            className="w-full bg-black/60 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--accent-red)]"
          />
          <span className="absolute right-3 top-2.5 text-zinc-500 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-zinc-400 font-bold">Target Type:</span>
          <div className="flex bg-black/60 border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                categoryFilter === 'all' ? 'bg-[var(--accent-red)] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setCategoryFilter('video')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                categoryFilter === 'video' ? 'bg-[var(--accent-red)] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Videos
            </button>
            <button
              onClick={() => setCategoryFilter('user')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                categoryFilter === 'user' ? 'bg-[var(--accent-red)] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setCategoryFilter('site_settings')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                categoryFilter === 'site_settings'
                  ? 'bg-[var(--accent-red)] text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="bg-[#151821] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-black/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 font-bold">
            <span className="text-3xl block mb-2">📜</span>
            No audit logs found matching your criteria.
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div
              key={`${log.id}-${idx}`}
              className="p-4 bg-black/40 border border-white/5 hover:border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-base shadow-sm">
                  {getActionIcon(log.action)}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-white text-sm capitalize">
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    <span className="text-[10px] font-mono bg-white/10 text-zinc-300 px-2 py-0.5 rounded-full uppercase">
                      {log.target_type || 'system'}
                    </span>
                  </div>

                  <p className="text-zinc-400 text-xs mt-0.5">
                    By Administrator: <strong className="text-zinc-200">{log.admin_name}</strong>
                  </p>

                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(log.metadata).map(([k, v]) => (
                        <span
                          key={k}
                          className="text-[10px] font-mono bg-red-950/40 text-red-300 border border-red-800/30 px-2 py-0.5 rounded"
                        >
                          {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right sm:text-right self-end sm:self-center font-mono text-[11px] text-zinc-500">
                {new Date(log.created_at).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
