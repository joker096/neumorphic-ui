import React from 'react';

interface AvatarProps {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const dotSizeMap = {
  sm: 'w-2.5 h-2.5 border-[1.5px]',
  md: 'w-3 h-3 border-2',
  lg: 'w-3.5 h-3.5 border-2',
  xl: 'w-4 h-4 border-2',
};

export function Avatar({ name, color, size = 'md', online, className = '' }: AvatarProps) {
  const initials = name.charAt(0).toUpperCase();
  const gradient = color || 'from-orange-500 to-amber-600';

  return (
    <div className={`relative shrink-0 ${className}`}>
      <div
        className={`${sizeMap[size]} rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-[var(--text-primary)] shadow-sm`}
      >
        {initials}
      </div>
      {online !== undefined && (
        <div
          className={`absolute -bottom-[1px] -right-[1px] ${dotSizeMap[size]} rounded-full ${
            online
              ? 'bg-green-400 border-[var(--bg-secondary)]'
              : 'bg-gray-500 border-[var(--bg-secondary)]'
          }`}
        />
      )}
    </div>
  );
}

