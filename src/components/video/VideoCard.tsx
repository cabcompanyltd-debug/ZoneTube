import React from 'react';
import { Video } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';

interface VideoCardProps {
  video: Video;
  onOpen: (video: Video) => void;
  isFavorited?: boolean;
  onFavoriteToggle?: (videoId: string, isFav: boolean) => void;
  onAddToPlaylist?: (video: Video) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onOpen,
  isFavorited = false,
  onFavoriteToggle,
  onAddToPlaylist,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [fav, setFav] = React.useState(isFavorited);
  const [isCardHovered, setIsCardHovered] = React.useState(false);

  React.useEffect(() => {
    setFav(isFavorited);
  }, [isFavorited]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !fav;
    setFav(nextState);

    // Notify parent / global state immediately for instant disappearing across pages
    if (onFavoriteToggle) {
      onFavoriteToggle(video.id, nextState);
    }

    try {
      if (user) {
        if (nextState) {
          await api.post('/favorites', { video_id: video.id });
        } else {
          await api.delete(`/favorites/${video.id}`);
        }
      } else {
        // Save to guest favorites in localStorage so guests can favorite immediately
        const localFavs: string[] = JSON.parse(localStorage.getItem('zonetube_guest_favs') || '[]');
        const updated = nextState
          ? Array.from(new Set([...localFavs, video.id]))
          : localFavs.filter((id) => id !== video.id);
        localStorage.setItem('zonetube_guest_favs', JSON.stringify(updated));
      }

      showToast(nextState ? 'Added to favorites' : 'Removed from favorites', 'success');
    } catch (err: any) {
      // Revert if API fails
      setFav(!nextState);
      if (onFavoriteToggle) {
        onFavoriteToggle(video.id, !nextState);
      }
      showToast(err.message || 'Failed to update favorite', 'error');
    }
  };

  const handlePlaylistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToast('Please sign in to add videos to playlists', 'info');
      return;
    }
    if (onAddToPlaylist) {
      onAddToPlaylist(video);
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K`;
    return `${views}`;
  };

  return (
    <article
      className="video-card group relative bg-[#151821] border border-white/5 hover:border-white/20 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between"
      onClick={() => onOpen(video)}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
    >
      <div className="thumbnail-wrap relative w-full aspect-video bg-zinc-900 overflow-hidden">
        <img
          src={video.thumbnail_url || 'https://thumb-cdn77.xvideos-cdn.com/3321fe93-631a-489f-ac06-9c3a981f85e0/6/xv_15_t.jpg'}
          alt={video.title}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://thumb-cdn77.xvideos-cdn.com/3321fe93-631a-489f-ac06-9c3a981f85e0/6/xv_15_t.jpg';
          }}
        />
        {video.duration && (
          <span className="duration absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded border border-white/10 z-10">
            {video.duration}
          </span>
        )}

        {/* Centered Play Button (appears in middle on hover) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center text-white text-base shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100 z-10 pointer-events-none"
          style={{
            backgroundColor: 'var(--accent-red)',
            boxShadow: '0 0 20px var(--accent-glow, rgba(229,9,20,0.5))',
          }}
        >
          ▶
        </div>

        {/* Action icons top right */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
          {onAddToPlaylist && (
            <button
              onClick={handlePlaylistClick}
              className="p-1.5 rounded-full bg-black/60 border border-white/10 text-zinc-300 hover:text-white hover:bg-black/80 backdrop-blur-md transition-all text-xs cursor-pointer"
              title="Add to playlist"
              aria-label="Add to playlist"
            >
              📁
            </button>
          )}

          <button
            onClick={handleFavoriteClick}
            type="button"
            className={`p-1.5 rounded-full backdrop-blur-md border transition-all duration-300 flex items-center justify-center cursor-pointer ${
              fav
                ? 'bg-red-950/90 border-red-500 text-red-500 shadow-lg shadow-red-500/40 ring-2 ring-red-500/50 scale-110'
                : 'bg-black/65 border-white/15 text-zinc-400 hover:text-red-400 hover:border-red-400/40 hover:bg-black/90'
            }`}
            title={fav ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={fav ? "#ef4444" : "none"}
              stroke={fav ? "#ef4444" : "currentColor"}
              strokeWidth={fav ? "1" : "2"}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-3.5 h-3.5 transition-all duration-300 ${
                fav
                  ? "text-red-500 fill-red-500 scale-110 drop-shadow-[0_0_6px_rgba(239,68,68,0.85)]"
                  : "text-zinc-300 hover:text-red-400"
              }`}
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-3.5 flex gap-3 flex-1">
        {/* User / Channel Profile Icon beside title, styled with dynamic theme accent color */}
        <div
          className="w-9 h-9 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0 border border-white/10 shadow-md transition-all"
          style={{
            backgroundColor: 'var(--accent-red)',
            boxShadow: '0 2px 8px var(--accent-glow, rgba(229,9,20,0.35))',
          }}
        >
          {(video.channel || 'Z')[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Strictly 2-line clamped title */}
          <h3
            className="text-sm font-bold text-white group-hover:text-[var(--accent-red)] transition-colors leading-snug line-clamp-2 overflow-hidden"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}
            title={video.title}
          >
            {video.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1 font-medium truncate">
            <span className="truncate">{video.channel || 'ZoneTube'}</span>
            {video.country_flag && (
              <span className="text-xs shrink-0" title={video.country || video.country_code}>
                {video.country_flag}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
            <span>{formatViews(video.view_count || 0)} views</span>
            <span>•</span>
            <span className="px-1.5 py-0.2 bg-white/5 border border-white/10 rounded text-[10px] text-zinc-300">
              {video.category}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
