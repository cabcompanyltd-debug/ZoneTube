import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Logo } from '../common/Logo';
import { UserAvatar } from '../common/UserAvatar';
import { Country } from '../../data/countries';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  onToggleMobileSidebar: () => void;
  onNavigate: (path: string) => void;
  selectedCountry?: Country | null;
  onOpenCountryModal?: () => void;
  onClearCountry?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onToggleMobileSidebar,
  onNavigate,
  selectedCountry,
  onOpenCountryModal,
  onClearCountry,
}) => {
  const { user, logout, isAdmin } = useAuth();
  const { settings, openThemeModal, themeMode } = useSettings();
  const [profileOpen, setProfileOpen] = useState(false);

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light': return '☀️';
      case 'cyber': return '⚡';
      case 'emerald': return '💎';
      case 'dark':
      default: return '🌙';
    }
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light': return 'Pure Porcelain';
      case 'cyber': return 'Cyber Midnight';
      case 'emerald': return 'Emerald Velvet';
      case 'dark':
      default: return 'Midnight Obsidian';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#08090D]/90 backdrop-blur-md border-b border-white/10 px-4 md:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-zinc-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Toggle Navigation"
          >
            <i className="fa-solid fa-bars text-base" />
          </button>

          <Logo onClick={() => onNavigate('/')} />
        </div>

        {/* Center: Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl mx-2 hidden sm:flex">
          <div className="relative w-full flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search videos, categories, or channels..."
              className="w-full bg-[#151821] border border-white/10 rounded-full py-2 pl-4 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--accent-red)] focus:ring-1 focus:ring-[var(--accent-red)] transition-all"
            />
            <button
              type="submit"
              className="absolute right-3.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Search"
            >
              <i className="fa-solid fa-magnifying-glass text-xs" />
            </button>
          </div>
        </form>

        {/* Right: Actions / Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onNavigate('/search')}
            className="sm:hidden p-2 text-zinc-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title="Search"
          >
            <i className="fa-solid fa-magnifying-glass text-sm" />
          </button>

          {/* Globe & Country Selector in Navigation Bar */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onOpenCountryModal}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm group ${
                selectedCountry
                  ? 'bg-red-950/70 border-red-500/60 text-white ring-1 ring-red-500/40 rounded-r-none border-r-0'
                  : 'border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 text-white'
              }`}
              title={selectedCountry ? `Filtering videos from: ${selectedCountry.name}. Click to change.` : 'Browse videos by Country'}
              aria-label="Country Filter"
            >
              <span className="text-base leading-none group-hover:scale-110 transition-transform">
                {selectedCountry ? selectedCountry.flag : '🌐'}
              </span>
              <span className="hidden sm:inline-block max-w-[95px] truncate font-bold text-xs">
                {selectedCountry ? selectedCountry.name : 'Global'}
              </span>
              <span className="text-[10px] text-zinc-400 group-hover:text-white">▼</span>
            </button>
            {selectedCountry && onClearCountry && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearCountry();
                }}
                className="px-2 py-1.5 bg-red-950/70 border border-l-0 border-red-500/60 text-zinc-400 hover:text-white rounded-r-xl text-xs font-bold transition-colors cursor-pointer ring-1 ring-red-500/40"
                title="Reset back to Global (show all videos)"
                aria-label="Reset back to Global"
              >
                ✕
              </button>
            )}
          </div>

          {/* Settings & Theme Mode / Color Button */}
          <button
            type="button"
            onClick={openThemeModal}
            className="px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm group"
            title={`Active Theme: ${getThemeLabel()} - Click to customize`}
            aria-label={`Theme Settings (${getThemeLabel()})`}
          >
            <span className="text-sm transition-transform duration-300 group-hover:scale-110 leading-none">{getThemeIcon()}</span>
            <span className="hidden xl:inline-block text-[11px] font-semibold text-zinc-300 group-hover:text-white">
              {getThemeLabel()}
            </span>
          </button>

          {isAdmin && (
            <button
              onClick={() => onNavigate('/admin')}
              style={{
                backgroundColor: 'var(--accent-red)',
                boxShadow: '0 4px 14px var(--accent-glow, rgba(229,9,20,0.35))',
              }}
              className="px-3.5 py-1.5 text-white font-bold text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              ⚙ Admin
            </button>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 p-1 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 cursor-pointer"
              >
                <UserAvatar
                  src={user.avatar}
                  name={user.name}
                  size="sm"
                  showBorder
                />
                <span className="text-xs font-bold text-white hidden md:inline-block max-w-[100px] truncate">
                  {user.name}
                </span>
                <small className="text-zinc-400 hidden md:inline-block">⌄</small>
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-[#151821] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-scale-up"
                  onClick={() => setProfileOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-sm font-bold text-white truncate">{user.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                    <span
                      className="inline-block mt-1 px-2 py-0.5 text-[10px] font-extrabold uppercase rounded border"
                      style={{
                        borderColor: 'var(--accent-border, rgba(229,9,20,0.4))',
                        backgroundColor: 'var(--accent-subtle, rgba(229,9,20,0.15))',
                        color: 'var(--accent-red)',
                      }}
                    >
                      {user.role}
                    </span>
                  </div>

                  <button
                    onClick={() => onNavigate('/dashboard')}
                    className="w-full text-left px-4 py-2.5 text-xs text-zinc-200 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    👤 User Dashboard
                  </button>
                  <button
                    onClick={() => onNavigate('/favorites')}
                    className="w-full text-left px-4 py-2.5 text-xs text-zinc-200 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    ❤️ Saved Favorites
                  </button>
                  <button
                    onClick={() => onNavigate('/history')}
                    className="w-full text-left px-4 py-2.5 text-xs text-zinc-200 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    🕒 Watch History
                  </button>
                  <button
                    onClick={() => onNavigate('/profile')}
                    className="w-full text-left px-4 py-2.5 text-xs text-zinc-200 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    ⚙ Account Settings
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      openThemeModal();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-zinc-200 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    🎨 Theme & Accent Color
                  </button>

                  <div className="border-t border-white/10 my-1" />

                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              style={{
                backgroundColor: 'var(--accent-red)',
                boxShadow: '0 4px 14px var(--accent-glow, rgba(229,9,20,0.35))',
              }}
              className="px-3 py-1.5 text-white text-xs font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer whitespace-nowrap leading-none"
            >
              Sign In/Up
            </button>
          )}
        </div>
      </header>
    </>
  );
};

