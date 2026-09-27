import React, { useState, useEffect, useMemo } from 'react';
import { Video } from '../../types';
import { VideoGrid } from '../../components/video/VideoGrid';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

interface FavoritesPageProps {
  onOpenVideo: (video: Video) => void;
  favoritesSet: Set<string>;
  onFavoriteToggle: (videoId: string, isFav: boolean) => void;
  onAddToPlaylist?: (video: Video) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  onOpenVideo,
  favoritesSet,
  onFavoriteToggle,
  onAddToPlaylist,
}) => {
  const { user } = useAuth();
  const [allFetchedVideos, setAllFetchedVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setIsLoading(true);
        if (user) {
          const res = await api.get('/favorites');
          setAllFetchedVideos(res.data.favorites || []);
        } else {
          const localFavIds: string[] = JSON.parse(localStorage.getItem('zonetube_guest_favs') || '[]');
          if (localFavIds.length > 0) {
            const vidRes = await api.get('/videos?limit=1000');
            const allVids: Video[] = vidRes.data.videos || [];
            const favVids = allVids.filter((v) => localFavIds.includes(v.id));
            setAllFetchedVideos(favVids);
          } else {
            setAllFetchedVideos([]);
          }
        }
      } catch (err) {
        console.error('Failed to load favorites:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  // Immediately filter videos based on current favoritesSet so unfavorited videos instantly vanish
  const visibleFavorites = useMemo(() => {
    return allFetchedVideos.filter((v) => favoritesSet.has(v.id));
  }, [allFetchedVideos, favoritesSet]);

  const handleToggle = (videoId: string, isFav: boolean) => {
    onFavoriteToggle(videoId, isFav);
    if (!isFav) {
      setAllFetchedVideos((prev) => prev.filter((v) => v.id !== videoId));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <span>❤️</span> Saved Favorite Videos
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Access your bookmarked streams anytime from your account.
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-white/5 border border-white/10 rounded-full text-zinc-300 self-start sm:self-auto">
          {visibleFavorites.length} saved video{visibleFavorites.length === 1 ? '' : 's'}
        </span>
      </div>

      <VideoGrid
        videos={visibleFavorites}
        isLoading={isLoading}
        onOpenVideo={onOpenVideo}
        favoritesSet={favoritesSet}
        onFavoriteToggle={handleToggle}
        onAddToPlaylist={onAddToPlaylist}
        emptyTitle="Your favorites list is empty"
        emptyDescription="Browse the platform and click the heart icon on any video to save it here."
      />
    </div>
  );
};
