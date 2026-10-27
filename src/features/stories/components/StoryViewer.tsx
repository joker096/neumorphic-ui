import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useStoriesStore } from '../storiesStore';
import { STORY_PHOTO_DEFAULT_MS, STORY_VIDEO_FALLBACK_MS } from '../types';
import { StoryProgressBar } from './StoryProgressBar';
import { StoryHeader } from './StoryHeader';
import { StoryFooter } from './StoryFooter';
import { useI18n } from '../../../lib/i18n';
import { formatRelativeTime } from '../../../utils/relativeTime';

const TICK = 80;
/** Minimum travel (px) for a swipe to count as navigation. */
const SWIPE_MIN = 70;
/** Downward travel (px) that dismisses the viewer — Telegram drag-to-close. */
const DISMISS_MIN = 90;
/** Travel (px) after which a gesture stops counting as a tap. */
const TAP_SLOP = 10;
/** The card follows the finger at a fraction of the travel (0.25 vertical, 0.35 horizontal). */
const DRAG_FOLLOW_Y = 0.45;
const DRAG_FOLLOW_X = 0.25;

/** Full-screen story viewer (9:16 card, modal). */
export function StoryViewer() {
  const authors = useStoriesStore((s) => s.authors);
  const loading = useStoriesStore((s) => s.loading);
  const authorIdx = useStoriesStore((s) => s.authorIdx);
  const storyIdx = useStoriesStore((s) => s.storyIdx);
  const paused = useStoriesStore((s) => s.paused);
  const muted = useStoriesStore((s) => s.muted);
  const init = useStoriesStore((s) => s.init);
  const next = useStoriesStore((s) => s.next);
  const prev = useStoriesStore((s) => s.prev);
  const pause = useStoriesStore((s) => s.pause);
  const resume = useStoriesStore((s) => s.resume);
  const toggleMute = useStoriesStore((s) => s.toggleMute);
  const closeViewer = useStoriesStore((s) => s.closeViewer);
  const markViewed = useStoriesStore((s) => s.markViewed);
  const toggleLike = useStoriesStore((s) => s.toggleLike);
  const nextAuthor = useStoriesStore((s) => s.nextAuthor);

  const { t } = useI18n();

  const [elapsed, setElapsed] = useState(0);
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  /** True while the current gesture has already travelled past a tap. */
  const swiped = useRef(false);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const durations = useRef<Record<string, number>>({});
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authors.length === 0 && !loading) void init();
  }, [authors.length, loading, init]);

  const author = authorIdx !== null ? authors[authorIdx] : undefined;
  const story = author && storyIdx !== null ? author.stories[storyIdx] : undefined;

  const duration = useMemo(() => {
    if (!story) return STORY_PHOTO_DEFAULT_MS;
    if (story.media.kind === 'image') return story.media.durationMs ?? STORY_PHOTO_DEFAULT_MS;
    return durations.current[story.id] ?? story.media.durationMs ?? STORY_VIDEO_FALLBACK_MS;
  }, [story]);

  // reset on story change
  useEffect(() => {
    setElapsed(0);
  }, [authorIdx, storyIdx]);

  // auto-advance timer
  useEffect(() => {
    if (!story || paused || holding) return;
    const timer = setInterval(() => setElapsed((e) => e + TICK), TICK);
    return () => clearInterval(timer);
  }, [story, paused, holding]);

  useEffect(() => {
    if (story && elapsed >= duration) {
      setElapsed(0);
      next();
    }
  }, [elapsed, duration, story, next]);

  // mark viewed with a short delay
  useEffect(() => {
    if (!story) return;
    const t = setTimeout(() => markViewed(story.id), 300);
    return () => clearTimeout(t);
  }, [story?.id]);

  // body scroll lock + keyboard
  useEffect(() => {
    if (!author) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeViewer();
      else if (e.key === ' ') {
        e.preventDefault();
        if (paused) resume();
        else pause();
      } else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowUp') nextAuthor();
      else if (e.key === 'ArrowDown') closeViewer();
    };
    window.addEventListener('keydown', onKey);
    const prevFocus = document.activeElement as HTMLElement | null;
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      prevFocus?.focus?.();
    };
  }, [author, paused, next, prev, nextAuthor, resume, pause, closeViewer]);

  const beginHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      pause();
      setHolding(true);
    }, 200);
  };
  const endHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    if (holding) {
      setHolding(false);
      resume();
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    gesture.current = { x: touch.clientX, y: touch.clientY };
    swiped.current = false;
    setDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const start = gesture.current;
    const touch = e.touches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (!swiped.current && Math.hypot(dx, dy) > TAP_SLOP) {
      swiped.current = true;
      // A drag is not a press-and-hold: drop the pause timer so a swipe
      // cannot leave the story frozen.
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
      if (holding) {
        setHolding(false);
        resume();
      }
    }
    setDrag({ x: dx, y: dy });
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = gesture.current;
    gesture.current = null;
    setDragging(false);
    const touch = e.changedTouches[0];
    if (!start || !touch) {
      setDrag({ x: 0, y: 0 });
      return;
    }
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    // Telegram: a downward drag dismisses the viewer (the card leaves in the
    // swipe direction), an upward swipe goes to the next author. Down never
    // jumps back to the previous author.
    if (dy > 0 && ay > ax && ay > DISMISS_MIN) {
      setDrag({ x: 0, y: dy });
      closeViewer();
      return;
    }
    setDrag({ x: 0, y: 0 });
    if (ay > SWIPE_MIN && ay > ax) {
      if (dy < 0) nextAuthor();
      return;
    }
    if (ax > SWIPE_MIN && ax > ay) {
      if (dx < 0) next();
      else prev();
    }
  };

  /**
   * A completed swipe must not also fire the tap-zone click underneath the
   * finger (that would advance the story right after the gesture).
   */
  const swallowClickAfterSwipe = (e: React.MouseEvent) => {
    if (!swiped.current) return;
    swiped.current = false;
    e.stopPropagation();
    e.preventDefault();
  };

  if (!author || !story || storyIdx === null) return null;

  const values = author.stories.map((s, i) => {
    if (i < storyIdx) return 1;
    if (i === storyIdx) return Math.max(0, Math.min(1, elapsed / duration));
    return 0;
  });

  const isVideo = story.media.kind === 'video';

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] bg-black/85 backdrop-blur-md flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={author.name}
      onClick={closeViewer}
      onClickCapture={swallowClickAfterSwipe}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      onPointerDown={beginHold}
      onPointerUp={endHold}
      onPointerCancel={endHold}
      onPointerLeave={endHold}
    >
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform:
            drag.x || drag.y
              ? `translate(${drag.x * DRAG_FOLLOW_X}px, ${Math.max(0, drag.y) * DRAG_FOLLOW_Y}px) scale(${Math.max(0.88, 1 - Math.max(0, drag.y) / 1600)})`
              : undefined,
          opacity: drag.y > 0 ? Math.max(0.45, 1 - drag.y / 600) : undefined,
          transition: dragging ? 'none' : 'transform 160ms ease-out, opacity 160ms ease-out',
        }}
        className="relative w-full h-full sm:w-[min(92vw,520px)] sm:h-[min(92vh,960px)] sm:aspect-[9/16] sm:rounded-xl overflow-hidden bg-black select-none"
      >
        {/* media */}
        {story.media.kind === 'video' ? (
          <video
            src={story.media.src}
            poster={story.media.poster}
            autoPlay
            playsInline
            muted={muted}
            controls={false}
            className="w-full h-full object-cover"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget.duration;
              if (Number.isFinite(v)) durations.current[story.id] = v * 1000;
            }}
          />
        ) : (
          <img src={story.media.src} alt={story.caption ?? ''} className="w-full h-full object-cover" draggable={false} />
        )}

        {story.caption && (
          <p className="absolute bottom-16 inset-x-0 px-4 text-white text-base leading-snug [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">
            {story.caption}
          </p>
        )}

        {/* tap zones (between header and footer) */}
        <button type="button" aria-label={t('story.previous')} onClick={prev} className="absolute left-0 top-[18%] bottom-[22%] w-1/3 z-10 cursor-pointer" />
        <button type="button" aria-label={t('story.next')} onClick={next} className="absolute right-0 top-[18%] bottom-[22%] w-2/3 z-10 cursor-pointer" />

        <div className="absolute top-0 inset-x-0 px-2 pt-2 z-20">
          <StoryProgressBar values={values} />
        </div>

        <div className="absolute top-0 inset-x-0 z-20">
          <StoryHeader
            author={author}
            dateLabel={formatRelativeTime(story.createdAt, t)}
            paused={paused}
            muted={muted}
            isVideo={isVideo}
            onPause={pause}
            onResume={resume}
            onToggleMute={toggleMute}
            onClose={closeViewer}
          />
        </div>

        <div className="absolute bottom-0 inset-x-0 z-20">
          <StoryFooter
            viewsCount={story.viewsCount}
            likesCount={story.likesCount}
            likedByMe={story.likedByMe}
            onToggleLike={() => toggleLike(story.id)}
          />
        </div>
      </div>
    </div>
  );
}
