import { useState, useRef, useCallback, type TouchEvent } from 'react';

interface PullToRefreshConfig {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export function usePullToRefresh({ onRefresh, threshold = 60 }: PullToRefreshConfig) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (e.currentTarget.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!pullingRef.current || isRefreshing) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) {
      const resisted = delta * 0.4;
      setPullDistance(Math.min(resisted, 120));
    }
  }, [isRefreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, threshold, onRefresh]);

  return {
    pullDistance,
    isRefreshing,
    pullToRefreshHandlers: { onTouchStart, onTouchMove, onTouchEnd },
    refreshStyle: {
      transform: `translateY(${pullDistance}px)`,
      transition: pullDistance === 0 ? 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
    },
  };
}
