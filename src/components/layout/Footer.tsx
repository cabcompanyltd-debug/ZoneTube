import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Logo } from '../common/Logo';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings, openThemeModal } = useSettings();
  const siteName = settings.site_name || 'ZoneTube';

  return (
    <footer className="mt-16 bg-[#08090D] border-t border-white/10 pt-12 pb-24 md:pb-12 px-6 text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div>
          <div className="mb-3">
            <Logo size="lg" onClick={() => onNavigate('/')} />
          </div>
          <p className="text-zinc-400 leading-relaxed font-normal">
            The next-generation video streaming platform delivering authorized, high quality content across devices.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Platform</h4>
          <ul className="space-y-2">
            <li>
              <button onClick={() => onNavigate('/')} className="hover:text-white transition-colors">
                Home
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/explore')} className="hover:text-white transition-colors">
                Explore Videos
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/categories')} className="hover:text-white transition-colors">
                Browse Categories
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/about')} className="hover:text-white transition-colors">
                About ZoneTube
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">User Account</h4>
          <ul className="space-y-2">
            <li>
              <button onClick={() => onNavigate('/dashboard')} className="hover:text-white transition-colors">
                User Dashboard
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/favorites')} className="hover:text-white transition-colors">
                Saved Favorites
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/history')} className="hover:text-white transition-colors">
                Watch History
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/profile')} className="hover:text-white transition-colors">
                Account Settings
              </button>
            </li>
            <li>
              <button
                onClick={openThemeModal}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-zinc-300"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-red)' }} />
                <span>Customize Theme</span>
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4
            onClick={() => onNavigate('/legal')}
            className="text-white font-bold mb-3 uppercase tracking-wider text-[11px] hover:text-[var(--accent-red)] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Legal & Compliance</span>
            <i className="fa-solid fa-arrow-right text-[9px]" />
          </h4>
          <ul className="space-y-2">
            <li>
              <button onClick={() => onNavigate('/legal')} className="hover:text-white transition-colors cursor-pointer text-zinc-300 font-medium">
                Legal & Compliance Hub
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/terms')} className="hover:text-white transition-colors cursor-pointer">
                Terms of Service
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/privacy')} className="hover:text-white transition-colors cursor-pointer">
                Privacy Policy
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/dmca')} className="hover:text-white transition-colors cursor-pointer">
                DMCA & Content Policy
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors cursor-pointer">
                Contact Support
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© 2026 ZoneTube Inc. All rights reserved. Powered by authorized video provider APIs.</p>
        <p className="text-zinc-500 text-[11px]">
          Designed for maximum performance, security, and mobile responsiveness.
        </p>
      </div>
    </footer>
  );
};
