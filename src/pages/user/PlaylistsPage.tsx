import React, { useState, useEffect } from 'react';
import { Playlist, Video } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';

interface PlaylistsPageProps {
  onOpenVideo: (video: Video) => void;
  favoritesSet: Set<string>;
  onFavoriteToggle: (videoId: string, isFav: boolean) => void;
  onAddToPlaylist: (video: Video) => void;
}

export const PlaylistsPage: React.FC<PlaylistsPageProps> = ({
  onOpenVideo,
  favoritesSet,
  onFavoriteToggle,
  onAddToPlaylist,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [deletingPlaylistId, setDeletingPlaylistId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { showToast } = useToast();

  const fetchPlaylists = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/playlists');
      const loaded: Playlist[] = res.data.playlists || [];
      setPlaylists(loaded);

      if (selectedPlaylist) {
        const updatedSelected = loaded.find((p) => p.id === selectedPlaylist.id);
        if (updatedSelected) setSelectedPlaylist(updatedSelected);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch playlists', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleOpenCreate = () => {
    setName('');
    setDescription('');
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (pl: Playlist, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPlaylist(pl);
    setName(pl.name);
    setDescription(pl.description || '');
  };

  const handleSavePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSaving(true);
      if (editingPlaylist) {
        await api.put(`/playlists/${editingPlaylist.id}`, { name, description });
        showToast('Playlist updated');
        setEditingPlaylist(null);
      } else {
        await api.post('/playlists', { name, description });
        showToast('Playlist created');
        setIsCreateOpen(false);
      }
      fetchPlaylists();
    } catch (err: any) {
      showToast(err.message || 'Failed to save playlist', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPlaylistId) return;
    try {
      await api.delete(`/playlists/${deletingPlaylistId}`);
      showToast('Playlist deleted');
      if (selectedPlaylist?.id === deletingPlaylistId) {
        setSelectedPlaylist(null);
      }
      setDeletingPlaylistId(null);
      fetchPlaylists();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete playlist', 'error');
    }
  };

  const handleRemoveVideoFromPlaylist = async (playlistId: string, videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/playlists/${playlistId}/videos/${videoId}`);
      showToast('Video removed from playlist');
      fetchPlaylists();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove video', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <span>📁</span> User Playlists
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Create custom video collections and organize your favorite streams.
          </p>
        </div>

        <Button onClick={handleOpenCreate}>＋ Create New Playlist</Button>
      </div>

      {/* Playlist Details View if Selected */}
      {selectedPlaylist ? (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedPlaylist(null)}
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
          >
            ← Back to All Playlists
          </button>

          <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/60 via-[#151821] to-[#08090D] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
            <div>
              <span className="px-3 py-1 bg-[var(--accent-red)] text-white text-[10px] font-extrabold uppercase rounded-full">
                Custom Playlist
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                {selectedPlaylist.name}
              </h2>
              <p className="text-xs text-zinc-300 mt-1">
                {selectedPlaylist.description || 'No description provided.'} •{' '}
                <span className="font-bold">{selectedPlaylist.videos?.length || 0} Videos</span>
              </p>
            </div>

            {selectedPlaylist.videos && selectedPlaylist.videos.length > 0 && (
              <Button size="lg" onClick={() => onOpenVideo(selectedPlaylist.videos![0])}>
                ▶ Play All
              </Button>
            )}
          </div>

          {/* Videos inside Playlist */}
          <div className="space-y-3">
            {!selectedPlaylist.videos || selectedPlaylist.videos.length === 0 ? (
              <div className="text-center py-12 bg-[#151821] border border-white/5 rounded-2xl">
                <span className="text-4xl">📹</span>
                <h3 className="text-base font-bold text-white mt-2">Playlist is empty</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Add videos to this playlist by clicking the 📁 icon on any video card!
                </p>
              </div>
            ) : (
              selectedPlaylist.videos.map((video, idx) => (
                <div
                  key={`${video.id}-${idx}`}
                  onClick={() => onOpenVideo(video)}
                  className="flex items-center justify-between p-3 bg-[#151821] border border-white/5 hover:border-white/20 rounded-2xl cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-xs font-mono font-bold text-zinc-500 w-6 text-center">
                      #{idx + 1}
                    </span>

                    <div className="relative w-32 aspect-video bg-zinc-900 rounded-xl overflow-hidden shrink-0">
                      <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      {video.duration && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-bold">
                          {video.duration}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                        {video.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{video.channel} • {video.category}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleRemoveVideoFromPlaylist(selectedPlaylist.id, video.id, e)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors text-xs font-bold"
                    title="Remove video from playlist"
                  >
                    Remove ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Playlists Grid */
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-44 bg-[#151821] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-16 bg-[#151821] border border-white/5 rounded-3xl">
              <span className="text-5xl">📁</span>
              <h3 className="text-lg font-bold text-white mt-3">No Playlists Created Yet</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-6">
                Organize your streaming experience by creating playlists for music, travel, tutorials and more.
              </p>
              <Button onClick={handleOpenCreate}>＋ Create First Playlist</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {playlists.map((pl, idx) => {
                const coverThumb =
                  pl.videos?.[0]?.thumbnail_url ||
                  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80';

                return (
                  <div
                    key={`${pl.id}-${idx}`}
                    onClick={() => setSelectedPlaylist(pl)}
                    className="p-5 bg-[#151821] border border-white/10 hover:border-white/20 rounded-3xl cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col justify-between group"
                  >
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 mb-3 border border-white/5">
                      <img
                        src={coverThumb}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <span className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-black text-xs border border-white/10">
                        📁 {pl.video_ids.length} Videos
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors truncate">
                          {pl.name}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => handleOpenEdit(pl, e)}
                            className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-white/10"
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingPlaylistId(pl.id);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-red-400 rounded hover:bg-white/10"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-1 mt-1 font-normal">
                        {pl.description || 'Custom user video playlist'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isCreateOpen || !!editingPlaylist}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingPlaylist(null);
        }}
        title={editingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}
      >
        <form onSubmit={handleSavePlaylist} className="space-y-4">
          <Input
            label="Playlist Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chill Music & Workouts"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional summary of this playlist..."
              rows={3}
              className="bg-[#151821] border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[var(--accent-red)]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingPlaylist(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Save Playlist
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingPlaylistId}
        onClose={() => setDeletingPlaylistId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Playlist"
        message="Are you sure you want to delete this playlist? The videos will remain in the catalog."
      />
    </div>
  );
};
