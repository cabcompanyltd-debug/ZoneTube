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

  React.useEffect(() => {
    setFav(isFavorited);
  }, [isFavorited]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !fav;
    setFav(nextState);

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
        const localFavs: string[] = JSON.parse(localStorage.getItem('zonetube_guest_favs') || '[]');
        const updated = nextState
          ? Array.from(new Set([...localFavs, video.id]))
          : localFavs.filter((id) => id !== video.id);
        localStorage.setItem('zonetube_guest_favs', JSON.stringify(updated));
      }

      showToast(nextState ? 'Added to favorites' : 'Removed from favorites', 'success');
    } catch (err: any) {
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
      className="video-card group relative bg-[#131620] hover:bg-[#181C28] border border-white/5 hover:border-white/20 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.985] flex flex-col justify-between"
      onClick={() => onOpen(video)}
    >
      <div className="thumbnail-wrap relative w-full aspect-video bg-zinc-950 overflow-hidden">
        <img
          src={video.thumbnail_url || 'https://thumb-cdn77.xvideos-cdn.com/3321fe93-631a-489f-ac06-9c3a981f85e0/6/xv_15_t.jpg'}
          alt={video.title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://thumb-cdn77.xvideos-cdn.com/3321fe93-631a-489f-ac06-9c3a981f85e0/6/xv_15_t.jpg';
          }}
        />

        {/* Duration badge */}
        {video.duration && (
          <span className="duration absolute bottom-2 right-2 bg-black/85 backdrop-blur-md text-white text-[11px] font-mono font-bold tracking-tight px-2 py-0.5 rounded-md border border-white/10 z-10 shadow-sm">
            {video.duration}
          </span>
        )}

        {/* Hover / Active Play Button Overlay */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-sm sm:text-base shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100 z-10 pointer-events-none"
          style={{
            backgroundColor: 'var(--accent-red)',
            boxShadow: '0 0 20px var(--accent-glow, rgba(229,9,20,0.5))',
          }}
        >
          ▶
        </div>

        {/* Quick Actions (Playlist / Favorite) with 40px touch hitboxes */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
          {onAddToPlaylist && (
            <button
              onClick={handlePlaylistClick}
              className="w-8 h-8 rounded-full bg-black/70 border border-white/10 text-zinc-300 hover:text-white hover:bg-black/90 backdrop-blur-md transition-all flex items-center justify-center text-xs active:scale-90 cursor-pointer"
              title="Add to playlist"
              aria-label="Add to playlist"
            >
              📁
            </button>
          )}

          <button
            onClick={handleFavoriteClick}
            type="button"
            className={`w-8 h-8 rounded-full backdrop-blur-md border transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-90 ${
              fav
                ? 'bg-red-950/90 border-red-500 text-red-500 shadow-md shadow-red-500/40'
                : 'bg-black/70 border-white/10 text-zinc-300 hover:text-red-400 hover:border-red-400/40 hover:bg-black/90'
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
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                fav ? "scale-110 drop-shadow-[0_0_6px_rgba(239,68,68,0.85)]" : ""
              }`}
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-3.5 flex gap-2.5 sm:gap-3 flex-1">
        {/* Author / Channel Initial Avatar */}
        <div
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0 border border-white/10 shadow-sm transition-transform group-hover:scale-105"
          style={{
            backgroundColor: 'var(--accent-red)',
            boxShadow: '0 2px 8px var(--accent-glow, rgba(229,9,20,0.35))',
          }}
        >
          {(video.channel || 'Z')[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="text-xs sm:text-sm font-bold text-white group-hover:text-[var(--accent-red)] transition-colors leading-snug line-clamp-2 overflow-hidden"
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

          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-400 mt-1 font-medium truncate">
            <span className="truncate hover:text-zinc-300">{video.channel || 'ZoneTube'}</span>
            {video.country_flag && (
              <span className="text-xs shrink-0" title={video.country || video.country_code}>
                {video.country_flag}
              </span>
            )}
          </div>

          {/* Clean Unboxed Metadata with · separator (anti-slop rule) */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-1 tabular-nums font-medium">
            <span>{formatViews(video.view_count || 0)} views</span>
            <span aria-hidden="true" className="text-zinc-500">·</span>
            <span className="hover:text-zinc-300 truncate">{video.category || 'General'}</span>
          </div>
        </div>
      </div>
    </article>
  );
};
