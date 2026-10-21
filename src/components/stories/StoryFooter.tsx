import React from 'react';
import { Eye, Heart, Send, Share2, MoreVertical } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { toast } from '../ui/Toast';
import { STORY_REPLY_MAX_LENGTH } from '../../constants/storyConstants';
import type { StoryUser } from './storiesData';

interface StoryFooterProps {
  user: StoryUser;
  reply: string;
  liked: boolean;
  /** View count of the current story — only rendered for the viewer's own story. */
  views?: number;
  onReplyChange: (value: string) => void;
  onSendReply: () => void;
  onToggleLike: () => void;
  onShare: () => void;
  onOpenMenu: () => void;
}

const circleClass =
  'h-11 w-11 min-w-11 min-h-11 shrink-0 rounded-full flex items-center justify-center border border-white/15 backdrop-blur-sm transition-colors active:scale-95';

export const StoryFooter: React.FC<StoryFooterProps> = ({
  user,
  reply,
  liked,
  views,
  onReplyChange,
  onSendReply,
  onToggleLike,
  onShare,
  onOpenMenu,
}) => {
  const { t } = useI18n();

  const handleLike = () => {
    onToggleLike();
    toast(liked ? t('story.unliked', 'Removed reaction') : t('story.liked', 'Reacted ❤'), 'success');
  };

  const viewLabel = t('story.views', { count: views ?? 0 });

  return (
    <div className="absolute bottom-0 left-0 z-20 flex w-full items-center gap-2 p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      {user.isMe && (
        <div
          className="mr-auto flex h-11 min-h-11 items-center gap-1.5 rounded-full border border-white/15 bg-white/15 px-3.5 text-sm font-medium text-white backdrop-blur-sm tabular-nums"
          aria-label={viewLabel}
          title={viewLabel}
        >
          <Eye size={18} aria-hidden="true" />
          {views ?? 0}
        </div>
      )}
      {!user.isMe && (
        <input
          type="text"
          value={reply}
          onChange={(e) => onReplyChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSendReply()}
          placeholder={t('story.replyPlaceholder', 'Send a reply…')}
          aria-label={t('story.replyPlaceholder', 'Send a reply…')}
          maxLength={STORY_REPLY_MAX_LENGTH}
          className="h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-white/15 px-4 text-sm text-white outline-none placeholder:text-white/55 focus:bg-white/25"
        />
      )}
      {!user.isMe && (
        <button
          type="button"
          onClick={handleLike}
          aria-label={t('story.react')}
          aria-pressed={liked}
          className={`${circleClass} ${liked ? 'bg-rose-500 text-[var(--ink-on-saturate)]' : 'bg-white/15 text-white hover:bg-white/25'}`}
        >
          <Heart size={20} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      )}
      {!user.isMe && (
        <button
          type="button"
          onClick={onSendReply}
          disabled={!reply.trim()}
          aria-label={t('story.sendReply', 'Send')}
          className={`${circleClass} bg-[var(--accent)] text-[var(--button-primary-text)] disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <Send size={20} aria-hidden="true" />
        </button>
      )}
      <button
        type="button"
        onClick={onShare}
        aria-label={t('story.share', 'Share')}
        className={`${circleClass} bg-white/15 text-white hover:bg-white/25`}
      >
        <Share2 size={20} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={t('common.more')}
        aria-haspopup="menu"
        className={`${circleClass} bg-white/15 text-white hover:bg-white/25`}
      >
        <MoreVertical size={20} aria-hidden="true" />
      </button>
    </div>
  );
};
