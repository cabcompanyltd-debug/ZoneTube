import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface AdBannerProps {
  slot?: 'top' | 'middle' | 'sidebar';
  slotIndex?: number;
  className?: string;
  onNavigate?: (path: string) => void;
  variant?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slot = 'middle',
  slotIndex = 0,
  className = '',
  onNavigate,
}) => {
  const { settings } = useSettings();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [hasInteracted, setHasInteracted] = useState(false);

  // If the admin configured a custom banner in settings, display it
  if (settings.banner_ad_image) {
    return (
      <aside
        aria-label="Sponsored Advertisement"
        className={`my-6 rounded-2xl overflow-hidden border border-white/10 bg-[#0d0f17] shadow-2xl transition-all duration-300 hover:border-red-500/40 group relative ${className}`}
      >
        <a
          href={settings.banner_ad_link || '#'}
          target={settings.banner_ad_link ? '_blank' : undefined}
          rel="noopener noreferrer"
          className="block relative w-full overflow-hidden"
        >
          <img
            src={settings.banner_ad_image}
            alt={settings.banner_ad_title || 'Sponsored Advertisement'}
            className="w-full h-auto max-h-36 sm:max-h-44 object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
          />
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-zinc-300 border border-white/15">
            Ad • Sponsored
          </span>
        </a>
      </aside>
    );
  }

  // If the admin configured raw HTML or script code
  if (settings.banner_ad_code) {
    return (
      <aside
        aria-label="Sponsored Advertisement"
        className={`my-6 rounded-2xl overflow-hidden border border-white/10 bg-[#0d0f17] p-2 flex items-center justify-center min-h-[90px] shadow-xl ${className}`}
        dangerouslySetInnerHTML={{ __html: settings.banner_ad_code }}
      />
    );
  }

  // Empty Fallback: Exceptional, sleek, animated showcase card
  // Rotating creative styles for every 10 videos (slotIndex 0, 1, 2, 3...)
  const themes = [
    {
      badge: '4K ULTRA SPEED STREAM',
      badgeColor: 'from-red-600/30 to-amber-600/30 text-red-300 border-red-500/40',
      dotColor: 'bg-red-500',
      title: 'ZoneTube Turbo Stream • 60 FPS Ultra-HD Playback',
      description: 'Zero buffering, crystal-clear 4K streams & blazing-fast multi-threaded seeking across all catalog titles.',
      ctaText: '⚡ Turbo Speed Active',
      buttonText: '🚀 Boost Bitrate',
      glowGradient: 'from-red-950/40 via-red-900/10 to-transparent',
      borderColor: 'hover:border-red-500/40',
      actionToast: 'ZoneTube Turbo edge node buffering is active for your connection!',
      renderVisual: () => (
        <div className="flex items-end gap-1.5 h-9 px-3 py-1 bg-black/50 rounded-xl border border-white/10 shadow-inner">
          <span className="w-1.5 bg-gradient-to-t from-red-600 to-red-400 rounded-full animate-pulse" style={{ height: '75%', animationDuration: '0.6s' }} />
          <span className="w-1.5 bg-gradient-to-t from-red-500 to-amber-400 rounded-full animate-pulse" style={{ height: '100%', animationDuration: '0.4s' }} />
          <span className="w-1.5 bg-gradient-to-t from-amber-500 to-yellow-400 rounded-full animate-pulse" style={{ height: '50%', animationDuration: '0.8s' }} />
          <span className="w-1.5 bg-gradient-to-t from-red-600 to-red-400 rounded-full animate-pulse" style={{ height: '90%', animationDuration: '0.5s' }} />
          <span className="w-1.5 bg-gradient-to-t from-red-500 to-amber-300 rounded-full animate-pulse" style={{ height: '60%', animationDuration: '0.7s' }} />
          <span className="w-1.5 bg-gradient-to-t from-amber-600 to-red-400 rounded-full animate-pulse" style={{ height: '85%', animationDuration: '0.35s' }} />
        </div>
      ),
    },
    {
      badge: 'PRIVATE & ENCRYPTED',
      badgeColor: 'from-cyan-600/30 to-blue-600/30 text-cyan-300 border-cyan-500/40',
      dotColor: 'bg-cyan-400',
      title: 'Anonymous Streaming Shield • Military-Grade Privacy',
      description: 'Stream anonymously without logs, IP tracking, or bandwidth throttling with encrypted edge servers.',
      ctaText: '🛡️ Anonymous Session',
      buttonText: '🔒 Guard Stream',
      glowGradient: 'from-cyan-950/40 via-blue-900/10 to-transparent',
      borderColor: 'hover:border-cyan-500/40',
      actionToast: 'Encrypted privacy tunnel enabled for private streaming.',
      renderVisual: () => (
        <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
          <span className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" style={{ animationDuration: '2.5s' }} />
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-lg shadow-lg shadow-cyan-500/20">
            🛡️
          </div>
        </div>
      ),
    },
    {
      badge: 'SPONSOR SPOTLIGHT',
      badgeColor: 'from-emerald-600/30 to-teal-600/30 text-emerald-300 border-emerald-500/40',
      dotColor: 'bg-emerald-400',
      title: 'Promote Your Brand Here • Reach 500,000+ Viewers',
      description: 'High-converting native banner placements, video overlays, and target audience partnerships.',
      ctaText: '📢 Partner Placement',
      buttonText: '✨ Place Your Ad →',
      glowGradient: 'from-emerald-950/40 via-teal-900/10 to-transparent',
      borderColor: 'hover:border-emerald-500/40',
      actionToast: 'Opening Partner & Advertising contact form...',
      renderVisual: () => (
        <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
          <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse" />
          <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-lg shadow-lg shadow-emerald-500/20">
            📢
          </div>
        </div>
      ),
    },
    {
      badge: 'CREATORS & REVENUE',
      badgeColor: 'from-purple-600/30 to-pink-600/30 text-purple-300 border-purple-500/40',
      dotColor: 'bg-purple-400',
      title: 'ZoneTube Creators Club • Upload & Earn Fast Payouts',
      description: 'Join verified video creators, monetize your audience, and build your brand on modern streaming.',
      ctaText: '💎 Creator Program',
      buttonText: '👑 Join Creators →',
      glowGradient: 'from-purple-950/40 via-pink-900/10 to-transparent',
      borderColor: 'hover:border-purple-500/40',
      actionToast: 'Redirecting to creator community and contact...',
      renderVisual: () => (
        <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
          <span className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 text-lg shadow-lg shadow-purple-500/20">
            💎
          </div>
        </div>
      ),
    },
  ];

  const currentTheme = themes[slotIndex % themes.length];

  const handleActionClick = () => {
    setHasInteracted(true);
    showToast(currentTheme.actionToast, 'success');
    if (slotIndex % themes.length === 2 || slotIndex % themes.length === 3) {
      if (onNavigate) {
        onNavigate('/contact');
      }
    }
  };

  return (
    <aside
      aria-label="Promoted Stream Showcase"
      className={`my-8 relative group overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0d0f18] p-4 sm:p-5 transition-all duration-500 shadow-2xl ${currentTheme.borderColor} ${className}`}
    >
      {/* Background Animated Gradient Mesh Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${currentTheme.glowGradient} opacity-60 pointer-events-none transition-opacity duration-500 group-hover:opacity-90`}
      />

      {/* Animated subtle glass shimmer streak */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />

      {/* Decorative cyber grid lines */}
      <div className="absolute top-0 right-0 w-48 h-full bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Side: Animated live beacon + content */}
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
          {/* Animated Visual (Equalizer / Shield / Megaphone) */}
          <div className="shrink-0">{currentTheme.renderVisual()}</div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Pulsing Live Beacon Indicator */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r ${currentTheme.badgeColor} border`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentTheme.dotColor}`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${currentTheme.dotColor}`} />
                </span>
                <span>{currentTheme.badge}</span>
              </span>

              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hidden sm:inline">
                Sponsored • ZoneTube Network
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-black text-white tracking-tight leading-snug group-hover:text-zinc-100 transition-colors">
              {currentTheme.title}
            </h3>

            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {currentTheme.description}
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Action Button & Admin Hint */}
        <div className="flex items-center gap-3 self-end md:self-center shrink-0 w-full sm:w-auto justify-between sm:justify-end">
          {isAdmin && (
            <button
              type="button"
              onClick={() => onNavigate?.('/admin')}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium cursor-pointer underline decoration-dotted"
              title="Configure custom banner in Admin Settings"
            >
              ⚙️ Custom Ad
            </button>
          )}

          <button
            type="button"
            onClick={handleActionClick}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 shadow-xl cursor-pointer flex items-center gap-2 ${
              hasInteracted
                ? 'bg-emerald-600 text-white border border-emerald-400 scale-100'
                : 'bg-white hover:bg-zinc-200 text-black hover:scale-105 active:scale-95 shadow-white/10'
            }`}
          >
            <span>{hasInteracted ? '✓ Activated' : currentTheme.buttonText}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

