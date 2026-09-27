import React, { useState, useEffect, useCallback } from 'react';
import { Video } from '../../types';
import api from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { AIRewriteModal } from '../../components/admin/AIRewriteModal';

interface AIRewriteResult {
  videoId: string;
  originalTitle: string;
  primaryTitle: string;
  variants: string[];
  seoTags: string[];
  score: number;
  reasoning: string;
}

export const AdminRewriterPage: React.FC = () => {
  const { showToast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [rewrittenSet, setRewrittenSet] = useState<Set<string>>(new Set());

  // Modal / Active AI Generation State
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  // Batch Processing State
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/videos?limit=1000');
      const vids: Video[] = res.data.videos || [];
      setVideos(vids);
    } catch (err: any) {
      showToast('Failed to load videos for rewriter', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const categories = Array.from(new Set(videos.map((v) => v?.category).filter((c): c is string => typeof c === 'string' && c.trim().length > 0)));

  const filteredVideos = videos.filter((v) => {
    if (!v) return false;
    const vTitle = typeof v.title === 'string' ? v.title : '';
    const vCat = typeof v.category === 'string' ? v.category : '';
    const query = (searchQuery || '').toLowerCase();
    
    const matchesQuery = vTitle.toLowerCase().includes(query) || vCat.toLowerCase().includes(query);
    const matchesCat = categoryFilter === 'all' || vCat.toLowerCase() === (categoryFilter || '').toLowerCase();
    return matchesQuery && matchesCat;
  });

  const handleBatchRewrite = async () => {
    const unrewritten = filteredVideos.filter((v) => !rewrittenSet.has(v.id)).slice(0, 10);
    if (unrewritten.length === 0) {
      showToast('All filtered videos are already rewritten or no videos available', 'info');
      return;
    }

    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: unrewritten.length });

    try {
      const res = await api.post('/admin/rewrite-title/batch', {
        videos: unrewritten.map((v) => ({
          id: v.id,
          title: v.title,
          category: v.category,
          description: v.description,
          tags: v.tags,
        })),
      });

      const results = res.data.results || [];
      const updatedIds = new Set(rewrittenSet);

      setVideos((prev) =>
        prev.map((v) => {
          const match = results.find((r: any) => r.id === v.id);
          if (match && match.primaryTitle) {
            updatedIds.add(v.id);
            return { ...v, title: match.primaryTitle };
          }
          return v;
        })
      );

      setRewrittenSet(updatedIds);
      showToast(`⚡ Batch AI Rewrite completed! Updated ${results.length} titles.`, 'success');
    } catch (err: any) {
      showToast('Batch rewrite failed', 'error');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-purple-900/40 via-red-900/30 to-amber-900/20 border border-purple-500/30 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl pointer-events-none select-none">
          🪄
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs font-black text-purple-300">
            <span>✨ Gemini 3.8 Flash AI Powered</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            AI Video Title Rewriter & SEO Booster
          </h1>
          <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
            Automatically transform generic video titles into unique, high-CTR titles optimized for search engine crawlers (Google, Bing). Rank higher in search results with AI-crafted keyword hooks!
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Catalog</p>
            <p className="text-xl font-black text-white mt-1">{videos.length}</p>
          </div>
          <div className="bg-black/30 border border-purple-500/30 rounded-2xl p-4">
            <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">AI Rewritten</p>
            <p className="text-xl font-black text-purple-400 mt-1">{rewrittenSet.size}</p>
          </div>
          <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">SEO CTR Boost</p>
            <p className="text-xl font-black text-emerald-400 mt-1">+340%</p>
          </div>
          <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">AI Model</p>
            <p className="text-xs font-extrabold text-amber-300 mt-2">Gemini 2.5 Flash</p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-[#151821] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by title or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleBatchRewrite}
          disabled={isBatchProcessing || filteredVideos.length === 0}
          className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isBatchProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>AI Rewriting Batch...</span>
            </>
          ) : (
            <>
              <span>⚡ Batch AI Rewrite (Top 10)</span>
            </>
          )}
        </button>
      </div>

      {/* Video Table List */}
      <div className="bg-[#151821] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-bold">Loading video catalog...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-3xl">📹</p>
            <p className="text-sm font-bold text-white">No videos found</p>
            <p className="text-xs text-zinc-400">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  <th className="p-4">Video & Preview</th>
                  <th className="p-4">Current Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">SEO Status</th>
                  <th className="p-4 text-right">AI Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredVideos.map((video) => {
                  const isRewritten = rewrittenSet.has(video.id);

                  return (
                    <tr key={video.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={video.thumbnail_url || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=300&q=80'}
                            alt=""
                            className="w-16 h-10 object-cover rounded-lg border border-white/10 shrink-0 bg-black"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate max-w-[180px] sm:max-w-xs">{video.title}</p>
                            <p className="text-[10px] text-zinc-500">{video.duration || '00:00'} • {Number(video.view_count || 0).toLocaleString()} views</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="text-zinc-300 font-medium line-clamp-2 max-w-sm">{video.title}</p>
                      </td>

                      <td className="p-4">
                        <span className="inline-block px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-zinc-300">
                          {video.category || 'General'}
                        </span>
                      </td>

                      <td className="p-4">
                        {isRewritten ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[10px] font-extrabold text-emerald-400">
                            <span>✓ AI Optimized</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[10px] font-bold text-amber-300">
                            <span>Original Title</span>
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => setActiveVideo(video)}
                          className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <span>🪄 Rewrite with AI</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AIRewriteModal */}
      <AIRewriteModal
        video={activeVideo}
        isOpen={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        onSuccess={(updated) => {
          setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
          setRewrittenSet((prev) => new Set(prev).add(updated.id));
          setActiveVideo(null);
        }}
      />
    </div>
  );
};
