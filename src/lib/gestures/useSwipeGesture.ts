import { useRef, useCallback, type TouchEvent } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeConfig {
  threshold?: number;
  edgeOnly?: boolean;
  edgeWidth?: number;
}

export function useSwipeGesture(
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) {
  const { threshold = 80, edgeOnly = false, edgeWidth = 30 } = config;
  const startRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (edgeOnly && touch.clientX > edgeWidth) return;
    startRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, [edgeOnly, edgeWidth]);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    if (!startRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startRef.current.x;
    const dy = touch.clientY - startRef.current.y;
    const elapsed = Date.now() - startRef.current.time;
    startRef.current = null;

    if (elapsed > 300) return;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy && absDx > threshold) {
      if (dx > 0) handlers.onSwipeRight?.();
      else handlers.onSwipeLeft?.();
    } else if (absDy > absDx && absDy > threshold) {
      if (dy > 0) handlers.onSwipeDown?.();
      else handlers.onSwipeUp?.();
    }
  }, [threshold, handlers]);

  return { onTouchStart, onTouchEnd };
}
