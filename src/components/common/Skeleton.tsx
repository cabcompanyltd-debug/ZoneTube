import React from 'react';

export const VideoCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#151821] border border-white/5 rounded-xl overflow-hidden animate-pulse">
      <div className="w-full aspect-video bg-zinc-800/60" />
      <div className="p-4 flex gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-zinc-800 rounded w-5/6" />
          <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
          <div className="h-3 bg-zinc-800/40 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
};

export const VideoGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
};
