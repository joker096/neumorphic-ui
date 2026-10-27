import { useRef, useState } from 'react';

/** Minimum travel (px) for a swipe to count as navigation. */
export const SWIPE_MIN = 70;
/** Downward travel (px) that dismisses the viewer — Telegram drag-to-close. */
export const DISMISS_MIN = 90;
/** Travel (px) after which a gesture stops counting as a tap. */
export const TAP_SLOP = 10;
/** The card follows the finger at a fraction of the travel. */
export const DRAG_FOLLOW_Y = 0.45;
export const DRAG_FOLLOW_X = 0.25;

interface StoryGestureActions {
  pause: () => void;
  resume: () => void;
  closeViewer: () => void;
  next: () => void;
  prev: () => void;
  nextAuthor: () => void;
}

export interface StoryGestures {
  /** Current finger travel, used to translate/fade the card. */
  drag: { x: number; y: number };
  dragging: boolean;
  /** True while a press-and-hold keeps the story paused. */
  holding: boolean;
  /** Handlers to spread on the viewer root. */
  rootHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchCancel: (e: React.TouchEvent) => void;
    onPointerDown: () => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
    onPointerLeave: () => void;
    onClickCapture: (e: React.MouseEvent) => void;
  };
}

export function useStoryGestures(actions: StoryGestureActions): StoryGestures {
  const { pause, resume, closeViewer, next, prev, nextAuthor } = actions;
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const endHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (holding) {
      setHolding(false);
      resume();
    }
  };

  const beginHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      pause();
      setHolding(true);
    }, 200);
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
      endHold();
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

  const onClickCapture = (e: React.MouseEvent) => {
    if (!swiped.current) return;
    swiped.current = false;
    e.stopPropagation();
    e.preventDefault();
  };

  return {
    drag,
    dragging,
    holding,
    rootHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: onTouchEnd,
      onPointerDown: beginHold,
      onPointerUp: endHold,
      onPointerCancel: endHold,
      onPointerLeave: endHold,
      onClickCapture,
    },
  };
}
