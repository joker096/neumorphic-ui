import { useCallback, useEffect, useRef } from "react";

const PRESS_DURATION = 500;

interface LongPressMenuOptions {
  /** Long press only arms when a menu consumer is actually present. */
  enabled: boolean;
  onLongPress: (anchorRect: DOMRect | null) => void;
}

/**
 * Long-press timer that opens the row context menu. Returns the pointer props
 * to spread onto the draggable row; the timer is always cleared on release,
 * pointer-leave and unmount so a stale press can never fire after the pointer
 * is gone.
 */
export function useLongPressMenu({ enabled, onLongPress }: LongPressMenuOptions) {
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPressTimer = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  const handlePointerDown = useCallback((e?: React.PointerEvent) => {
    if (!enabled) return;
    const rect = e?.currentTarget.getBoundingClientRect?.() ?? null;
    pressTimer.current = setTimeout(() => {
      onLongPress(rect);
      navigator.vibrate?.(50);
    }, PRESS_DURATION);
  }, [enabled, onLongPress]);

  const handlePointerUp = useCallback(() => {
    clearPressTimer();
  }, [clearPressTimer]);

  useEffect(() => {
    return () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
    };
  }, []);

  return { handlePointerDown, handlePointerUp };
}
