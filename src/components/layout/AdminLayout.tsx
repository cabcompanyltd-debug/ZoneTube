import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Logo } from '../common/Logo';
import { UserAvatar } from '../common/UserAvatar';

interface AdminLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  onExitAdmin,
  children,
}) => {
  const { user } = useAuth();
  const { openThemeModal } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'rewriter', label: 'AI Title Rewriter', icon: '🪄' },
    { id: 'videos', label: 'Video Management', icon: '📹' },
    { id: 'import', label: 'Search & Import', icon: '📥' },
    { id: 'categories', label: 'Categories', icon: '🏷️' },
    { id: 'users', label: 'Users & Roles', icon: '👥' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'logs', label: 'Access Logs', icon: '📜' },
    { id: 'settings', label: 'Site Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-[#08090D] text-white flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#101218] border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-300 hover:text-white rounded-lg hover:bg-white/5"
          >
            ☰
          </button>
          <span className="font-extrabold text-lg text-white">ZoneTube Admin</span>
        </div>
        <button
          onClick={onExitAdmin}
          className="text-xs bg-white/10 px-3 py-1.5 rounded-lg text-zinc-300 hover:text-white"
        >
          ← Exit
        </button>
      </div>

      {/* Admin Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 w-64 h-screen bg-[#101218] border-r border-white/10 p-4 flex flex-col justify-between shrink-0 transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <Logo onClick={onExitAdmin} />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <p className="px-2 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
            Administration
          </p>

          <nav className="space-y-1">
            {adminNav.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  style={
                    isActive
                      ? {
                          backgroundColor: 'var(--accent-red)',
                          boxShadow: '0 4px 14px var(--accent-glow, rgba(229,9,20,0.35))',
                        }
                      : undefined
                  }
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'text-white'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <UserAvatar
              src={user?.avatar}
              name={user?.name || 'Administrator'}
              size="sm"
              showBorder
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-zinc-400 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Theme Color Button in Admin Sidebar */}
          <button
            type="button"
            onClick={openThemeModal}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white font-bold text-xs rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <span
              className="w-3 h-3 rounded-full border border-white/40 shadow-sm shrink-0"
              style={{ backgroundColor: 'var(--accent-red)' }}
            />
            <span>🎨 Theme Color</span>
          </button>

          <button
            onClick={onExitAdmin}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            ← Exit to Website
          </button>
        </div>
      </aside>

      {/* Main Admin Content Container */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full min-w-0">
        {children}
      </main>
    </div>
  );
};
