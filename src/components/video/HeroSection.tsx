import React from 'react';
import { Video } from '../../types';
import { Button } from '../common/Button';

interface HeroSectionProps {
  video: Video | null;
  onWatch: (video: Video) => void;
  onSave?: (video: Video) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ video, onWatch, onSave }) => {
  if (!video) return null;

  return (
    <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-zinc-950 border border-white/10 shadow-2xl mb-6 sm:mb-8 group">
      {/* Background Media with Dark Gradient Scrim */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={video.thumbnail_url}
          alt={video.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-45 scale-105 group-hover:scale-100 transition-transform duration-700 blur-[2px] brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090D] via-[#08090D]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090D] via-[#08090D]/85 to-transparent" />
      </div>

      <div className="relative z-10 p-5 sm:p-8 md:p-12 max-w-3xl flex flex-col items-start gap-3 sm:gap-4">
        {/* Clean Unboxed Kicker Metadata */}
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-zinc-300">
          <span
            className="font-extrabold uppercase"
            style={{ color: 'var(--accent-red)' }}
          >
            ★ Featured Stream
          </span>
          <span aria-hidden="true" className="text-zinc-500">·</span>
          <span>{video.category || 'General'}</span>
          {video.duration && (
            <>
              <span aria-hidden="true" className="text-zinc-500">·</span>
              <span className="font-mono tabular-nums">{video.duration}</span>
            </>
          )}
        </div>

        <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md text-balance">
          {video.title}
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-zinc-300 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-2xl font-normal">
          {video.description}
        </p>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2 w-full sm:w-auto">
          <Button
            onClick={() => onWatch(video)}
            size="lg"
            className="w-full sm:w-auto font-bold shadow-xl flex items-center justify-center gap-2"
          >
            <span>▶</span> Watch Stream
          </Button>

          {onSave && (
            <Button
              onClick={() => onSave(video)}
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto backdrop-blur-md flex items-center justify-center gap-1.5"
            >
              <span>+</span> Add to Saved
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
