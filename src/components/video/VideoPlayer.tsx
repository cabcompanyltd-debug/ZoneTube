import React, { useState, useEffect, useRef } from 'react';
import { Video } from '../../types';
import api from '../../lib/api';

interface VideoPlayerProps {
  video: Video;
  onEnded?: () => void;
  onViewCountIncrement?: (newCount: number) => void;
  onOpenShareModal?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  onViewCountIncrement,
  onOpenShareModal,
}) => {
  const [autoplay, setAutoplay] = useState<boolean>(() => {
    const saved = localStorage.getItem('zonetube_autoplay');
    return saved !== null ? saved === 'true' : true;
  });
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [hasIncrementedView, setHasIncrementedView] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const viewLoggedRef = useRef<string | null>(null);

  useEffect(() => {
    localStorage.setItem('zonetube_autoplay', String(autoplay));
  }, [autoplay]);

  // Real-time View Count increment & Watch History logging when video starts loading/watching
  useEffect(() => {
    if (!video.id) return;

    // Log watch history
    api.post('/history', { video_id: video.id, progress: 100 }).catch(() => {});

    if (viewLoggedRef.current === video.id) return;
    viewLoggedRef.current = video.id;
    setHasIncrementedView(true);

    const logView = async () => {
      try {
        const res = await api.post(`/videos/${video.id}/view`);
        if (res.data?.views && onViewCountIncrement) {
          onViewCountIncrement(res.data.views);
        } else if (onViewCountIncrement) {
          onViewCountIncrement((video.view_count || 0) + 1);
        }
      } catch (e) {
        if (onViewCountIncrement) {
          onViewCountIncrement((video.view_count || 0) + 1);
        }
      }
    };

    // Trigger increment upon player initialization
    const timer = setTimeout(logView, 800);
    return () => clearTimeout(timer);
  }, [video.id, onViewCountIncrement, video.view_count]);

  const titleLower = (video.title || '').toLowerCase().trim();
  const isDeleted =
    titleLower === 'this video has been deleted' ||
    titleLower === 'page not found' ||
    video.status === 'hidden';

  const getEmbedUrl = () => {
    let rawUrl = (video.embed_url || video.video_url || '').trim();
    
    // Extract src from iframe HTML snippet if user provided raw iframe tag
    const srcMatch = rawUrl.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      rawUrl = srcMatch[1].trim();
    }

    // Check for XVideos page URL e.g. /video.omcikoc99ff/... or /video12345/...
    const xvVideoMatch = rawUrl.match(/xvideos\.com\/video\.?([a-zA-Z0-9_-]+)/i);
    if (xvVideoMatch && xvVideoMatch[1]) {
      rawUrl = `https://www.xvideos.com/embedframe/${xvVideoMatch[1]}`;
    }

    // Check for direct XVideos ID in ID string e.g. vid_ebony_omchikoc99ff
    if (!rawUrl || rawUrl === 'about:blank' || rawUrl.length < 5) {
      const extId = video.external_id || (video.id.startsWith('vid_ebony_') ? video.id.replace('vid_ebony_', '') : 'omchddd57bc');
      rawUrl = `https://www.xvideos.com/embedframe/${extId}`;
    }

    // YouTube embed converter
    const ytMatch = rawUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
    if (ytMatch && ytMatch[1]) {
      rawUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    }

    // Vimeo embed converter
    const vimeoMatch = rawUrl.match(/(?:vimeo\.com\/(?:video\/)?)([0-9]+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      rawUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    let baseUrl = rawUrl.trim();

    if (autoplay) {
      if (baseUrl.includes('?')) {
        if (!baseUrl.includes('autoplay=')) {
          return `${baseUrl}&autoplay=1`;
        } else {
          return baseUrl.replace(/autoplay=\d/, 'autoplay=1');
        }
      } else {
        return `${baseUrl}?autoplay=1`;
      }
    } else {
      if (baseUrl.includes('autoplay=1')) {
        return baseUrl.replace('autoplay=1', 'autoplay=0');
      }
      return baseUrl;
    }
  };

  const toggleAutoplay = () => {
    setAutoplay((prev) => !prev);
  };

  const handleQuickShare = async () => {
    const shareableUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/video/${video.id}`
      : `https://zonetube.com/video/${video.id}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareableUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareableUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy', err);
    }

    if (onOpenShareModal) {
      onOpenShareModal();
    }
  };

  if (isDeleted) {
    return (
      <div className="relative w-full aspect-video bg-gradient-to-br from-zinc-950 via-zinc-900 to-black rounded-2xl overflow-hidden border border-red-500/30 shadow-2xl flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500/40 text-red-500 flex items-center justify-center text-2xl font-black shadow-lg">
          ⚠️
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">This video has been deleted</h3>
          <p className="text-xs text-zinc-400 max-w-md">
            This stream is no longer available on the source server. Explore more active streams below.
          </p>
        </div>
        <a
          href="/explore"
          className="inline-flex items-center gap-2 bg-[var(--accent-red)] hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg"
        >
          🎬 Watch More Videos
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Video Player Container */}
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
        {/* Video Player Iframe */}
        <iframe
          key={`${video.id}-${autoplay}`}
          src={getEmbedUrl()}
          title={video.title}
          className="w-full h-full border-0 rounded-2xl"
          frameBorder={0}
          scrolling="no"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />

        {/* Gear ⚙️ Player Settings Overlay Control */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettingsMenu((prev) => !prev)}
            className={`p-2 rounded-xl backdrop-blur-md border transition-all shadow-xl flex items-center justify-center gap-1.5 text-xs font-bold ${
              showSettingsMenu
                ? 'bg-red-600 text-white border-red-500 ring-2 ring-red-500/50'
                : 'bg-black/70 text-zinc-200 border-white/20 hover:bg-black/90 hover:text-white hover:border-white/40'
            }`}
            title="Player Settings (Autoplay Control)"
          >
            <span className={`transition-transform duration-300 ${showSettingsMenu ? 'rotate-90' : ''}`}>
              ⚙️
            </span>
            <span className="hidden sm:inline font-mono text-[11px]">
              {autoplay ? 'Autoplay: ON' : 'Autoplay: OFF'}
            </span>
          </button>

          {/* Gear Settings Popup Dropdown */}
          {showSettingsMenu && (
            <div className="absolute top-12 right-0 w-64 bg-[#151821]/95 backdrop-blur-xl border border-white/15 p-4 rounded-2xl shadow-2xl space-y-3 z-40 animate-fade-in text-xs text-white">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2 font-bold">
                  <span>⚙️</span>
                  <span>Player Preferences</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsMenu(false)}
                  className="text-zinc-400 hover:text-white text-xs p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="font-bold text-white">Autoplay Video</p>
                  <p className="text-[10px] text-zinc-400">Play stream automatically on load</p>
                </div>

                <button
                  type="button"
                  onClick={toggleAutoplay}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoplay ? 'bg-[var(--accent-red)]' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      autoplay ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-2 border-t border-white/10 text-[10px] text-zinc-400 flex items-center justify-between">
                <span>Status:</span>
                <span className={`font-bold font-mono ${autoplay ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {autoplay ? '⚡ Enabled' : '⏸️ Disabled'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
