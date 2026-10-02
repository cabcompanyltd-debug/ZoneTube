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
    const channelName = (video?.channel || 'ZoneTube Network').trim();
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
          ? `✓ Subscribed to ${channelName}!`
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

  if (isLoading || !video) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse pb-16">
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
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-16">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 transition-all cursor-pointer active:scale-95"
        >
          <i className="fa-solid fa-arrow-left text-xs" /> <span>Back to Streams</span>
        </button>

        {video.country_flag && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
            <span className="text-base">{video.country_flag}</span>
            <span>{video.country || video.country_code}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Column: Player + Details + Actions */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10">
            <VideoPlayer
              video={video}
              onViewCountIncrement={handleViewCountIncrement}
              onOpenShareModal={() => setIsShareModalOpen(true)}
            />
          </div>

          <div className="space-y-4">
            <h1
              className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-snug tracking-tight text-balance"
              title={video.title}
            >
              {video.title}
            </h1>

            {/* Clean Unboxed Metadata & Action Buttons Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 py-3 border-y border-white/10">
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium tabular-nums">
                <span className="font-semibold text-zinc-300">{(video.view_count || 0).toLocaleString()} views</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span>{new Date(video.created_at).toLocaleDateString()}</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="text-zinc-200 font-semibold">{video.category}</span>
              </div>

              {/* Action Buttons with 44px touch targets on mobile */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 min-h-[38px] ${
                    isFav
                      ? 'bg-red-950/80 border-red-500 text-red-400 shadow-md shadow-red-900/30 ring-1 ring-red-500/40'
                      : 'bg-[#181C28] hover:bg-[#202636] text-zinc-200 border-white/10 hover:border-white/20'
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
                    className={`w-4 h-4 ${isFav ? 'text-red-500 fill-red-500' : 'text-zinc-400'}`}
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                  <span>{isFav ? 'Favorited' : 'Favorite'}</span>
                </button>

                {onAddToPlaylist && (
                  <button
                    onClick={() => onAddToPlaylist(video)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#181C28] hover:bg-[#202636] text-zinc-200 border border-white/10 hover:border-white/20 transition-all cursor-pointer active:scale-95 min-h-[38px]"
                  >
                    <span>📁</span> <span>Playlist</span>
                  </button>
                )}

                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#181C28] hover:bg-[#202636] text-zinc-200 border border-white/10 hover:border-white/20 transition-all cursor-pointer active:scale-95 min-h-[38px]"
                >
                  <span>↗</span> <span>Share</span>
                </button>
              </div>
            </div>

            {/* Channel Bar: Clean avatar, verified marker, and subscribe button */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 bg-[#131620] border border-white/10 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full text-white font-black text-sm sm:text-base flex items-center justify-center border border-white/20 shadow-md shrink-0 aspect-square"
                  style={{
                    backgroundColor: 'var(--accent-red)',
                    boxShadow: '0 2px 10px var(--accent-glow, rgba(229,9,20,0.35))',
                  }}
                >
                  {(video.channel || 'Z')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                    <span>{video.channel || 'ZoneTube'}</span>
                    {video.country_flag && (
                      <span className="text-xs" title={video.country || video.country_code}>
                        {video.country_flag}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {video.country ? `${video.country} · ` : ''}Verified Stream Creator
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleSubscribe}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95 min-h-[36px] ${
                  isSubscribed
                    ? 'bg-white/10 text-zinc-300 hover:bg-white/20 border border-white/10'
                    : 'bg-[var(--accent-red)] text-white hover:brightness-110'
                }`}
              >
                {isSubscribed ? '✓ Subscribed' : 'Subscribe'}
              </button>
            </div>

            {/* Description Card */}
            {video.description && (
              <div className="p-4 bg-[#131620] border border-white/10 rounded-2xl">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  About this stream
                </h4>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line font-normal">
                  {video.description}
                </p>
              </div>
            )}

            {/* Tags Strip */}
            <div className="p-3 bg-[#131620] border border-white/10 rounded-2xl flex items-center gap-2.5">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 pl-1">
                🏷️ Tags:
              </span>
              
              <div 
                ref={tagsScrollRef}
                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-0.5 w-full"
              >
                {displayTags.map((tag, idx) => (
                  <span
                    key={`${tag}-${idx}`}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-zinc-300 transition-colors shrink-0 cursor-default"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Comments Strip Modal Trigger */}
            <div
              onClick={() => setIsCommentsModalOpen(true)}
              className="p-3.5 sm:p-4 bg-[#131620] border border-white/10 hover:border-white/25 rounded-2xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">💬</span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[var(--accent-red)] transition-colors">
                    Comments ({comments.length})
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Read member feedback or leave your comment
                  </p>
                </div>
              </div>
              <span className="text-xs text-zinc-300 group-hover:text-white font-bold bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 transition-colors">
                Open Discussion →
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Column: Related / Up Next Streams */}
        <div className="space-y-4">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center justify-between border-b border-white/10 pb-2">
            <span>Up Next</span>
            <span className="text-xs text-zinc-400 font-normal">Related Streams</span>
          </h3>

          <div className="space-y-2.5">
            {related
              .filter((item, idx, arr) => item?.id && arr.findIndex((x) => x?.id === item.id) === idx)
              .slice(0, 10)
              .map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => onOpenVideo(item)}
                className="flex gap-3 p-2.5 rounded-2xl bg-[#131620] hover:bg-[#181C28] border border-white/5 hover:border-white/15 cursor-pointer transition-all active:scale-[0.985] group"
              >
                <div className="relative w-28 sm:w-32 aspect-video bg-zinc-950 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.duration && (
                    <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border border-white/10">
                      {item.duration}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <h4 className="text-xs font-bold text-white group-hover:text-[var(--accent-red)] transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1 truncate">{item.channel || 'ZoneTube'}</p>
                  <p className="text-[10px] text-zinc-500 tabular-nums">{(item.view_count || 0).toLocaleString()} views</p>
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
