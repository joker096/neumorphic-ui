import React from 'react';

interface AvatarProps {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  src?: string;
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const imageSizeMap = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const dotSizeMap = {
  sm: 'w-2.5 h-2.5 border-[1.5px]',
  md: 'w-3 h-3 border-2',
  lg: 'w-3.5 h-3.5 border-2',
  xl: 'w-4 h-4 border-2',
};

export function Avatar({ name, color, size = 'md', online, src, className = '' }: AvatarProps) {
  const initials = name.charAt(0).toUpperCase();
  const gradient = color || 'from-[var(--accent)] to-[var(--accent2)]';

  return (
    <div className={`relative shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={`${name} avatar`}
          className={`${imageSizeMap[size]} rounded-full object-cover shadow-sm`}
        />
      ) : (
        <div
          className={`${sizeMap[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-[var(--text-primary)] shadow-sm`}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <div
          className={`absolute -bottom-[1px] -right-[1px] ${dotSizeMap[size]} rounded-full ${
            online
              ? 'bg-green-400 border-[var(--bg-secondary)]'
              : 'bg-[var(--text-tertiary)] border-[var(--bg-secondary)]'
          }`}
        />
      )}
    </div>
  );
}

