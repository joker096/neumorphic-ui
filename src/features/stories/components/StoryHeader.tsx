import { Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { useI18n } from '../../../lib/i18n';
import type { StoryAuthor } from '../types';

interface StoryHeaderProps {
  author: StoryAuthor;
  dateLabel: string;
  paused: boolean;
  muted: boolean;
  isVideo: boolean;
  onPause: () => void;
  onResume: () => void;
  onToggleMute: () => void;
  onClose: () => void;
}

const ICON_BTN =
  'min-w-11 min-h-11 rounded-full flex items-center justify-center text-white cursor-pointer transition-transform active:scale-95 hover:bg-white/15';

export function StoryHeader({ author, dateLabel, paused, muted, isVideo, onPause, onResume, onToggleMute, onClose }: StoryHeaderProps) {
  const { t } = useI18n();
  return (
    <div className="absolute top-0 inset-x-0 flex items-center gap-3 px-4 pt-3 pb-10 bg-gradient-to-b from-black/60 to-transparent">
      <span
        className="block w-9 h-9 rounded-full overflow-hidden border border-white/30 shrink-0"
        style={{ backgroundImage: `url("${author.avatarUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <span className="flex-1 min-w-0 flex flex-col">
        <span className="text-white font-semibold text-sm leading-tight truncate">{author.name}</span>
        <span className="text-white/80 text-xs">{dateLabel}</span>
      </span>
      <button type="button" aria-label={paused ? t('story.play') : t('story.pause')} title={paused ? t('story.play') : t('story.pause')} onClick={paused ? onResume : onPause} className={ICON_BTN}>
        {paused ? <Play size={20} /> : <Pause size={20} />}
      </button>
      {isVideo && (
        <button type="button" aria-label={muted ? t('story.unmute') : t('story.mute')} title={muted ? t('story.unmute') : t('story.mute')} onClick={onToggleMute} className={ICON_BTN}>
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      )}
      <button type="button" aria-label={t('story.close')} onClick={onClose} className={ICON_BTN}>
        <X size={20} />
      </button>
    </div>
  );
}
