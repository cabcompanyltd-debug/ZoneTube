import React from 'react';
import { Video } from '../../types';
import { VideoCard } from './VideoCard';
import { VideoGridSkeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';

interface VideoGridProps {
  videos: Video[];
  isLoading?: boolean;
  onOpenVideo: (video: Video) => void;
  favoritesSet?: Set<string>;
  onFavoriteToggle?: (videoId: string, isFav: boolean) => void;
  onAddToPlaylist?: (video: Video) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  isLoading = false,
  onOpenVideo,
  favoritesSet = new Set(),
  onFavoriteToggle,
  onAddToPlaylist,
  emptyTitle = 'No videos found',
  emptyDescription = 'There are no videos available matching your filter.',
}) => {
  if (isLoading) {
    return <VideoGridSkeleton count={8} />;
  }

  // Deduplicate videos by ID to guarantee unique React keys and avoid redundant cards
  const uniqueVideos = React.useMemo(() => {
    const seen = new Set<string>();
    return (videos || []).filter((video) => {
      if (!video || !video.id) return false;
      if (seen.has(video.id)) return false;
      seen.add(video.id);
      return true;
    });
  }, [videos]);

  if (uniqueVideos.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon="🎥" />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5">
      {uniqueVideos.map((video, idx) => (
        <VideoCard
          key={`${video.id}-${idx}`}
          video={video}
          onOpen={onOpenVideo}
          isFavorited={favoritesSet.has(video.id)}
          onFavoriteToggle={onFavoriteToggle}
          onAddToPlaylist={onAddToPlaylist}
        />
      ))}
    </div>
  );
};
