import React, { useState } from 'react';
import { Eye, ImageOff } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { STORY_DEFAULT_GRADIENT } from '../../constants/storyConstants';
import type { StoryItem } from './storiesData';

interface StoryContentProps {
  story: StoryItem;
  isStealthMode: boolean;
  onTap: (e: React.MouseEvent<HTMLDivElement>) => void;
  onPauseStart: () => void;
  onPauseEnd: () => void;
}

export const StoryContent: React.FC<StoryContentProps> = ({ story, isStealthMode, onTap, onPauseStart, onPauseEnd }) => {
  const { t } = useI18n();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = story.type === 'photo' && !!story.image && !imageFailed;

  return (
    <div
      className="flex-1 w-full overflow-hidden relative flex items-center justify-center select-none"
      onClick={onTap}
      onMouseDown={onPauseStart}
      onMouseUp={onPauseEnd}
      onMouseLeave={onPauseEnd}
      onTouchStart={onPauseStart}
      onTouchEnd={onPauseEnd}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${story.bg ?? STORY_DEFAULT_GRADIENT}`} aria-hidden="true" />
      {showImage && (
        <img
          src={story.image}
          alt={story.caption ?? ''}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImageFailed(true)}
        />
      )}
      {story.type === 'photo' && imageFailed && (
        <div className="absolute inset-0 flex items-center justify-center text-white/70" aria-hidden="true">
          <ImageOff size={48} />
        </div>
      )}
      {story.caption && (
        <div className="relative z-10 px-6 text-center text-white text-lg font-medium drop-shadow-lg max-w-[80%] break-words">
          {story.caption}
        </div>
      )}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-white/80 text-xs z-10">
        <Eye size={14} aria-hidden="true" />
        {isStealthMode
          ? t('story.viewedStealthily', 'Viewed stealthily')
          : t('story.views', { count: story.views })}
      </div>
    </div>
  );
};
