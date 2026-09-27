import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', onClick }) => {
  const { settings } = useSettings();
  const rawName = settings.site_name?.trim() || 'ZoneTube';

  // Style the very first letter to be the dynamic accent color (or XVideos style first letter),
  // and the remaining letters crisp white. No play video button, no box background.
  const firstLetter = rawName.charAt(0);
  const remaining = rawName.slice(1);

  const textSize =
    size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl';

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer select-none font-black tracking-tight flex items-center leading-none ${textSize} ${className}`}
      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      <span
        style={{ color: 'var(--accent-red)' }}
        className="font-black uppercase inline-block drop-shadow-sm transition-colors duration-200"
      >
        {firstLetter}
      </span>
      <span className="text-white font-black">{remaining}</span>
    </div>
  );
};
