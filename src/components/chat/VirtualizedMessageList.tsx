import { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedMessageListProps<T> {
  items: T[];
  estimateSize?: number;
  overscan?: number;
  className?: string;
  isDark: boolean;
  children: (item: T, index: number) => React.ReactNode;
}

export function VirtualizedMessageList<T>({
  items,
  estimateSize = 72,
  overscan = 5,
  className = '',
  isDark,
  children,
}: VirtualizedMessageListProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const measureElement = useCallback((el: HTMLElement | null) => {
    if (el) {
      virtualizer.measureElement(el);
    }
  }, [virtualizer]);

  return (
    <div
      ref={scrollRef}
      className={`flex-1 overflow-y-auto overflow-x-hidden relative z-0 ${isDark ? "scrollbar-dark" : "scrollbar-light"} ${className}`}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            ref={measureElement}
            data-index={virtualItem.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {children(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
