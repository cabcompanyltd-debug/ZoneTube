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
    <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-zinc-950 border border-white/10 shadow-2xl mb-8 group">
      <div className="absolute inset-0 z-0">
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-full h-full object-cover opacity-50 scale-105 group-hover:scale-100 transition-transform duration-700 blur-sm brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090D] via-[#08090D]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090D] via-[#08090D]/80 to-transparent" />
      </div>

      <div className="relative z-10 p-6 sm:p-8 md:p-12 max-w-3xl flex flex-col items-start gap-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[var(--accent-red)] text-white text-xs font-extrabold rounded-full uppercase tracking-widest shadow-lg shadow-red-600/30">
            ★ Featured Stream
          </span>
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-zinc-200 text-xs font-semibold rounded-full border border-white/10">
            {video.category}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md">
          {video.title}
        </h1>

        <p className="text-sm sm:text-base text-zinc-300 line-clamp-3 leading-relaxed max-w-2xl font-normal">
          {video.description}
        </p>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={() => onWatch(video)} size="lg" className="shadow-2xl font-bold">
            ▶ Watch Now
          </Button>

          {onSave && (
            <Button onClick={() => onSave(video)} variant="secondary" size="lg" className="backdrop-blur-md">
              + Save
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
