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
    { id: '/', label: 'Home', icon: '⌂' },
    { id: '/explore', label: 'Explore', icon: '◉' },
    { id: '/categories', label: 'Categories', icon: '▣' },
    { id: '/favorites', label: 'Favorites', icon: '❤️' },
    { id: '/playlists', label: 'Playlists', icon: '📋' },
    { id: '/history', label: 'History', icon: '🕒' },
    { id: '/saved', label: 'Saved Videos', icon: '🔖' },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-[57px] left-0 z-50 lg:z-30 w-64 h-screen lg:h-[calc(100vh-57px)] bg-[#08090D] border-r border-white/10 p-4 flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between lg:hidden pb-2 border-b border-white/10">
            <span className="font-extrabold text-white text-lg">Menu</span>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white rounded-lg"
            >
              ✕
            </button>
          </div>

          {/* Main Nav Items */}
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-[var(--accent-red)] text-white shadow-lg shadow-red-600/30'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-white/10 pt-4" />

          {/* Categories Quick Links */}
          <div>
            <p className="px-3.5 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Categories
            </p>
            <div className="space-y-1">
              {categories.slice(0, 8).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onNavigate(`/category/${cat.name}`);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] text-red-500">●</span>
                    {cat.name}
                  </span>
                  {(cat.video_count !== undefined || cat.count !== undefined) && (
                    <span className="text-[10px] text-zinc-400 font-bold bg-white/5 px-1.5 py-0.5 rounded">
                      {Number(cat.video_count || cat.count || 0).toLocaleString()}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer copyright note */}
        <div className="mt-6 p-3 rounded-xl bg-white/5 border border-white/5 text-center">
          <p className="text-[11px] font-bold text-zinc-400">ZoneTube Platform</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">High Performance Streaming</p>
        </div>
      </aside>
    </>
  );
};
