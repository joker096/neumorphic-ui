import { useState, useRef, useCallback, useMemo, type UIEvent } from 'react';

interface UseVirtualListOptions<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  containerHeight: number;
}

interface VirtualItem<T> {
  item: T;
  index: number;
  offsetY: number;
}

export function useVirtualList<T>({ items, itemHeight, overscan = 5, containerHeight }: UseVirtualListOptions<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const visibleStart = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleEnd = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);

  const virtualItems: VirtualItem<T>[] = useMemo(() => {
    const result: VirtualItem<T>[] = [];
    for (let i = visibleStart; i < visibleEnd; i++) {
      result.push({
        item: items[i],
        index: i,
        offsetY: i * itemHeight,
      });
    }
    return result;
  }, [items, visibleStart, visibleEnd, itemHeight]);

  const onScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = index * itemHeight;
    }
  }, [itemHeight]);

  return {
    containerRef,
    virtualItems,
    totalHeight,
    onScroll,
    scrollToIndex,
    scrollTop,
  };
}
