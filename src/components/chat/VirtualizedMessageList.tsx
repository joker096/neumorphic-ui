import React, { useRef, useCallback, useEffect, useImperativeHandle } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedMessageListProps<T> {
  items: T[];
  estimateSize?: number;
  overscan?: number;
  className?: string;
  isDark?: boolean;
  children: (item: T, index: number) => React.ReactNode;
  onScrollPosition?: (isNearBottom: boolean) => void;
  stickToBottom?: boolean;
}

export function VirtualizedMessageListInner<T>(
  {
    items,
    estimateSize = 72,
    overscan = 5,
    className = '',
    isDark = false,
    children,
    onScrollPosition,
    stickToBottom = false,
  }: VirtualizedMessageListProps<T>,
  ref: React.Ref<{ scrollToBottom: () => void; scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void }>
) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      if (items.length > 0) {
        virtualizer.scrollToIndex(items.length - 1, { align: 'end' });
      }
    },
    scrollToIndex: (index: number, align: 'start' | 'center' | 'end' = 'center') => {
      if (index >= 0 && index < items.length) {
        virtualizer.scrollToIndex(index, { align });
      }
    },
  }), [virtualizer, items.length]);

  const measureElement = useCallback((el: HTMLElement | null) => {
    if (el) {
      virtualizer.measureElement(el);
    }
  }, [virtualizer]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || !onScrollPosition) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    onScrollPosition(distanceFromBottom < 200)
  }, [onScrollPosition])

  useEffect(() => {
    handleScroll();
  }, [handleScroll, items.length]);

  useEffect(() => {
    if (!stickToBottom || items.length === 0) return;
    const frame = window.requestAnimationFrame(() => {
      virtualizer.scrollToIndex(items.length - 1, { align: 'end' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [items.length, stickToBottom, virtualizer]);

  return (
    <div
      ref={scrollRef}
      className={`flex-1 overflow-y-auto overflow-x-hidden relative z-0 ${className}`}
      onScroll={handleScroll}
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

export const VirtualizedMessageList = React.forwardRef(VirtualizedMessageListInner) as <T>(
  props: VirtualizedMessageListProps<T> & { ref?: React.Ref<{ scrollToBottom: () => void; scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void }> }
) => React.ReactElement;
