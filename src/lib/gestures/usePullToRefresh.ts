import { useCallback, useRef, useState } from 'react';

export interface UsePullToRefreshOptions {
  onRefresh?: () => Promise<void> | void;
  threshold?: number;
  friction?: number;
}

export function usePullToRefresh(
  options: UsePullToRefreshOptions = {},
  isEnabled = true
) {
  const {
    onRefresh,
    threshold = 120,
    friction = 0.08,
  } = options;

  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const scrollStartRef = useRef(0);
  const isPullingRef = useRef(false);

  const pullProgress = useRef(0);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isEnabled) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-skip-pull]')) return;

    const container = target.closest('[data-pull-refresh]');
    if (!container) return;

    const scrollEl = container;
    if ((scrollEl as HTMLElement).scrollTop !== 0) return;

    isPullingRef.current = true;
    startYRef.current = e.clientY;
    scrollStartRef.current = (scrollEl as HTMLElement).scrollTop;
    setPulling(true);
  }, [isEnabled]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPullingRef.current) return;
    const dy = e.clientY - startYRef.current;
    if (dy > 0) {
      pullProgress.current = Math.min(dy * friction, threshold);
      if (pullProgress.current > threshold * 0.3) {
        setPulling(true);
      }
    }
  }, [threshold, friction]);

  const handlePointerUp = useCallback(() => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullProgress.current >= threshold && onRefresh) {
      setRefreshing(true);
      const promise = Promise.resolve(onRefresh?.());
      promise.then(() => {
        setRefreshing(false);
        setPulling(false);
        pullProgress.current = 0;
      }).catch(() => {
        setRefreshing(false);
        setPulling(false);
        pullProgress.current = 0;
      });
    } else {
      setPulling(false);
      pullProgress.current = 0;
    }
  }, [threshold, onRefresh]);

  return {
    refreshContainer: {
      'data-pull-refresh': '',
      onTouchStart: handlePointerDown,
      onTouchMove: handlePointerMove,
      onTouchEnd: handlePointerUp,
    },
    refreshIndicator: {
      style: {
        transform: `translateY(${pullProgress.current}px)`,
      },
    },
    isPulling: pulling || refreshing,
    progress: pullProgress.current,
  };
}
