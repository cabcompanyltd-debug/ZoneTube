import React from 'react';
import { Category } from '../../types';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  categories,
  isOpen,
  onClose,
}) => {
  const navItems = [
    {
      id: '/',
      label: 'Home',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          {active && <polyline points="9 22 9 12 15 12 15 22" fill="#08090D" />}
        </svg>
      )
    },
    {
      id: '/explore',
      label: 'Explore',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={active ? "#08090D" : "none"} />
        </svg>
      )
    },
    {
      id: '/categories',
      label: 'Categories',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <rect width="7" height="7" x="3" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="14" rx="1.5" />
          <rect width="7" height="7" x="3" y="14" rx="1.5" />
        </svg>
      )
    },
    {
      id: '/favorites',
      label: 'Favorites',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      )
    },
    {
      id: '/playlists',
      label: 'Playlists',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M21 15V6" /><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path d="M12 12H3" /><path d="M16 6H3" /><path d="M12 18H3" />
        </svg>
      )
    },
    {
      id: '/history',
      label: 'Watch History',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 14 14" />
        </svg>
      )
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Blur Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-[56px] left-0 z-50 lg:z-30 w-64 sm:w-72 lg:w-60 h-screen lg:h-[calc(100vh-56px)] bg-[#08090D]/95 lg:bg-[#08090D] backdrop-blur-xl lg:backdrop-blur-none border-r border-white/10 p-4 flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-5">
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between lg:hidden pb-3 border-b border-white/10">
            <span className="font-extrabold text-white text-base font-display">Navigation</span>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          {/* Primary Nav Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer active:scale-98 ${
                    isActive
                      ? 'bg-[var(--accent-red)] text-white shadow-md shadow-red-600/30 font-bold'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="shrink-0">{item.icon(isActive)}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-white/10 pt-3" />

          {/* Top Categories list */}
          <div>
            <p className="px-3.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Top Categories</span>
            </p>
            <div className="space-y-1">
              {categories.slice(0, 7).map((cat) => (
                <button
                  key={cat.id || cat.name}
                  onClick={() => {
                    onNavigate(`/category/${encodeURIComponent(cat.name)}`);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer active:scale-98"
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="text-[9px] text-[var(--accent-red)]">●</span>
                    <span className="truncate">{cat.name}</span>
                  </span>
                  {(cat.video_count !== undefined || cat.count !== undefined) && (
                    <span className="text-[10px] text-zinc-400 font-mono tabular-nums bg-white/5 px-1.5 py-0.5 rounded">
                      {Number(cat.video_count || cat.count || 0).toLocaleString()}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer brand info */}
        <div className="mt-6 p-3 rounded-xl bg-white/5 border border-white/5 text-center">
          <p className="text-[11px] font-bold text-zinc-300">ZoneTube</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">High Performance Video Streaming</p>
        </div>
      </aside>
    </>
  );
};
