import { useCallback, useRef, useState } from 'react';

export interface UseLongPressOptions {
  onLongPress?: () => void;
  onShortPress?: () => void;
  triggerDistance?: number;
  delay?: number;
}

export function useLongPress(
  options: UseLongPressOptions = {},
  isDisabled = false
) {
  const {
    onLongPress,
    onShortPress,
    triggerDistance = 10,
    delay = 500,
  } = options;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressedRef = useRef(false);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const [isPressed, setIsPressed] = useState(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isDisabled) return;
    e.stopPropagation();
    pressedRef.current = true;
    isLongPressRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setIsPressed(true);

    timerRef.current = setTimeout(() => {
      if (pressedRef.current) {
        isLongPressRef.current = true;
        onLongPress?.();
      }
    }, delay);
  }, [isDisabled, delay, onLongPress]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDisabled) return;
    e.stopPropagation();
    pressedRef.current = false;
    setIsPressed(false);

    if (!isLongPressRef.current) {
      onShortPress?.();
    }
    clearTimer();
  }, [isDisabled, onShortPress, clearTimer]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!pressedRef.current) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > triggerDistance || dy > triggerDistance) {
      clearTimer();
      pressedRef.current = false;
      setIsPressed(false);
    }
  }, [triggerDistance, clearTimer]);

  const handlePointerLeave = useCallback(() => {
    clearTimer();
    pressedRef.current = false;
    setIsPressed(false);
  }, [clearTimer]);

  const handleCancel = useCallback(() => {
    clearTimer();
    pressedRef.current = false;
    setIsPressed(false);
  }, [clearTimer]);

  return {
    pointerProps: {
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerMove: handlePointerMove,
      onPointerLeave: handlePointerLeave,
      onPointerCancel: handleCancel,
      style: { touchAction: 'none' } as React.CSSProperties,
    },
    isPressed,
  };
}
