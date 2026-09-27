import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Video } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: Video | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, video }) => {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'social' | 'embed'>('social');

  if (!video) return null;

  const videoUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/video/${video.id}`
    : `https://zonetube.com/video/${video.id}`;

  const shareTitle = `Watch "${video.title}" on ZoneTube`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(videoUrl);
      } else {
        const input = document.createElement('input');
        input.value = videoUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const embedCode = `<iframe src="${videoUrl}" width="640" height="360" frameborder="0" allowfullscreen allow="autoplay; fullscreen"></iframe>`;

  const handleCopyEmbed = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(embedCode);
      }
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy embed', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: `Check out "${video.title}" on ZoneTube!`,
          url: videoUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    }
  };

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: 'fa-brands fa-whatsapp',
      color: 'bg-[#25D366] hover:bg-[#20ba59]',
      textColor: 'text-white',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle}\n${videoUrl}`)}`,
    },
    {
      name: 'Facebook',
      icon: 'fa-brands fa-facebook-f',
      color: 'bg-[#1877F2] hover:bg-[#1567d3]',
      textColor: 'text-white',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`,
    },
    {
      name: 'X / Twitter',
      icon: 'fa-brands fa-x-twitter',
      color: 'bg-black hover:bg-zinc-800 border border-white/20',
      textColor: 'text-white',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(shareTitle)}`,
    },
    {
      name: 'Telegram',
      icon: 'fa-brands fa-telegram',
      color: 'bg-[#229ED9] hover:bg-[#1d8bc0]',
      textColor: 'text-white',
      url: `https://t.me/share/url?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(shareTitle)}`,
    },
    {
      name: 'Reddit',
      icon: 'fa-brands fa-reddit-alien',
      color: 'bg-[#FF4500] hover:bg-[#e03d00]',
      textColor: 'text-white',
      url: `https://reddit.com/submit?url=${encodeURIComponent(videoUrl)}&title=${encodeURIComponent(shareTitle)}`,
    },
    {
      name: 'LinkedIn',
      icon: 'fa-brands fa-linkedin-in',
      color: 'bg-[#0A66C2] hover:bg-[#084e96]',
      textColor: 'text-white',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(videoUrl)}`,
    },
    {
      name: 'Email',
      icon: 'fa-solid fa-envelope',
      color: 'bg-zinc-700 hover:bg-zinc-600',
      textColor: 'text-white',
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`Check out this video on ZoneTube:\n\n${video.title}\n${videoUrl}`)}`,
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Video" maxWidth="md">
      <div className="space-y-5">
        {/* Video Preview Card */}
        <div className="p-3 bg-[#151821] border border-white/10 rounded-2xl flex items-center gap-3.5">
          <div className="w-20 h-14 rounded-xl overflow-hidden bg-black shrink-0 relative border border-white/10">
            <img
              src={video.thumbnail_url || 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=400&q=80'}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            <span
              className="absolute inset-0 m-auto w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] shadow"
              style={{ backgroundColor: 'var(--accent-red)' }}
            >
              ▶
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
              {video.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-zinc-400 font-medium">
                {video.channel || 'ZoneTube'}
              </span>
              <span className="text-[10px] text-zinc-500">•</span>
              <span className="text-[10px] text-zinc-400">
                {(video.view_count || 0).toLocaleString()} views
              </span>
            </div>
          </div>
        </div>

        {/* Tab switch between Social Share & Embed code */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('social')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'social'
                ? 'bg-white/10 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Social Networks & Apps
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'embed'
                ? 'bg-white/10 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            &lt;/&gt; Embed Code
          </button>
        </div>

        {activeTab === 'social' ? (
          <>
            {/* Social Share Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-black/40 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group text-center cursor-pointer"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm shadow-md transition-transform group-hover:scale-110 ${item.color} ${item.textColor}`}
                  >
                    <i className={item.icon} />
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-300 group-hover:text-white transition-colors truncate max-w-full">
                    {item.name}
                  </span>
                </a>
              ))}

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-black/40 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group text-center cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm shadow-md transition-transform group-hover:scale-110 text-white"
                    style={{ backgroundColor: 'var(--accent-red)' }}
                  >
                    <i className="fa-solid fa-share-nodes" />
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-300 group-hover:text-white transition-colors">
                    Device Share
                  </span>
                </button>
              )}
            </div>

            {/* Direct Link Copy Bar */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Video Direct Link
              </label>
              <div className="flex items-center gap-2 bg-black/70 border border-white/10 rounded-2xl p-1.5 pl-3">
                <input
                  type="text"
                  readOnly
                  value={videoUrl}
                  className="bg-transparent flex-1 text-xs text-zinc-200 font-mono outline-none truncate select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    backgroundColor: copied ? '#10B981' : 'var(--accent-red)',
                  }}
                  className="px-4 py-2 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 hover:brightness-110 active:scale-95 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <i className="fa-solid fa-check text-xs" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-regular fa-copy text-xs" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Embed Code Section */
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">
              Paste this responsive HTML snippet into your website or blog to embed this video player:
            </p>
            <div className="relative bg-black/80 border border-white/10 rounded-2xl p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed select-all">
              {embedCode}
            </div>
            <button
              type="button"
              onClick={handleCopyEmbed}
              style={{
                backgroundColor: embedCopied ? '#10B981' : 'var(--accent-red)',
              }}
              className="w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 cursor-pointer"
            >
              {embedCopied ? (
                <>
                  <i className="fa-solid fa-check text-xs" />
                  <span>Embed Code Copied!</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-code text-xs" />
                  <span>Copy Embed HTML</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
