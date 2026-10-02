import React from 'react';

interface BottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPath, onNavigate }) => {
  const items = [
    {
      id: '/',
      label: 'Home',
      icon: (active: boolean) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={active ? '0' : '2'}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          {active && <polyline points="9 22 9 12 15 12 15 22" fill="#08090D" />}
        </svg>
      ),
    },
    {
      id: '/explore',
      label: 'Explore',
      icon: (active: boolean) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={active ? '0' : '2'}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={active ? '#08090D' : 'none'} />
        </svg>
      ),
    },
    {
      id: '/categories',
      label: 'Categories',
      icon: (active: boolean) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={active ? '0' : '2'}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <rect width="7" height="7" x="3" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="14" rx="1.5" />
          <rect width="7" height="7" x="3" y="14" rx="1.5" />
        </svg>
      ),
    },
    {
      id: '/favorites',
      label: 'Saved',
      icon: (active: boolean) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={active ? '0' : '2'}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      ),
    },
    {
      id: '/profile',
      label: 'Profile',
      icon: (active: boolean) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={active ? '0' : '2'}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#08090D]/95 dark:bg-[#08090D]/95 backdrop-blur-xl border-t border-white/10 px-2 pt-1.5 pb-safe flex items-center justify-around lg:hidden shadow-[0_-8px_24px_rgba(0,0,0,0.5)] transition-all"
    >
      {items.map((item) => {
        const isActive =
          currentPath === item.id ||
          (item.id !== '/' && currentPath.startsWith(item.id));

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[56px] py-1 px-2 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer relative group ${
              isActive
                ? 'text-[var(--accent-red)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {/* Active glow backing */}
            {isActive && (
              <span
                className="absolute inset-x-2 inset-y-1 rounded-xl opacity-15 pointer-events-none transition-opacity"
                style={{ backgroundColor: 'var(--accent-red)' }}
              />
            )}

            <div className="relative transition-transform duration-200 group-active:scale-110">
              {item.icon(isActive)}
              {isActive && (
                <span
                  className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full shadow-sm"
                  style={{
                    backgroundColor: 'var(--accent-red)',
                    boxShadow: '0 0 6px var(--accent-glow, rgba(229,9,20,0.8))',
                  }}
                />
              )}
            </div>

            <span
              className={`text-[10px] tracking-tight mt-1 transition-all ${
                isActive ? 'font-bold text-[var(--accent-red)]' : 'font-medium text-zinc-400 group-hover:text-zinc-200'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
