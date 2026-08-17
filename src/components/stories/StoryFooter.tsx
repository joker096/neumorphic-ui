import React from 'react';
import { Heart, Share2, MoreVertical } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { toast } from '../ui/Toast';
import { STORY_REPLY_MAX_LENGTH } from '../../constants/storyConstants';
import type { StoryUser } from './storiesData';

interface StoryFooterProps {
  user: StoryUser;
  reply: string;
  liked: boolean;
  onReplyChange: (value: string) => void;
  onSendReply: () => void;
  onToggleLike: () => void;
  onShare: () => void;
  onOpenMenu: () => void;
}

export const StoryFooter: React.FC<StoryFooterProps> = ({
  user,
  reply,
  liked,
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

  return (
    <div className="absolute bottom-0 left-0 w-full p-3 z-20 flex items-center gap-2">
      <input
        type="text"
        value={reply}
        onChange={(e) => onReplyChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSendReply()}
        placeholder={user.isMe ? t('story.repliesOff', 'Replies are off for your story') : t('story.replyPlaceholder', 'Send a reply…')}
        disabled={user.isMe}
        aria-label={t('story.replyPlaceholder', 'Send a reply…')}
        maxLength={STORY_REPLY_MAX_LENGTH}
        className="flex-1 rounded-full px-4 py-2.5 text-sm bg-white/15 text-white placeholder-white/60 border border-white/20 outline-none focus:bg-white/25 min-h-[44px]"
      />
      {!user.isMe && (
        <button
          type="button"
          onClick={handleLike}
          aria-label={t('story.react')}
          aria-pressed={liked}
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors active:scale-95 ${liked ? 'bg-rose-500 text-white' : 'bg-white/15 text-white hover:bg-white/25'}`}
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      )}
      <button
        type="button"
        onClick={onShare}
        aria-label={t('story.share', 'Share')}
        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-white/15 text-white hover:bg-white/25 transition-colors active:scale-95"
      >
        <Share2 size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={t('common.more')}
        aria-haspopup="menu"
        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-white/15 text-white hover:bg-white/25 transition-colors active:scale-95"
      >
        <MoreVertical size={18} aria-hidden="true" />
      </button>
    </div>
  );
};
