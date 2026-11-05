import React, { useRef, useCallback, useEffect, useImperativeHandle } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

/** Imperative surface of the message scroller, shared by every consumer. */
export interface MessageListHandle {
  scrollToBottom: () => void;
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
  /** Jump to the "unread" anchor index (no-op when the list has none). */
  scrollToUnread: () => void;
  /** Indexes currently painted, or null before the first layout pass. */
  getVisibleRange: () => { start: number; end: number } | null;
}

interface VirtualizedMessageListProps<T> {
  items: T[];
  estimateSize?: number;
  overscan?: number;
  className?: string;
  children: (item: T, index: number) => React.ReactNode;
  onScrollPosition?: (isNearBottom: boolean) => void;
  stickToBottom?: boolean;
  /** Index of the first unread row; negative or absent when nothing is unread. */
  unreadAnchorIndex?: number;
}

export function VirtualizedMessageListInner<T>(
  {
    items,
    estimateSize = 72,
    overscan = 5,
    className = '',
    children,
    onScrollPosition,
    stickToBottom = false,
    unreadAnchorIndex = -1,
  }: VirtualizedMessageListProps<T>,
  ref: React.Ref<MessageListHandle>
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
    scrollToUnread: () => {
      if (unreadAnchorIndex >= 0 && unreadAnchorIndex < items.length) {
        virtualizer.scrollToIndex(unreadAnchorIndex, { align: 'center' });
      }
    },
    getVisibleRange: () => {
      const visible = virtualizer.getVirtualItems();
      if (visible.length === 0) return null;
      // Items are ordered by index, but be explicit so an overscan shuffle can
      // never produce an inverted range.
      const first = visible[0].index;
      const last = visible[visible.length - 1].index;
      return { start: Math.min(first, last), end: Math.max(first, last) };
    },
  }), [virtualizer, items.length]);

  const measureElement = useCallback((el: HTMLElement | null) => {
    if (el) {
      virtualizer.measureElement(el);
    }
  }, [virtualizer]);

  // Throttle scroll → setState to a single rAF per frame so scrolling near the
  // bottom doesn't re-render the parent on every scroll event.
  const scrollRafRef = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || !onScrollPosition) return
    if (scrollRafRef.current !== null) return
    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      onScrollPosition(distanceFromBottom < 200)
    })
  }, [onScrollPosition])

  useEffect(() => {
    handleScroll();
  }, [handleScroll, items.length]);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current)
        scrollRafRef.current = null
      }
    };
  }, []);

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
  props: VirtualizedMessageListProps<T> & { ref?: React.Ref<MessageListHandle> }
) => React.ReactElement;
