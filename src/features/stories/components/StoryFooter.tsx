import { Eye, Heart } from 'lucide-react';
import { useI18n } from '../../../lib/i18n';

interface StoryFooterProps {
  viewsCount: number;
  likesCount: number;
  likedByMe: boolean;
  onToggleLike: () => void;
}

export function StoryFooter({ viewsCount, likesCount, likedByMe, onToggleLike }: StoryFooterProps) {
  const { t } = useI18n();
  return (
    <div className="absolute bottom-0 inset-x-0 flex items-center px-4 pb-3 pt-12 bg-gradient-to-t from-black/50 to-transparent">
      <span className="flex items-center gap-1.5 text-white/90 text-sm tabular-nums">
        <Eye size={16} aria-hidden="true" />
        {viewsCount}
      </span>
      <button
        type="button"
        onClick={onToggleLike}
        aria-label={likedByMe ? t('story.unlike') : t('story.like')}
        aria-pressed={likedByMe}
        className="ml-auto min-w-11 min-h-11 rounded-full flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
      >
        <Heart size={24} className={likedByMe ? 'text-[var(--danger)] fill-[var(--danger)]' : 'text-white'} />
        <span className="text-white text-sm tabular-nums">{likesCount}</span>
      </button>
    </div>
  );
}
