import React, { useState, useEffect } from 'react';
import { Video, Category } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useToast } from '../../contexts/ToastContext';
import { AIRewriteModal } from '../../components/admin/AIRewriteModal';
import api from '../../lib/api';

export const AdminVideosPage: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Bulk Selection State
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [aiRewriteVideo, setAiRewriteVideo] = useState<Video | null>(null);

  const { showToast } = useToast();

  // Form state for create/edit
  const [form, setForm] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    embed_url: '',
    category: 'General',
    tags: '',
    duration: '10:00',
    channel: 'ZoneTube',
    status: 'published' as 'published' | 'hidden',
    is_featured: false,
    is_trending: false,
    is_recommended: true,
  });

  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchVideos = async () => {
    try {
      setIsLoading(true);

      const allDeleted = localStorage.getItem('zonetube_all_videos_deleted') === 'true';
      if (allDeleted) {
        setVideos([]);
        setTotalCount(0);
        const catRes = await api.get('/categories');
        setCategories(catRes.data.categories || []);
        return;
      }

      const [vidRes, catRes] = await Promise.all([
        api.get('/videos?limit=10000'),
        api.get('/categories'),
      ]);
      const vids = vidRes.data.videos || [];
      let customVids: Video[] = [];
      try {
        const raw = localStorage.getItem('zonetube_custom_videos');
        if (raw) customVids = JSON.parse(raw);
      } catch (e) {}

      let deletedIds: string[] = [];
      try {
        deletedIds = JSON.parse(localStorage.getItem('zonetube_deleted_videos') || '[]');
      } catch (e) {}
      const deletedSet = new Set(deletedIds);

      const seen = new Set<string>();
      const merged: Video[] = [];
      for (const v of [...customVids, ...vids]) {
        if (!v || !v.id) continue;
        const ext = v.external_id || '';
        if (deletedSet.has(v.id) || (ext && deletedSet.has(ext))) continue;
        if (seen.has(v.id) || (ext && seen.has(ext))) continue;
        seen.add(v.id);
        if (ext) seen.add(ext);
        merged.push(v);
      }

      setVideos(merged);
      setTotalCount(vidRes.data.total ?? merged.length);
      setCategories(catRes.data.categories || []);
    } catch (err: any) {
      console.error('Failed to fetch videos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();

    const handleUpdate = () => {
      fetchVideos();
    };
    window.addEventListener('zonetube_videos_updated', handleUpdate);
    return () => {
      window.removeEventListener('zonetube_videos_updated', handleUpdate);
    };
  }, []);

  const filtered = videos.filter((v) => {
    if (!v) return false;
    const vTitle = typeof v.title === 'string' ? v.title : '';
    const vChan = typeof v.channel === 'string' ? v.channel : '';
    const vCat = typeof v.category === 'string' ? v.category : '';
    const searchNorm = (search || '').toLowerCase();

    const matchQ = vTitle.toLowerCase().includes(searchNorm) || vChan.toLowerCase().includes(searchNorm);
    const matchC = selectedCategory === 'All' || vCat.toLowerCase() === (selectedCategory || '').toLowerCase();
    return matchQ && matchC;
  });

  // Bulk Selection Handlers
  const isAllSelected = filtered.length > 0 && filtered.every((v) => selectedVideoIds.includes(v.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedVideoIds([]);
    } else {
      setSelectedVideoIds(filtered.map((v) => v.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedVideoIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // SILENT BULK DELETE (NO POPUPS)
  const handleBulkDeleteSilent = async () => {
    if (selectedVideoIds.length === 0) return;
    const idsToDelete = [...selectedVideoIds];
    const idsSet = new Set(idsToDelete);

    // Also collect all external_ids of the selected videos
    const extIdsToDelete: string[] = [];
    for (const v of videos) {
      if (idsSet.has(v.id) && v.external_id) {
        extIdsToDelete.push(v.external_id);
      }
    }
    const allIdsToPurge = Array.from(new Set([...idsToDelete, ...extIdsToDelete]));
    const allIdsSet = new Set(allIdsToPurge);

    // Immediate optimistic update
    setVideos((prev) => prev.filter((v) => !allIdsSet.has(v.id) && !allIdsSet.has(v.external_id || '')));
    setSelectedVideoIds([]);
    setTotalCount((prev) => Math.max(0, prev - idsToDelete.length));

    // Update localStorage immediately so reload never restores them
    try {
      const currentDeleted: string[] = JSON.parse(localStorage.getItem('zonetube_deleted_videos') || '[]');
      const updated = Array.from(new Set([...currentDeleted, ...allIdsToPurge]));
      localStorage.setItem('zonetube_deleted_videos', JSON.stringify(updated));

      const customVids: any[] = JSON.parse(localStorage.getItem('zonetube_custom_videos') || '[]');
      const updatedCustom = customVids.filter((v: any) => !allIdsSet.has(v.id) && !allIdsSet.has(v.external_id));
      localStorage.setItem('zonetube_custom_videos', JSON.stringify(updatedCustom));
    } catch (e) {}

    try {
      setIsDeletingBulk(true);
      const res = await api.post('/admin/videos/bulk-delete', { ids: allIdsToPurge });
      showToast(res.data?.message || `Permanently deleted ${idsToDelete.length} videos from database`, 'success');
      try {
        window.dispatchEvent(new CustomEvent('zonetube_videos_updated', { detail: { deletedIds: allIdsToPurge } }));
      } catch (e) {}
    } catch (err) {
      console.error('Bulk delete failed', err);
      showToast('Error deleting videos from database', 'error');
    } finally {
      setIsDeletingBulk(false);
      fetchVideos();
    }
  };

  // SINGLE DELETE WITH DATABASE CONFIRMATION
  const handleSingleDeleteSilent = async (id: string) => {
    const targetVideo = videos.find((v) => v.id === id || v.external_id === id);
    const targetId = targetVideo?.id || id;
    const targetExt = targetVideo?.external_id || '';

    const idsToRemove = new Set([id, targetId, ...(targetExt ? [targetExt] : [])].filter(Boolean));

    // Immediate optimistic update
    setVideos((prev) => prev.filter((v) => !idsToRemove.has(v.id) && !idsToRemove.has(v.external_id || '')));
    setSelectedVideoIds((prev) => prev.filter((item) => !idsToRemove.has(item)));
    setTotalCount((prev) => Math.max(0, prev - 1));

    // Update localStorage immediately so reload never restores it
    try {
      const currentDeleted: string[] = JSON.parse(localStorage.getItem('zonetube_deleted_videos') || '[]');
      idsToRemove.forEach((i) => {
        if (!currentDeleted.includes(i)) currentDeleted.push(i);
      });
      localStorage.setItem('zonetube_deleted_videos', JSON.stringify(currentDeleted));

      const customVids: any[] = JSON.parse(localStorage.getItem('zonetube_custom_videos') || '[]');
      const updatedCustom = customVids.filter((v: any) => !idsToRemove.has(v.id) && !idsToRemove.has(v.external_id));
      localStorage.setItem('zonetube_custom_videos', JSON.stringify(updatedCustom));
    } catch (e) {}

    try {
      const url = `/admin/videos/${targetId}${targetExt ? `?external_id=${encodeURIComponent(targetExt)}` : ''}`;
      const res = await api.delete(url);
      showToast(res.data?.message || 'Video permanently deleted from database', 'success');
      try {
        window.dispatchEvent(new CustomEvent('zonetube_videos_updated', { detail: { deletedId: targetId, deletedExt: targetExt } }));
      } catch (e) {}
    } catch (err) {
      console.error('Single delete failed', err);
      showToast('Failed to delete video from database', 'error');
      fetchVideos();
    }
  };

  const handleOpenCreate = () => {
    setForm({
      title: '',
      description: '',
      thumbnail_url: '',
      embed_url: '',
      category: categories[0]?.name || 'General',
      tags: '',
      duration: '10:00',
      channel: 'ZoneTube',
      status: 'published',
      is_featured: false,
      is_trending: false,
      is_recommended: true,
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (v: Video) => {
    setEditingVideo(v);
    setForm({
      title: v.title,
      description: v.description,
      thumbnail_url: v.thumbnail_url,
      embed_url: v.embed_url,
      category: v.category,
      tags: Array.isArray(v.tags) ? v.tags.join(', ') : '',
      duration: v.duration,
      channel: v.channel,
      status: v.status,
      is_featured: v.is_featured,
      is_trending: v.is_trending,
      is_recommended: v.is_recommended,
    });
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedTags = form.tags
        ? (form.tags as string).split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [];

      const payload = {
        ...form,
        tags: parsedTags,
      };

      if (editingVideo) {
        await api.put(`/admin/videos/${editingVideo.id}`, payload);
        setEditingVideo(null);
      } else {
        await api.post('/admin/videos', payload);
        setIsCreateOpen(false);
      }
      fetchVideos();
    } catch (err: any) {
      console.error('Failed to save video:', err);
    }
  };

  const handleDeleteAllVideos = async () => {
    if (!window.confirm('Are you sure you want to DELETE ALL VIDEOS in the database? This action cannot be undone.')) {
      return;
    }
    const prevVideos = [...videos];
    setVideos([]);
    setSelectedVideoIds([]);
    setTotalCount(0);

    // Update localStorage immediately
    try {
      localStorage.setItem('zonetube_all_videos_deleted', 'true');
      localStorage.setItem('zonetube_deleted_videos', '[]');
      localStorage.setItem('zonetube_custom_videos', '[]');
      localStorage.setItem('zonetube_total_imported_count', '0');
    } catch (e) {}

    try {
      const res = await api.delete('/admin/videos/delete-all');
      showToast(res.data?.message || 'All videos deleted successfully', 'success');
      try {
        window.dispatchEvent(new CustomEvent('zonetube_videos_updated', { detail: { allDeleted: true } }));
      } catch (e) {}
      fetchVideos();
    } catch (err: any) {
      setVideos(prevVideos);
      showToast(err.message || 'Failed to delete all videos', 'error');
      fetchVideos();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-full overflow-x-hidden">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight">Video Management</h1>
            <span className="px-3 py-1 bg-red-600/20 text-[var(--accent-red)] border border-red-500/30 rounded-full font-mono text-xs font-black">
              {(totalCount || videos.length).toLocaleString()} Total Videos in Database
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manage, bulk check, filter, or hide video streams. Showing {filtered.length} of {(totalCount || videos.length).toLocaleString()} records.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <button
            onClick={handleDeleteAllVideos}
            disabled={videos.length === 0}
            className="px-4 py-2 bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-xs rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Delete all videos in the database"
          >
            <span>🗑️</span>
            <span>Delete All Videos ({videos.length})</span>
          </button>

          {selectedVideoIds.length > 0 && (
            <button
              onClick={handleBulkDeleteSilent}
              disabled={isDeletingBulk}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center gap-2"
              title="Silent delete all checked videos"
            >
              <span>🗑️</span>
              <span>Delete Checked ({selectedVideoIds.length})</span>
            </button>
          )}
          <Button onClick={handleOpenCreate}>＋ Add Video</Button>
        </div>
      </div>

      {/* Filters & Bulk Controls bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#151821] p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 bg-black/40 px-3 py-2 rounded-xl border border-white/10 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded accent-[var(--accent-red)] cursor-pointer"
            />
            <span>Select All ({filtered.length})</span>
          </label>

          {selectedVideoIds.length > 0 && (
            <span className="text-xs font-bold text-red-400 bg-red-950/60 px-2.5 py-1 rounded-lg border border-red-800/40">
              {selectedVideoIds.length} Selected
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1 max-w-xl justify-end">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--accent-red)] cursor-pointer"
          >
            <option value="All">📁 All Categories ({videos.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.icon || '📁'} {c.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search video title or channel..."
            className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--accent-red)]"
          />
        </div>
      </div>

      {/* Video Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#151821] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-[#151821] border border-white/10 rounded-2xl overflow-hidden shadow-xl max-w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <thead>
                <tr className="bg-black/50 text-zinc-400 border-b border-white/10 font-bold uppercase tracking-wider">
                  <th className="p-3 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded accent-[var(--accent-red)] cursor-pointer"
                    />
                  </th>
                  <th className="p-3 w-8/12">Video Stream & Title</th>
                  <th className="p-3 w-2/12 text-center">Status</th>
                  <th className="p-3 w-2/12 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((v, idx) => {
                  const isChecked = selectedVideoIds.includes(v.id);
                  return (
                    <tr
                      key={`${v.id}-${idx}`}
                      className={`transition-colors ${
                        isChecked ? 'bg-red-950/20 hover:bg-red-950/30' : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOne(v.id)}
                          className="w-4 h-4 rounded accent-[var(--accent-red)] cursor-pointer"
                        />
                      </td>

                      {/* Video Stream & Shortened Title */}
                      <td className="p-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={v.thumbnail_url}
                            alt=""
                            className="w-14 h-9 rounded-md object-cover bg-zinc-900 border border-white/10 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className="font-bold text-white truncate text-xs"
                              title={v.title}
                            >
                              {v.title}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5 truncate">
                              <span className="px-1.5 py-0.5 bg-red-950/70 border border-red-500/30 text-red-300 font-bold rounded text-[9px] shrink-0">
                                {v.category}
                              </span>
                              <span className="truncate">{v.channel}</span>
                              <span>•</span>
                              <span>{v.duration}</span>
                              {v.is_featured && <span title="Featured">⭐</span>}
                              {v.is_trending && <span title="Trending">🔥</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Icons instead of text badges */}
                      <td className="p-3 text-center">
                        {v.status === 'published' ? (
                          <span
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 shadow-sm"
                            title="Published & Active"
                          >
                            👁️
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 shadow-sm"
                            title="Hidden / Draft"
                          >
                            🙈
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setAiRewriteVideo(v)}
                            className="px-2.5 py-1.5 flex items-center gap-1 bg-gradient-to-r from-purple-900/60 to-red-900/60 hover:from-purple-800 hover:to-red-800 border border-purple-500/40 text-purple-200 font-bold rounded-lg transition-all text-[11px] cursor-pointer shadow-sm"
                            title="Uncensored AI Title & Description Rewrite"
                          >
                            <span>✨</span>
                            <span className="hidden sm:inline">AI Rewrite</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(v)}
                            className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Edit Details"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleSingleDeleteSilent(v.id)}
                            className="w-8 h-8 flex items-center justify-center bg-red-950/50 hover:bg-red-900/80 text-red-400 hover:text-red-200 rounded-lg transition-colors cursor-pointer"
                            title="Silent Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isCreateOpen || !!editingVideo}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingVideo(null);
        }}
        title={editingVideo ? 'Edit Video Details' : 'Add Manual Video'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveVideo} className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="bg-[#151821] border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[var(--accent-red)]"
            />
          </div>

          <Input
            label="Embed URL (e.g. XVideos or YouTube Embed)"
            value={form.embed_url}
            onChange={(e) => setForm({ ...form, embed_url: e.target.value })}
            required
          />

          <Input
            label="Thumbnail URL"
            value={form.thumbnail_url}
            onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase">Tags (comma-separated for search & discovery)</label>
            <input
              type="text"
              value={form.tags || ''}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="e.g. 4k, trending, cinema, cosplay, vr, popular"
              className="bg-[#151821] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[var(--accent-red)]"
            />
            <p className="text-[10px] text-zinc-400">Separate multiple tags with commas for better video discovery.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="bg-[#151821] border border-white/10 rounded-lg p-2.5 text-xs text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="bg-[#151821] border border-white/10 rounded-lg p-2.5 text-xs text-white"
              >
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              />
              Is Featured
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_trending}
                onChange={(e) => setForm({ ...form, is_trending: e.target.checked })}
              />
              Is Trending
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingVideo(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Save Video</Button>
          </div>
        </form>
      </Modal>

      {/* AIRewriteModal */}
      <AIRewriteModal
        video={aiRewriteVideo}
        isOpen={!!aiRewriteVideo}
        onClose={() => setAiRewriteVideo(null)}
        onSuccess={(updated) => {
          setVideos((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
          setAiRewriteVideo(null);
        }}
      />
    </div>
  );
};
