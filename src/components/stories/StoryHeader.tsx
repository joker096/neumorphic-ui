import React from 'react';
import { EyeOff, Lock } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { CloseButton } from '../ui/CloseButton';
import { getUnseenCount } from '../../lib/stories/storySeen';
import type { StoryUser } from './storiesData';

interface StoryHeaderProps {
  user: StoryUser;
  timeLabel: string;
  onClose: () => void;
  isStealthMode?: boolean;
}

export const StoryHeader: React.FC<StoryHeaderProps> = ({ user, timeLabel, onClose, isStealthMode = false }) => {
  const { t } = useI18n();
  const unseen = user.isMe || getUnseenCount(user) > 0;
  return (
    <div className="absolute top-6 left-0 w-full px-4 flex items-center gap-3 z-20">
      <span
        className={`shrink-0 rounded-full p-[2px] ${
          unseen
            ? 'bg-gradient-to-tr from-[var(--accent)] to-[var(--accent2,var(--accent))]'
            : 'bg-white/20'
        }`}
        aria-hidden="true"
      >
        <span
          className={`w-11 h-11 rounded-full bg-gradient-to-br ${user.avatarColor} flex items-center justify-center text-white font-bold`}
        >
          {user.name.charAt(0)}
        </span>
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-white font-semibold text-sm">
          <span className="truncate">{user.name}</span>
          {user.verified && <span className="text-[var(--accent)]" aria-label={t('story.verified', 'Verified')}>✓</span>}
        </div>
        <div className="text-white/60 text-xs truncate">{timeLabel}</div>
      </div>
      {isStealthMode && (
        <div className="flex items-center gap-1 text-white/60 text-xs bg-white/10 px-2 py-1 rounded-full shrink-0">
          <EyeOff size={12} aria-hidden="true" /> {t('story.viewedStealthily', 'Viewed stealthily')}
        </div>
      )}
      {user.isMe && (
        <div className="flex items-center gap-1 text-white/60 text-xs bg-white/10 px-2 py-1 rounded-full shrink-0">
          <Lock size={12} aria-hidden="true" /> {t('story.private', 'Private')}
        </div>
      )}
      <CloseButton onClick={onClose} aria-label={t('common.close')} size="lg" className="!text-white hover:!bg-white/20" />
    </div>
  );
};
