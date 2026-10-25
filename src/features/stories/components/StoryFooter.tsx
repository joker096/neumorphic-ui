import { Eye, Heart } from 'lucide-react';

interface StoryFooterProps {
  viewsCount: number;
  likesCount: number;
  likedByMe: boolean;
  onToggleLike: () => void;
}

export function StoryFooter({ viewsCount, likesCount, likedByMe, onToggleLike }: StoryFooterProps) {
  return (
    <div className="absolute bottom-0 inset-x-0 flex items-center px-4 pb-3 pt-12 bg-gradient-to-t from-black/50 to-transparent">
      <span className="flex items-center gap-2 text-white/90 text-sm">
        <Eye size={18} aria-hidden="true" />
        {viewsCount}
      </span>
      <button
        type="button"
        onClick={onToggleLike}
        aria-label={likedByMe ? 'Unlike' : 'Like'}
        aria-pressed={likedByMe}
        className="ml-auto min-w-11 min-h-11 rounded-full flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
      >
        <Heart size={22} className={likedByMe ? 'text-[var(--danger)] fill-[var(--danger)]' : 'text-white'} />
        <span className="text-white text-sm tabular-nums">{likesCount}</span>
      </button>
    </div>
  );
}
