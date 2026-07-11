import React, { type ReactNode } from 'react';

interface ListItemProps {
  avatar?: ReactNode;
  title: string;
  subtitle?: string;
  subtitleSecondary?: string;
  right?: ReactNode;
  onClick?: () => void;
  className?: string;
  interactive?: boolean;
}

export function ListItem({
  avatar,
  title,
  subtitle,
  subtitleSecondary,
  right,
  onClick,
  className = '',
  interactive = true,
}: ListItemProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`w-full flex items-center gap-3 text-left ${
        interactive && onClick ? 'hover:bg-[var(--list-item-hover-bg)]' : ''
      } transition-colors px-4 py-3 ${className}`}
    >
      {avatar && <div className="shrink-0">{avatar}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate text-[var(--text-primary)]">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs mt-0.5 truncate text-[var(--text-secondary)]">
            {subtitle}
          </div>
        )}
        {subtitleSecondary && (
          <div className="text-[10px] mt-0.5 text-[var(--text-tertiary)]">
            {subtitleSecondary}
          </div>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </Component>
  );
}
