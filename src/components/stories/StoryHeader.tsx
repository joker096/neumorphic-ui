import React from 'react';
import { Lock } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { CloseButton } from '../ui/CloseButton';
import type { StoryUser } from './storiesData';

interface StoryHeaderProps {
  user: StoryUser;
  timeLabel: string;
  onClose: () => void;
}

export const StoryHeader: React.FC<StoryHeaderProps> = ({ user, timeLabel, onClose }) => {
  const { t } = useI18n();
  return (
    <div className="absolute top-6 left-0 w-full px-4 flex items-center gap-3 z-20">
      <div
        className={`w-10 h-10 rounded-full bg-gradient-to-br ${user.avatarColor} flex items-center justify-center text-white font-bold shrink-0`}
        aria-hidden="true"
      >
        {user.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-white font-semibold text-sm">
          <span className="truncate">{user.name}</span>
          {user.verified && <span className="text-[var(--accent)]" aria-label={t('story.verified', 'Verified')}>✓</span>}
        </div>
        <div className="text-white/60 text-[11px] truncate">{timeLabel}</div>
      </div>
      {user.isMe && (
        <div className="flex items-center gap-1 text-white/60 text-[11px] bg-white/10 px-2 py-1 rounded-full shrink-0">
          <Lock size={11} aria-hidden="true" /> {t('story.private', 'Private')}
        </div>
      )}
      <CloseButton onClick={onClose} aria-label={t('common.close')} size="lg" className="!text-white hover:!bg-white/20" />
    </div>
  );
};
