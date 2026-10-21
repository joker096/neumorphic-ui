import React, { type ReactNode } from 'react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

export interface StoryMenuAction {
  key: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface StoryActionMenuProps {
  open: boolean;
  onClose: () => void;
  title: string;
  actions: StoryMenuAction[];
}

/**
 * Compact story popover anchored inside the viewer card (Telegram-style).
 * Unlike the generic message bottom sheet it has no Cancel row: the backdrop,
 * Escape and every action row close it.
 */
export const StoryActionMenu: React.FC<StoryActionMenuProps> = ({ open, onClose, title, actions }) => {
  useEscapeKey(onClose, open);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-30 flex items-end justify-end"
      data-testid="story-menu-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={title}
        className="glass-menu mr-3 mb-20 w-60 max-w-[calc(100%-1.5rem)] rounded-2xl p-1.5 shadow-[var(--shadow-modal)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          {title}
        </div>
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className={`glass-menu-item flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium ${
              action.danger ? 'danger' : ''
            }`}
          >
            <span className="flex shrink-0 items-center text-[var(--text-secondary)]">{action.icon}</span>
            <span className="truncate">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
