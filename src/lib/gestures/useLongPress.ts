import { useRef, useCallback } from 'react';

interface LongPressConfig {
  duration?: number;
  onLongPress: (e: { clientX: number; clientY: number }) => void;
  onClick?: () => void;
}

export function useLongPress({ duration = 500, onLongPress, onClick }: LongPressConfig) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isLongPressRef = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isLongPressRef.current = false;
    posRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress({ clientX: posRef.current.x, clientY: posRef.current.y });
    }, duration);
  }, [duration, onLongPress]);

  const onPointerUp = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isLongPressRef.current) onClick?.();
    timerRef.current = null;
  }, [onClick]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - posRef.current.x);
    const dy = Math.abs(e.clientY - posRef.current.y);
    if (dx > 10 || dy > 10) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { onPointerDown, onPointerUp, onPointerMove };
}
