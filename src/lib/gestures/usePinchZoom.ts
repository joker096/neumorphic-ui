import { useCallback, useRef, useState } from 'react';

export interface UsePinchZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  onZoomChange?: (scale: number) => void;
}

export function usePinchZoom(
  options: UsePinchZoomOptions = {},
  isEnabled = true
) {
  const {
    minZoom = 0.5,
    maxZoom = 4,
    onZoomChange,
  } = options;

  const [scale, setScale] = useState(1);
  const startDistanceRef = useRef(0);
  const startScaleRef = useRef(1);
  const touchCountRef = useRef(0);

  const getDistance = useCallback((touches: {clientX: number; clientY: number}[]) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isEnabled || (e.target as HTMLElement).closest('[data-skip-pinch]')) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      touchCountRef.current = 2;
      startDistanceRef.current = getDistance([e.touches[0], e.touches[1]]);
      startScaleRef.current = scale;
    }
  }, [isEnabled, scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isEnabled || touchCountRef.current !== 2) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      const currentDistance = getDistance([e.touches[0], e.touches[1]]);
      const delta = currentDistance / startDistanceRef.current;
      const newScale = Math.min(maxZoom, Math.max(minZoom, startScaleRef.current * delta));
      setScale(newScale);
      onZoomChange?.(newScale);
    }
  }, [isEnabled, maxZoom, minZoom, onZoomChange]);

  const handleTouchEnd = useCallback(() => {
    touchCountRef.current = 0;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isEnabled) return;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(maxZoom, Math.max(minZoom, scale * delta));
    setScale(newScale);
    onZoomChange?.(newScale);
  }, [isEnabled, maxZoom, minZoom, scale, onZoomChange]);

  const reset = useCallback(() => {
    setScale(1);
    startScaleRef.current = 1;
    touchCountRef.current = 0;
  }, []);

  return {
    pinchProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onWheel: handleWheel,
    },
    scale,
    setScale,
    reset,
  };
}
