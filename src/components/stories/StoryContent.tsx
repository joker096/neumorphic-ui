import React, { useCallback, useRef, useState } from 'react';
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
  onSwipeNext: () => void;
  onSwipePrev: () => void;
  onSwipeClose: () => void;
}

export const StoryContent: React.FC<StoryContentProps> = ({
  story, isStealthMode, onTap, onPauseStart, onPauseEnd,
  onSwipeNext, onSwipePrev, onSwipeClose,
}) => {
  const { t } = useI18n();
  const [mediaFailed, setMediaFailed] = useState(false);
  const showImage = story.type === 'photo' && !!story.image && !mediaFailed;
  const showVideo = story.type === 'video' && !!story.video && !mediaFailed;

  const swipeRef = useRef({ startX: 0, startY: 0, moved: false });
  const swipeConsumedRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    swipeRef.current = { startX: touch.clientX, startY: touch.clientY, moved: false };
    swipeConsumedRef.current = false;
    onPauseStart();
  }, [onPauseStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const s = swipeRef.current;
    const dx = touch.clientX - s.startX;
    const dy = touch.clientY - s.startY;
    if (Math.hypot(dx, dy) > 8) s.moved = true;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const changed = e.changedTouches[0];
    const s = swipeRef.current;
    const dx = changed.clientX - s.startX;
    const dy = changed.clientY - s.startY;
    if (s.moved) {
      if (Math.abs(dy) > 120 && Math.abs(dy) > Math.abs(dx) * 1.5) {
        swipeConsumedRef.current = true;
        onSwipeClose();
      } else if (dx < -80) {
        swipeConsumedRef.current = true;
        onSwipeNext();
      } else if (dx > 80) {
        swipeConsumedRef.current = true;
        onSwipePrev();
      }
    }
    onPauseEnd();
  }, [onSwipeClose, onSwipeNext, onSwipePrev, onPauseEnd]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (swipeConsumedRef.current) {
      swipeConsumedRef.current = false;
      return;
    }
    onTap(e);
  }, [onTap]);

  return (
    <div
      className="flex-1 w-full overflow-hidden relative flex items-center justify-center select-none touch-pan-x"
      onClick={handleClick}
      onMouseDown={onPauseStart}
      onMouseUp={onPauseEnd}
      onMouseLeave={onPauseEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${story.bg ?? STORY_DEFAULT_GRADIENT}`} aria-hidden="true" />
      {showImage && (
        <img
          src={story.image}
          alt={story.caption ?? ''}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setMediaFailed(true)}
        />
      )}
      {showVideo && (
        <video
          src={story.video}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setMediaFailed(true)}
        />
      )}
      {(story.type === 'photo' || story.type === 'video') && mediaFailed && (
        <div className="absolute inset-0 flex items-center justify-center text-white/70" aria-hidden="true">
          <ImageOff size={48} />
        </div>
      )}
      {story.caption && (
        <div className="absolute bottom-36 left-0 right-0 z-10 px-6 text-center text-white text-lg font-medium drop-shadow-lg break-words max-h-40 overflow-hidden">
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
