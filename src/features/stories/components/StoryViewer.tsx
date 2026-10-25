import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useStoriesStore } from '../storiesStore';
import { STORY_PHOTO_DEFAULT_MS, STORY_VIDEO_FALLBACK_MS } from '../types';
import { StoryProgressBar } from './StoryProgressBar';
import { StoryHeader } from './StoryHeader';
import { StoryFooter } from './StoryFooter';

const TICK = 80;

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()} в ${hh}:${mi}`;
}

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

  const [elapsed, setElapsed] = useState(0);
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchY = useRef<number | null>(null);
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
  }, [story?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    };
    window.addEventListener('keydown', onKey);
    const prevFocus = document.activeElement as HTMLElement | null;
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      prevFocus?.focus?.();
    };
  }, [author, paused, next, prev, resume, pause, closeViewer]);

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
      onTouchStart={(e) => { touchY.current = e.touches[0].clientY; }}
      onTouchMove={(e) => {
        if (touchY.current !== null && e.touches[0].clientY - touchY.current > 80) {
          closeViewer();
        }
      }}
      onTouchEnd={() => { touchY.current = null; }}
      onPointerDown={beginHold}
      onPointerUp={endHold}
      onPointerCancel={endHold}
      onPointerLeave={endHold}
    >
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
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
        <button type="button" aria-label="Previous story" onClick={prev} className="absolute left-0 top-[18%] bottom-[22%] w-1/3 z-10 cursor-pointer" />
        <button type="button" aria-label="Next story" onClick={next} className="absolute right-0 top-[18%] bottom-[22%] w-2/3 z-10 cursor-pointer" />

        <div className="absolute top-0 inset-x-0 px-2 pt-2 z-20">
          <StoryProgressBar values={values} />
        </div>

        <div className="absolute top-0 inset-x-0 z-20">
          <StoryHeader
            author={author}
            dateLabel={formatDateLabel(story.createdAt)}
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
