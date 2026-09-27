import React, { useState, useEffect } from 'react';
import { Video, WatchHistoryItem } from '../../types';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';

interface WatchHistoryPageProps {
  onOpenVideo: (video: Video) => void;
  onAddToPlaylist?: (video: Video) => void;
}

export const WatchHistoryPage: React.FC<WatchHistoryPageProps> = ({
  onOpenVideo,
  onAddToPlaylist,
}) => {
  const [historyItems, setHistoryItems] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/history');
      setHistoryItems(res.data.history || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load history', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRemoveItem = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/history/${videoId}`);
      setHistoryItems((prev) => prev.filter((h) => h.video_id !== videoId));
      showToast('Item removed from history');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove item', 'error');
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.delete('/history');
      setHistoryItems([]);
      showToast('Watch history cleared');
    } catch (err: any) {
      showToast(err.message || 'Failed to clear history', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span>🕒</span> Watch History
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Videos you have watched on ZoneTube.
          </p>
        </div>

        {historyItems.length > 0 && (
          <Button variant="danger" size="sm" onClick={handleClearHistory}>
            Clear Entire History
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-[#151821] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : historyItems.length === 0 ? (
        <div className="text-center py-12 bg-[#151821] rounded-2xl border border-white/5">
          <span className="text-4xl">🕒</span>
          <h3 className="text-lg font-bold text-white mt-3">Watch history is empty</h3>
          <p className="text-xs text-zinc-400 mt-1">Videos you play will automatically appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {historyItems.map((item, idx) => {
            const video = item.video;
            if (!video) return null;

            return (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => onOpenVideo(video)}
                className="flex items-center justify-between p-3 bg-[#151821] border border-white/5 hover:border-white/20 rounded-2xl cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-36 aspect-video bg-zinc-900 rounded-xl overflow-hidden shrink-0">
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {video.duration && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-bold">
                        {video.duration}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                      {video.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">{video.channel}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Watched {new Date(item.watched_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onAddToPlaylist && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToPlaylist(video);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/10 rounded-lg transition-colors"
                      title="Add to Playlist"
                    >
                      📋 + Playlist
                    </button>
                  )}
                  <button
                    onClick={(e) => handleRemoveItem(video.id, e)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors text-sm"
                    title="Remove from history"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
