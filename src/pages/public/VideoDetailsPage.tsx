import React, { useState, useEffect, useRef } from 'react';
import { Video } from '../../types';
import { VideoPlayer } from '../../components/video/VideoPlayer';
import { Button } from '../../components/common/Button';
import { CommentsModal } from '../../components/video/CommentsModal';
import { ShareModal } from '../../components/video/ShareModal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';
import { getSEOVideoUrl } from '../../lib/seoUtils';

interface VideoDetailsPageProps {
  videoId: string;
  onOpenVideo: (video: Video) => void;
  onBack: () => void;
  favoritesSet: Set<string>;
  onFavoriteToggle: (videoId: string, isFav: boolean) => void;
  onAddToPlaylist?: (video: Video) => void;
}

export const VideoDetailsPage: React.FC<VideoDetailsPageProps> = ({
  videoId,
  onOpenVideo,
  onBack,
  favoritesSet,
  onFavoriteToggle,
  onAddToPlaylist,
}) => {
  const [video, setVideo] = useState<Video | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const tagsScrollRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState<Array<{ id: string; name: string; text: string; date: string }>>([
    {
      id: 'c_default_1',
      name: 'Alex Rider',
      text: 'Amazing high quality video stream! Runs smooth on mobile.',
      date: '2 hours ago',
    },
    {
      id: 'c_default_2',
      name: 'Samantha',
      text: 'Great stream and crisp audio. Thanks for sharing!',
      date: '1 day ago',
    },
  ]);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
        setIsLoading(true);
        const [vidRes, relRes] = await Promise.all([
          api.get(`/videos/${videoId}`).catch(() => null),
          api.get(`/videos/related/${videoId}`).catch(() => null),
        ]);

        if (vidRes?.data?.video) {
          const loadedVid = vidRes.data.video;
          setVideo(loadedVid);

          // Update document title and canonical URL for SEO
          if (loadedVid.title) {
            document.title = `${loadedVid.title} | ZoneTube`;
          }
          const targetSeoPath = getSEOVideoUrl(loadedVid);
          if (window.location.pathname !== targetSeoPath) {
            window.history.replaceState({}, '', targetSeoPath);
          }
        }
        if (relRes?.data?.videos && relRes.data.videos.length > 0) {
          setRelated(relRes.data.videos);
        }

        // Log watch history if user is logged in
        if (user && vidRes?.data?.video) {
          api.post('/history', { video_id: vidRes.data.video.id, progress: 100 }).catch(() => {});
        }
      } catch (err: any) {
        console.warn('Video details fetch fallback:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoDetails();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [videoId, user]);

  const handleViewCountIncrement = (newCount: number) => {
    setVideo((prev) => (prev ? { ...prev, view_count: newCount } : null));
  };

  const isFav = video ? favoritesSet.has(video.id) : false;

  const handleToggleFavorite = async () => {
    if (!video) return;

    const nextState = !isFav;
    try {
      if (user) {
        if (isFav) {
          await api.delete(`/favorites/${video.id}`);
        } else {
          await api.post('/favorites', { video_id: video.id });
        }
      } else {
        const localFavs: string[] = JSON.parse(localStorage.getItem('zonetube_guest_favs') || '[]');
        const updated = nextState
          ? Array.from(new Set([...localFavs, video.id]))
          : localFavs.filter((id) => id !== video.id);
        localStorage.setItem('zonetube_guest_favs', JSON.stringify(updated));
      }

      onFavoriteToggle(video.id, nextState);
      showToast(nextState ? 'Added to favorites' : 'Removed from favorites', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error toggling favorite', 'error');
    }
  };

  // Sync subscription status whenever video changes
  useEffect(() => {
    if (video?.channel) {
      try {
        const subs: string[] = JSON.parse(localStorage.getItem('zonetube_subscriptions') || '[]');
        setIsSubscribed(subs.includes(video.channel.toLowerCase().trim()));
      } catch (e) {
        setIsSubscribed(false);
      }
    }
  }, [video]);

  const handleToggleSubscribe = () => {
    const channelName = (video?.channel || 'XVideos Network').trim();
    if (!channelName) return;

    try {
      const subs: string[] = JSON.parse(localStorage.getItem('zonetube_subscriptions') || '[]');
      const lower = channelName.toLowerCase();
      const isCurrentlySubbed = subs.includes(lower);
      const nextSub = !isCurrentlySubbed;

      const updated = nextSub
        ? Array.from(new Set([...subs, lower]))
        : subs.filter((s) => s !== lower);

      localStorage.setItem('zonetube_subscriptions', JSON.stringify(updated));
      setIsSubscribed(nextSub);

      showToast(
        nextSub
          ? `✓ Subscribed to ${channelName}! You will receive stream updates.`
          : `Unsubscribed from ${channelName}.`,
        'success'
      );
    } catch (err) {
      showToast('Subscription updated!');
      setIsSubscribed(!isSubscribed);
    }
  };

  const handleAddComment = (commentText: string) => {
    if (!user) {
      showToast('Please sign in to post comments', 'info');
      return;
    }

    setComments([
      {
        id: Date.now().toString(),
        name: user.name,
        text: commentText,
        date: 'Just now',
      },
      ...comments,
    ]);
    showToast('Comment posted successfully');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Video link copied to clipboard!');
    }
  };

  if (isLoading || !video) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="w-full aspect-video bg-[#151821] rounded-2xl" />
        <div className="h-8 bg-[#151821] rounded w-3/4" />
        <div className="h-4 bg-[#151821] rounded w-1/2" />
      </div>
    );
  }

  // Extract clean tags for discovery
  const displayTags = (video.tags && video.tags.length > 0)
    ? video.tags
    : [video.category.toLowerCase()];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 transition-colors cursor-pointer"
      >
        <i className="fa-solid fa-arrow-left text-xs" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: Player + Details + Actions */}
        <div className="lg:col-span-2 space-y-6">
          <VideoPlayer
            video={video}
            onViewCountIncrement={handleViewCountIncrement}
            onOpenShareModal={() => setIsShareModalOpen(true)}
          />

          <div className="space-y-4">
            <h1
              className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight line-clamp-2 overflow-hidden"
              title={video.title}
            >
              {video.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                <span>{(video.view_count || 0).toLocaleString()} views</span>
                <span>•</span>
                <span>{new Date(video.created_at).toLocaleDateString()}</span>
                <span className="px-2 py-0.5 bg-white/10 rounded text-white font-bold text-[10px]">
                  {video.category}
                </span>
                {video.country_flag && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded text-white font-bold text-[10px]"
                    title={video.country}
                  >
                    <span>{video.country_flag}</span>
                    <span>{video.country_code || video.country}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer ${
                    isFav
                      ? 'bg-red-950/80 border-red-500 text-red-400 ring-2 ring-red-500/40 shadow-lg shadow-red-900/30'
                      : 'bg-[#1c202d] hover:bg-[#252b3d] text-zinc-300 border-white/10 hover:border-white/25 hover:text-white'
                  }`}
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={isFav ? "#ef4444" : "none"}
                    stroke={isFav ? "#ef4444" : "currentColor"}
                    strokeWidth={isFav ? "1" : "2"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`w-4 h-4 transition-all duration-200 ${
                      isFav
                        ? 'text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)] scale-110'
                        : 'text-zinc-400 group-hover:text-red-400'
                    }`}
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                  <span className={isFav ? 'text-red-400 font-extrabold' : ''}>
                    {isFav ? 'Favorited' : 'Favorite'}
                  </span>
                </button>

                {onAddToPlaylist && (
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => onAddToPlaylist(video)}
                  >
                    📋 + Playlist
                  </Button>
                )}

                <Button variant="soft" size="sm" onClick={() => setIsShareModalOpen(true)}>
                  ↗ Share
                </Button>
              </div>
            </div>

            {/* Channel Bar: Perfect circular icon, no checkmark */}
            <div className="flex items-center justify-between p-4 bg-[#151821] border border-white/10 rounded-2xl">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-900 text-white font-black text-base flex items-center justify-center border border-white/20 shadow-md shrink-0 aspect-square">
                  {(video.channel || 'Z')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <span>{video.channel || 'ZoneTube'}</span>
                    {video.country_flag && (
                      <span className="text-sm" title={video.country || video.country_code}>
                        {video.country_flag}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {video.country ? `${video.country} • ` : ''}Verified Stream
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleSubscribe}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                  isSubscribed
                    ? 'bg-white/10 text-zinc-300 hover:bg-white/20 border border-white/10'
                    : 'bg-[var(--accent-red)] text-white hover:bg-red-600'
                }`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>

            {/* Clean Tag Display Strip: Horizontally scrollable left-to-right */}
            <div className="p-3 bg-[#151821] border border-white/10 rounded-2xl flex items-center gap-3">
              <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 pl-1">
                <span>🏷️</span> Tags:
              </span>
              
              <div 
                ref={tagsScrollRef}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none py-1 scroll-smooth w-full"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {displayTags.map((tag, idx) => (
                  <span
                    key={`${tag}-${idx}`}
                    className="px-3 py-1 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-red-500/40 rounded-lg text-xs font-semibold text-zinc-200 transition-all shrink-0 whitespace-nowrap cursor-default"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {displayTags.length > 4 && (
                <div className="hidden sm:flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => tagsScrollRef.current?.scrollBy({ left: -150, behavior: 'smooth' })}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white border border-white/10 text-xs transition-colors"
                    title="Scroll left"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={() => tagsScrollRef.current?.scrollBy({ left: 150, behavior: 'smooth' })}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white border border-white/10 text-xs transition-colors"
                    title="Scroll right"
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>

            {/* Comments Quick Access Strip */}
            <div
              onClick={() => setIsCommentsModalOpen(true)}
              className="p-4 bg-[#151821] border border-white/10 hover:border-white/30 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">💬</span>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[var(--accent-red)] transition-colors">
                    Comments ({comments.length})
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Click here to open the discussion modal and read or leave a comment
                  </p>
                </div>
              </div>
              <span className="text-xs text-zinc-400 group-hover:text-white font-bold bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                View & Comment →
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Column: Related / Up Next */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center justify-between border-b border-white/10 pb-2">
            <span>Up Next</span>
            <span className="text-xs text-zinc-400 font-normal">Autoplay ●</span>
          </h3>

          <div className="space-y-3">
            {related
              .filter((item, idx, arr) => item?.id && arr.findIndex((x) => x?.id === item.id) === idx)
              .map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => onOpenVideo(item)}
                className="flex gap-3 p-2 rounded-xl bg-[#151821] border border-white/5 hover:border-white/20 cursor-pointer transition-all duration-200 group"
              >
                <div className="relative w-32 aspect-video bg-zinc-900 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {item.duration && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-bold">
                      {item.duration}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <h4 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1 truncate">{item.channel}</p>
                  <p className="text-[10px] text-zinc-500">{item.view_count || 0} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dedicated Comment Modal */}
      <CommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => setIsCommentsModalOpen(false)}
        comments={comments}
        onAddComment={handleAddComment}
        videoTitle={video.title}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        video={video}
      />
    </div>
  );
};
