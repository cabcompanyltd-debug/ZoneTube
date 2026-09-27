import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Playlist, Video } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: Video | null;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  video,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const fetchPlaylists = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await api.get('/playlists');
      setPlaylists(res.data.playlists || []);
    } catch (err: any) {
      console.error('Failed to load playlists:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchPlaylists();
    }
  }, [isOpen, user]);

  if (!video) return null;

  const handleToggleVideoInPlaylist = async (playlist: Playlist) => {
    const isAlreadyIn = playlist.video_ids.includes(video.id);
    try {
      if (isAlreadyIn) {
        await api.delete(`/playlists/${playlist.id}/videos/${video.id}`);
        showToast(`Removed from playlist "${playlist.name}"`);
      } else {
        await api.post(`/playlists/${playlist.id}/videos`, { video_id: video.id });
        showToast(`Added to playlist "${playlist.name}"`);
      }
      fetchPlaylists();
    } catch (err: any) {
      showToast(err.message || 'Failed to update playlist', 'error');
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      setIsCreating(true);
      const createRes = await api.post('/playlists', { name: newPlaylistName.trim() });
      const newPl = createRes.data.playlist;
      showToast(`Playlist "${newPl.name}" created`);

      // Add video to the newly created playlist
      await api.post(`/playlists/${newPl.id}/videos`, { video_id: video.id });
      showToast(`Added video to "${newPl.name}"`);

      setNewPlaylistName('');
      fetchPlaylists();
    } catch (err: any) {
      showToast(err.message || 'Failed to create playlist', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Video to Playlist" maxWidth="sm">
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-3 bg-black/40 border border-white/5 rounded-2xl">
          <img
            src={video.thumbnail_url}
            alt=""
            className="w-16 aspect-video rounded-lg object-cover shrink-0 bg-zinc-900 border border-white/10"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white line-clamp-1">{video.title}</h4>
            <p className="text-[11px] text-zinc-400 truncate">{video.channel}</p>
          </div>
        </div>

        {/* Existing Playlists List */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Your Playlists
          </label>

          {isLoading ? (
            <div className="space-y-2">
              <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
              <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
            </div>
          ) : playlists.length === 0 ? (
            <p className="text-xs text-zinc-500 py-2">No playlists yet. Create your first playlist below!</p>
          ) : (
            playlists.map((pl, idx) => {
              const inPlaylist = pl.video_ids.includes(video.id);
              return (
                <button
                  key={`${pl.id}-${idx}`}
                  onClick={() => handleToggleVideoInPlaylist(pl)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                    inPlaylist
                      ? 'bg-red-950/40 border-red-500 text-white'
                      : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{inPlaylist ? '✅' : '📁'}</span>
                    <span className="font-bold truncate">{pl.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                    {pl.video_ids.length} videos
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Create New Playlist Form */}
        <form onSubmit={handleCreatePlaylist} className="pt-3 border-t border-white/10 space-y-3">
          <Input
            label="Create New Playlist"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="e.g. Travel Favorites"
          />
          <Button type="submit" size="sm" isLoading={isCreating} disabled={!newPlaylistName.trim()} className="w-full">
            ＋ Create & Add Video
          </Button>
        </form>
      </div>
    </Modal>
  );
};
