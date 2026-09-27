import React from 'react';

interface BottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPath, onNavigate }) => {
  const items = [
    { id: '/', label: 'Home', icon: '⌂' },
    { id: '/explore', label: 'Explore', icon: '◉' },
    { id: '/categories', label: 'Categories', icon: '▣' },
    { id: '/favorites', label: 'Saved', icon: '❤️' },
    { id: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#08090D]/95 backdrop-blur-lg border-t border-white/10 py-1.5 px-2 flex items-center justify-around lg:hidden">
      {items.map((item) => {
        const isActive = currentPath === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              isActive ? 'text-[var(--accent-red)] font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
