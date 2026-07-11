import { useCallback, useRef, useState } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

export interface SwipeResult {
  direction: SwipeDirection;
  velocity: number;
  offset: { x: number; y: number };
}

export function useSwipeBack(onSwipe: (direction: SwipeDirection) => void, options?: {
  threshold?: number;
  velocity?: number;
  axis?: 'x' | 'y';
  drag?: boolean;
}) {
  const threshold = useRef(options?.threshold || 80);
  const velocity = useRef(options?.velocity || 0.3);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(false);

  const handleDragEnd = useCallback(
    (_: any, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) => {
      if (!dragRef.current) return;
      dragRef.current = false;
      const { offset, velocity: vel } = info;
      let direction: SwipeDirection = null;

      if (options?.axis === 'y' || (!options?.axis && Math.abs(offset.y) > Math.abs(offset.x))) {
        if (offset.y < -threshold.current && vel.y < -velocity.current) {
          direction = 'down';
        } else if (offset.y > threshold.current && vel.y > velocity.current) {
          direction = 'up';
        }
      } else {
        if (offset.x < -threshold.current && vel.x < -velocity.current) {
          direction = 'left';
        } else if (offset.x > threshold.current && vel.x > velocity.current) {
          direction = 'right';
        }
      }

      if (direction) onSwipe(direction);
    },
    [onSwipe, options?.axis],
  );

  const handleDragStart = useCallback(() => {
    dragRef.current = true;
    setIsDragging(true);
  }, []);

  const handleDragEndCleanup = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    drag: options?.drag !== false,
    dragConstraints: options?.axis === 'y' 
      ? [undefined, undefined, { y: -300 }] 
      : [{ x: -300 }, undefined, undefined, undefined],
    dragElastic: 0.2,
    onDragEnd: handleDragEnd,
    onDragStart: handleDragStart,
    onDragEndCleanup: handleDragEndCleanup,
    isDragging,
  };
}
