import React from 'react';
import { Logo } from '../../components/common/Logo';

interface AboutPageProps {
  onNavigate?: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-fade-in my-6 pb-12">
      {/* Hero Showcase Section with Loving Couple Hugging Photo */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-8 sm:p-14 bg-gradient-to-r from-red-950/40 via-[#151821] to-[#08090D] flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">
            <i className="fa-solid fa-heart text-red-500 animate-pulse" />
            <span>Passionate Media Streaming</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Crafted for Emotion. Built for <span style={{ color: 'var(--accent-red)' }}>Streamers</span>.
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
            ZoneTube is a premier digital media streaming platform engineered to unite audiences with high-definition video entertainment, instantaneous edge playback, authorized syndication, and private, personalized curation across all modern mobile and desktop screens.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onNavigate && (
              <button
                onClick={() => onNavigate('/')}
                className="px-6 py-3 bg-[var(--accent-red)] hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Browse Video Catalog</span>
                <i className="fa-solid fa-arrow-right" />
              </button>
            )}
            {onNavigate && (
              <button
                onClick={() => onNavigate('/categories')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 transition-all cursor-pointer"
              >
                Explore Genres
              </button>
            )}
          </div>
        </div>

        {/* Visual Graphic Card - Woman and Man Hugging Photo */}
        <div className="relative shrink-0 w-full md:w-84 aspect-square rounded-3xl overflow-hidden border border-white/15 shadow-2xl group">
          <img
            src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=85"
            alt="Loving Couple Embracing and Hugging - ZoneTube Community"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 space-y-1">
            <Logo size="lg" />
            <p className="text-[11px] text-zinc-200 font-medium flex items-center gap-1.5">
              <i className="fa-solid fa-sparkles text-amber-400" />
              <span>Real Passion & Human Connection</span>
            </p>
          </div>
        </div>
      </div>

      {/* Platform Live Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Curated Streams', value: '500+', icon: 'fa-solid fa-film', color: 'text-red-400' },
          { label: 'Buffer-Free Latency', value: '< 150ms', icon: 'fa-solid fa-bolt', color: 'text-amber-400' },
          { label: 'Edge Availability', value: '99.98%', icon: 'fa-solid fa-server', color: 'text-emerald-400' },
          { label: 'Authorized Syndication', value: '100%', icon: 'fa-solid fa-shield-check', color: 'text-blue-400' },
        ].map((item, i) => (
          <div
            key={i}
            className="p-6 rounded-3xl bg-[#151821] border border-white/10 shadow-xl flex flex-col items-center text-center space-y-2"
          >
            <span className={`text-2xl ${item.color}`}>
              <i className={item.icon} />
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white">{item.value}</span>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{item.label}</span>
          </div>
        ))}
      </div>

      {/* The Story & Vision of ZoneTube */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold uppercase tracking-wider">
            <i className="fa-solid fa-compass text-[var(--accent-red)]" />
            <span>Our Founding Vision</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Redefining Streaming with Pure Performance & Elegant Design
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
            ZoneTube was established with a singular vision: to dismantle the cluttered, sluggish, and bloated experiences that plague traditional video websites. We set out to engineer a streamlined, OLED-calibrated digital media sanctuary where users can discover and stream content instantaneously without invasive pop-ups, disruptive layout shifts, or spyware trackers.
          </p>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
            Whether you are discovering trending creators, curating bespoke playlists for your personal library, or catching up on your watch history across mobile devices, ZoneTube provides a fluid 60 frames-per-second viewing experience backed by cloud-native infrastructure.
          </p>

          <div className="space-y-3 pt-2">
            {[
              { text: 'Pure OLED Dark Aesthetics: Zero eye-strain dark theme designed for midnight viewing.', icon: 'fa-solid fa-moon' },
              { text: 'Private by Design: No sale of personal data, no third-party tracking beacons.', icon: 'fa-solid fa-lock' },
              { text: 'Full Device Continuity: Seamless transitions between desktop, tablet, and smartphone.', icon: 'fa-solid fa-repeat' },
            ].map((p, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs text-zinc-200">
                <span className="text-[var(--accent-red)] text-sm shrink-0 mt-0.5">
                  <i className={p.icon} />
                </span>
                <span className="leading-snug">{p.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="rounded-3xl overflow-hidden border border-white/10 shadow-xl aspect-4/5 group">
              <img
                src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=800&q=80"
                alt="Romantic couple holding hands in sunlight"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="p-5 rounded-3xl bg-[#151821] border border-white/10 text-center space-y-1">
              <h4 className="text-sm font-bold text-white">Authentic Relationships</h4>
              <p className="text-[11px] text-zinc-400">Content that resonates with real human connections</p>
            </div>
          </div>

          <div className="space-y-4 pt-8">
            <div className="p-5 rounded-3xl bg-[#151821] border border-white/10 text-center space-y-1">
              <h4 className="text-sm font-bold text-white">Global Inclusivity</h4>
              <p className="text-[11px] text-zinc-400">Welcoming diverse audiences & LGBTQ+ creators worldwide</p>
            </div>
            <div className="rounded-3xl overflow-hidden border border-white/10 shadow-xl aspect-4/5 group">
              <img
                src="https://images.unsplash.com/photo-1522543558187-768b6df7c25c?auto=format&fit=crop&w=800&q=80"
                alt="Couple embracing outdoors with gentle warmth"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Our Core Architectural Pillars
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Engineered with modern web standards to deliver maximum performance across every device.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-[#151821] border border-white/10 space-y-4 shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-red-600/10 text-[var(--accent-red)] flex items-center justify-center text-2xl border border-red-500/20 shadow-md">
              <i className="fa-solid fa-gauge-high" />
            </div>
            <h3 className="text-lg font-bold text-white">Instantaneous Streaming</h3>
            <p className="text-xs text-zinc-300 leading-relaxed font-normal">
              Powered by Vite, React 19, and optimized CDN edge routing, streams start playing in milliseconds without buffering delays, pre-roll freezes, or heavyweight client overhead.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#151821] border border-white/10 space-y-4 shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center text-2xl border border-blue-500/20 shadow-md">
              <i className="fa-solid fa-mobile-screen-button" />
            </div>
            <h3 className="text-lg font-bold text-white">Adaptive Mobile Experience</h3>
            <p className="text-xs text-zinc-300 leading-relaxed font-normal">
              Touch-friendly gesture controls, bottom navigation drawers, responsive video players, and clean dark-mode visuals calibrated for modern OLED and Retina mobile screens.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#151821] border border-white/10 space-y-4 shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center text-2xl border border-emerald-500/20 shadow-md">
              <i className="fa-solid fa-shield-halved" />
            </div>
            <h3 className="text-lg font-bold text-white">100% Permitted Embeds</h3>
            <p className="text-xs text-zinc-300 leading-relaxed font-normal">
              All video content is delivered exclusively via authorized syndication partners, verified embed players, and statutory compliance under international copyright frameworks.
            </p>
          </div>
        </div>
      </div>

      {/* Technology Stack & Engineering Excellence */}
      <div className="p-8 sm:p-12 rounded-3xl bg-[#151821] border border-white/10 shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <span className="text-xs font-bold text-[var(--accent-red)] uppercase tracking-wider">Engineering Blueprint</span>
            <h2 className="text-2xl font-black text-white mt-1">State-of-the-Art Technology Stack</h2>
          </div>
          <span className="px-4 py-1.5 bg-white/5 text-zinc-300 text-xs font-mono rounded-full border border-white/10">
            Node.js 22 + React 19
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <i className="fa-brands fa-react text-blue-400 text-lg" />
              <span>React 19 & Vite</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              Lightning-fast single page application architecture with near-instantaneous hot module updates and minimal client-side runtime payload.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <i className="fa-solid fa-database text-emerald-400 text-lg" />
              <span>PostgreSQL & InsForge</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              Ultra-scalable Postgres database with sub-millisecond query execution, secure storage buckets for user media, and real-time data sync.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <i className="fa-brands fa-css3-alt text-amber-400 text-lg" />
              <span>Tailwind CSS</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              Hardware-accelerated CSS utility framework with dynamic custom theme accent color palette and responsive flex/grid layouts.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <i className="fa-solid fa-shield text-purple-400 text-lg" />
              <span>Enterprise Security</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              Bcrypt 10-round credential hashing, JWT token authorization, strict CORS policies, and sanitized inputs preventing injection vectors.
            </p>
          </div>
        </div>
      </div>

      {/* Inclusivity & Respect Manifesto */}
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#181224] via-[#151821] to-[#0d0f15] border border-white/10 shadow-2xl space-y-6">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <i className="fa-solid fa-rainbow" />
            <span>Diversity, Respect & Inclusivity</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            A Welcoming Space for All Communities
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
            At ZoneTube, we believe digital entertainment should celebrate consensual human expression in all its beauty. We proudly maintain an inclusive platform that champions diversity, including LGBTQ+, heterosexual, and non-binary communities. We reject discrimination, hate speech, and harassment in all forms, ensuring a safe, dignified, and welcoming digital haven for adults worldwide.
          </p>
        </div>
      </div>

      {/* Join the Community Footer Banner */}
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-red-950/40 via-[#151821] to-black border border-white/10 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <Logo size="lg" />
          <h3 className="text-lg font-black text-white">Experience ZoneTube Today</h3>
          <p className="text-xs text-zinc-400 max-w-xl font-normal">
            Create your account to save your favorite streams, create custom playlists, and build your personalized watch history.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {onNavigate && (
            <button
              onClick={() => onNavigate('/register')}
              className="px-6 py-3 bg-[var(--accent-red)] hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Create Free Account</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
