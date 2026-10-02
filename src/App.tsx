import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';

import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { Footer } from './components/layout/Footer';
import { AdminLayout } from './components/layout/AdminLayout';
import { ThemeColorModal } from './components/common/ThemeColorModal';
import { CountryFilterModal } from './components/common/CountryFilterModal';
import { Country } from './data/countries';
import { getSEOVideoUrl, extractVideoIdFromParam } from './lib/seoUtils';

import { HomePage } from './pages/public/HomePage';
import { ExplorePage } from './pages/public/ExplorePage';
import { SearchResultsPage } from './pages/public/SearchResultsPage';
import { CategoriesPage } from './pages/public/CategoriesPage';
import { CategoryDetailPage } from './pages/public/CategoryDetailPage';
import { VideoDetailsPage } from './pages/public/VideoDetailsPage';
import { AboutPage } from './pages/public/AboutPage';
import { LegalPage } from './pages/public/LegalPage';
import { TermsPage } from './pages/public/TermsPage';
import { PrivacyPage } from './pages/public/PrivacyPage';
import { DmcaPage } from './pages/public/DmcaPage';
import { ContactPage } from './pages/public/ContactPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

import { UserDashboardPage } from './pages/user/UserDashboardPage';
import { FavoritesPage } from './pages/user/FavoritesPage';
import { WatchHistoryPage } from './pages/user/WatchHistoryPage';
import { ProfilePage } from './pages/user/ProfilePage';
import { PlaylistsPage } from './pages/user/PlaylistsPage';
import { AddToPlaylistModal } from './components/video/AddToPlaylistModal';

import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminVideosPage } from './pages/admin/AdminVideosPage';
import { AdminImportPage } from './pages/admin/AdminImportPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminLogsPage } from './pages/admin/AdminLogsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

import { Video, Category } from './types';
import api from './lib/api';

