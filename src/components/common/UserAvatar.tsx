import React, { useState } from 'react';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  className = '',
  showBorder = true,
}) => {
  const [imageError, setImageError] = useState(false);
  const sizeClasses = sizeMap[size] || sizeMap.md;
  const initial = (name || 'U').trim().charAt(0).toUpperCase();

  // If image exists and hasn't errored
  const hasValidImage = Boolean(src && !imageError);

  return (
    <div
      className={`relative rounded-full shrink-0 flex items-center justify-center font-black select-none overflow-hidden transition-all duration-300 ${sizeClasses} ${
        showBorder ? 'border-2' : ''
      } ${className}`}
      style={{
        borderColor: 'var(--accent-red)',
        backgroundColor: 'var(--accent-red)',
        boxShadow: showBorder ? '0 0 12px var(--accent-glow, rgba(229,9,20,0.25))' : undefined,
      }}
    >
      {hasValidImage ? (
        <img
          src={src!}
          alt={name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span className="text-white drop-shadow-sm font-black tracking-tight">{initial}</span>
      )}
    </div>
  );
};