function MainApp() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { isThemeModalOpen, closeThemeModal } = useSettings();

  const [path, setPath] = useState<string>(() => window.location.pathname || '/');
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('q') || '';
    } catch (e) {
      return '';
    }
  });
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [favoritesSet, setFavoritesSet] = useState<Set<string>>(new Set());
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Country Filter State
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState<boolean>(false);

  const [adminTab, setAdminTab] = useState<string>('dashboard');
  const [addToPlaylistVideo, setAddToPlaylistVideo] = useState<Video | null>(null);

  // Load initial global categories and user favorites
  const loadCategoriesAndFavs = useCallback(async () => {
    try {
      const catRes = await api.get('/categories');
      setCategories(catRes.data.categories || []);

      const localFavs: string[] = JSON.parse(localStorage.getItem('zonetube_guest_favs') || '[]');
      if (user) {
        const favRes = await api.get('/favorites');
        const favs: Video[] = favRes.data.favorites || [];
        const combined = new Set([...favs.map((v) => v.id), ...localFavs]);
        setFavoritesSet(combined);
      } else {
        setFavoritesSet(new Set(localFavs));
      }
    } catch (err) {
      console.error('Error fetching categories or favorites:', err);
      const localFavs: string[] = JSON.parse(localStorage.getItem('zonetube_guest_favs') || '[]');
      setFavoritesSet(new Set(localFavs));
    }
  }, [user]);

  useEffect(() => {
    loadCategoriesAndFavs();
  }, [loadCategoriesAndFavs]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || '/');
      try {
        const params = new URLSearchParams(window.location.search);
        setSearchQuery(params.get('q') || '');
      } catch (e) {}
      setSelectedVideo(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (newPath: string) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
    setSelectedVideo(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenVideo = (video: Video) => {
    setSelectedVideo(video);
    navigate(getSEOVideoUrl(video));
  };

  const handleSearchSubmit = (q: string) => {
    setSearchQuery(q);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleFavoriteToggle = (videoId: string, isFav: boolean) => {
    setFavoritesSet((prev) => {
      const next = new Set(prev);
      if (isFav) next.add(videoId);
      else next.delete(videoId);
      try {
        localStorage.setItem('zonetube_guest_favs', JSON.stringify(Array.from(next)));
      } catch (e) {}
      return next;
    });
  };

  const handleSelectCountry = (country: Country | null) => {
    setSelectedCountry(country);
    if (country) {
      showToast(`Filtered videos from ${country.flag} ${country.name}`);
      if (path !== '/' && path !== '/explore' && !path.startsWith('/category/')) {
        navigate('/');
      }
    } else {
      showToast('Showing all global videos 🌍');
    }
  };

  // Render Admin View
  if (path.startsWith('/admin')) {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-[#08090D] flex items-center justify-center text-white">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-bold">Verifying Administrator Access...</p>
          </div>
        </div>
      );
    }

    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-[#08090D] text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#151821] border border-white/10 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-red-950/60 border border-red-500/40 rounded-full flex items-center justify-center mx-auto text-red-400 text-2xl font-black">
              🔒
            </div>
            <h1 className="text-xl font-extrabold text-white">Administrator Access Required</h1>
            <p className="text-xs text-zinc-400">
              You must be signed in with an Administrator account to access the ZoneTube Control Center.
            </p>
            <div className="pt-2 flex gap-3">
              <button
                onClick={() => navigate('/login')}
                className="flex-1 py-2.5 bg-[var(--accent-red)] font-bold text-white text-xs rounded-xl hover:bg-red-600 transition-colors cursor-pointer"
              >
                Sign In as Admin
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 font-bold text-white text-xs rounded-xl transition-colors cursor-pointer"
              >
                Back to Site
              </button>
            </div>
          </div>
        </div>
      );
    }

    const renderAdminTabContent = () => {
      switch (adminTab) {
        case 'dashboard':
          return <AdminDashboardPage {...({ onNavigateTab: setAdminTab } as any)} />;
        case 'videos':
          return <AdminVideosPage />;
        case 'import':
          return <AdminImportPage />;
        case 'categories':
          return <AdminCategoriesPage />;
        case 'users':
          return <AdminUsersPage />;
        case 'logs':
          return <AdminLogsPage />;
        case 'analytics':
          return <AdminAnalyticsPage />;
        case 'settings':
          return <AdminSettingsPage />;
        default:
          return <AdminDashboardPage {...({ onNavigateTab: setAdminTab } as any)} />;
      }
    };

    return (
      <>
        <AdminLayout
          {...({
            activeTab: adminTab,
            onTabChange: setAdminTab,
            onExitAdmin: () => navigate('/'),
          } as any)}
        >
          {renderAdminTabContent()}
        </AdminLayout>
        <ThemeColorModal
          isOpen={isThemeModalOpen}
          onClose={closeThemeModal}
        />
      </>
    );
  }

  // Auth gate helper for user routes
  const renderAuthGate = (pageComponent: React.ReactNode) => {
    if (authLoading) {
      return (
        <div className="py-24 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-[var(--accent-red)] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-bold">Loading your account...</p>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="max-w-md mx-auto my-12 bg-[#151821] border border-white/10 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <span className="text-4xl">👤</span>
          <h2 className="text-xl font-extrabold text-white">Sign In Required</h2>
          <p className="text-xs text-zinc-400">
            Please sign in to your ZoneTube account to access this page.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 py-2.5 bg-[var(--accent-red)] font-bold text-white text-xs rounded-xl hover:bg-red-600 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 font-bold text-white text-xs rounded-xl transition-colors cursor-pointer"
            >
              Register
            </button>
          </div>
        </div>
      );
    }

    return pageComponent;
  };

  // Render Public & Authenticated User View
  const renderContent = () => {
    if (path.startsWith('/video/')) {
      const rawParam = path.replace('/video/', '').split('?')[0];
      const videoId = extractVideoIdFromParam(rawParam);
      return (
        <VideoDetailsPage
          videoId={videoId}
          onOpenVideo={handleOpenVideo}
          onBack={() => navigate('/')}
          favoritesSet={favoritesSet}
          onFavoriteToggle={handleFavoriteToggle}
          onAddToPlaylist={(v) => setAddToPlaylistVideo(v)}
        />
      );
    }

    if (path.startsWith('/category/')) {
      const rawCategoryName = path.replace('/category/', '').split('?')[0];
      const categoryName = decodeURIComponent(rawCategoryName);
      return (
        <CategoryDetailPage
          categoryName={categoryName}
          onOpenVideo={handleOpenVideo}
          favoritesSet={favoritesSet}
          onFavoriteToggle={handleFavoriteToggle}
          onAddToPlaylist={(v) => setAddToPlaylistVideo(v)}
        />
      );
    }

    if (path === '/explore') {
      return (
        <ExplorePage
          onOpenVideo={handleOpenVideo}
          favoritesSet={favoritesSet}
          onFavoriteToggle={handleFavoriteToggle}
          onAddToPlaylist={(v) => setAddToPlaylistVideo(v)}
        />
      );
    }

    if (path.startsWith('/search')) {
      return (
        <SearchResultsPage
          searchQuery={searchQuery}
          onOpenVideo={handleOpenVideo}
          favoritesSet={favoritesSet}
          onFavoriteToggle={handleFavoriteToggle}
          onAddToPlaylist={(v) => setAddToPlaylistVideo(v)}
        />
      );
    }

    if (path === '/categories') {
      return <CategoriesPage onNavigate={navigate} />;
    }

    if (path === '/about') return <AboutPage onNavigate={navigate} />;
    if (path === '/legal') return <LegalPage onNavigate={navigate} />;
    if (path === '/terms') return <TermsPage />;
    if (path === '/privacy') return <PrivacyPage />;
    if (path === '/dmca') return <DmcaPage />;
    if (path === '/contact') return <ContactPage />;

    if (path === '/login') return <LoginPage onNavigate={navigate} />;
    if (path === '/register') return <RegisterPage onNavigate={navigate} />;

    // Authenticated & Public User Pages (Individual independent routes)
    if (path === '/dashboard') {
      return renderAuthGate(
        <UserDashboardPage
          onOpenVideo={handleOpenVideo}
          onNavigate={navigate}
          favoritesSet={favoritesSet}
          onFavoriteToggle={handleFavoriteToggle}
          onAddToPlaylist={(v) => setAddToPlaylistVideo(v)}
        />
      );
    }

    if (path === '/favorites' || path === '/saved') {
      return (
        <FavoritesPage
          onOpenVideo={handleOpenVideo}
          favoritesSet={favoritesSet}
          onFavoriteToggle={handleFavoriteToggle}
          onAddToPlaylist={(v) => setAddToPlaylistVideo(v)}
        />
      );
    }

    if (path === '/history') {
      return (
        <WatchHistoryPage
          {...({
            onOpenVideo: handleOpenVideo,
            favoritesSet,
            onFavoriteToggle: handleFavoriteToggle,
            onAddToPlaylist: (v: Video) => setAddToPlaylistVideo(v),
          } as any)}
        />
      );
    }

    if (path === '/playlists') {
      return (
        <PlaylistsPage
          onOpenVideo={handleOpenVideo}
          favoritesSet={favoritesSet}
          onFavoriteToggle={handleFavoriteToggle}
          onAddToPlaylist={(video) => setAddToPlaylistVideo(video)}
        />
      );
    }

    if (path === '/profile') {
      return renderAuthGate(<ProfilePage {...({ onNavigate: navigate } as any)} />);
    }

    // Default Home Page with Country Filter Support
    return (
      <HomePage
        onOpenVideo={handleOpenVideo}
        onNavigate={navigate}
        favoritesSet={favoritesSet}
        onFavoriteToggle={handleFavoriteToggle}
        onAddToPlaylist={(v) => setAddToPlaylistVideo(v)}
        selectedCountry={selectedCountry}
        onClearCountry={() => setSelectedCountry(null)}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#08090D] text-white flex flex-col font-sans">
      <Header
        {...({
          searchQuery,
          onSearchChange: setSearchQuery,
          onSearchSubmit: handleSearchSubmit,
          onToggleMobileSidebar: () => setIsMobileSidebarOpen(true),
          onNavigate: navigate,
          selectedCountry,
          onOpenCountryModal: () => setIsCountryModalOpen(true),
          onClearCountry: () => handleSelectCountry(null),
        } as any)}
      />

      <div className="flex-1 flex max-w-[1800px] w-full mx-auto">
        <Sidebar
          currentPath={path}
          onNavigate={navigate}
          categories={categories}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 pb-28 lg:pb-8 min-w-0 overflow-x-hidden">
          {renderContent()}
        </main>
      </div>

      <Footer onNavigate={navigate} />
      <BottomNav currentPath={path} onNavigate={navigate} />

      <AddToPlaylistModal
        video={addToPlaylistVideo}
        isOpen={!!addToPlaylistVideo}
        onClose={() => setAddToPlaylistVideo(null)}
      />

      <CountryFilterModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        selectedCountry={selectedCountry}
        onSelectCountry={handleSelectCountry}
      />

      <ThemeColorModal
        isOpen={isThemeModalOpen}
        onClose={closeThemeModal}
      />
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
