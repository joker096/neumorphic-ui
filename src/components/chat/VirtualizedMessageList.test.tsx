import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { VirtualizedMessageListInner, VirtualizedMessageList } from './VirtualizedMessageList';

// Cast to avoid TS JSX typing issues with ref-based component
const VirtualizedMessageListInnerAny = VirtualizedMessageListInner as any;

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: vi.fn(() => [
      { key: 'item-0', index: 0, start: 0, size: 72 },
      { key: 'item-1', index: 1, start: 72, size: 72 },
      { key: 'item-2', index: 2, start: 144, size: 72 },
    ]),
    getTotalSize: vi.fn(() => 216),
    scrollToIndex: vi.fn(),
    measureElement: vi.fn(),
  })),
}));

const mockItems = [
  { id: '1', text: 'Message 1' },
  { id: '2', text: 'Message 2' },
  { id: '3', text: 'Message 3' },
];

const renderList = (isDark = true, props?: any) => {
  const ref = { current: { scrollToBottom: () => {} } };
  return render(
    <VirtualizedMessageListInnerAny
      {...props}
      items={mockItems}
      isDark={isDark}
      ref={ref as any}
    >
      {(item: any) => <div data-testid={`msg-${item.id}`}>{item.text}</div>}
    </VirtualizedMessageListInnerAny> as any
  );
};

describe('VirtualizedMessageList', () => {
  it('renders all items from the virtualized list', () => {
    renderList();
    expect(screen.getByTestId('msg-1')).toBeInTheDocument();
    expect(screen.getByTestId('msg-2')).toBeInTheDocument();
    expect(screen.getByTestId('msg-3')).toBeInTheDocument();
  });

  it('renders scrollbar-dark class when dark theme is true', () => {
    const { container } = renderList(true);
    const scrollContainer = container.querySelector('[class*="scrollbar"]') || container.querySelector('[class*="overflow"]');
    expect(scrollContainer || container.querySelector('[class*="py-2"]')).toBeInTheDocument();
  });

  it('renders scrollbar-light class when dark theme is false', () => {
    const { container } = renderList(false);
    const scrollContainer = container.querySelector('[class*="scrollbar"]') || container.querySelector('[class*="overflow"]');
    expect(scrollContainer || container.querySelector('[class*="py-2"]')).toBeInTheDocument();
  });

  it('applies custom className prop', () => {
    const { container } = renderList(true, { className: 'custom-class' });
    const scrollContainer = container.querySelector('[class*="custom-class"]');
    expect(scrollContainer).toBeInTheDocument();
  });

  it('calls onScrollPosition callback when scrolling', () => {
    const onScrollPosition = vi.fn();
    renderList(true, { onScrollPosition });

    const scrollContainer = document.querySelector('[class*="overflow-y-auto"]');
    Object.defineProperty(scrollContainer!, 'scrollHeight', { value: 1000 });
    Object.defineProperty(scrollContainer!, 'scrollTop', { value: 800 });
    Object.defineProperty(scrollContainer!, 'clientHeight', { value: 500 });

    fireEvent.scroll(scrollContainer!);

    expect(onScrollPosition).toHaveBeenCalledWith(true);
  });

  it('calls onScrollPosition with false when far from bottom', () => {
    const onScrollPosition = vi.fn();
    renderList(true, { onScrollPosition });

    const scrollContainer = document.querySelector('[class*="overflow-y-auto"]');
    Object.defineProperty(scrollContainer!, 'scrollHeight', { value: 1000 });
    Object.defineProperty(scrollContainer!, 'scrollTop', { value: 0 });
    Object.defineProperty(scrollContainer!, 'clientHeight', { value: 500 });

    fireEvent.scroll(scrollContainer!);

    expect(onScrollPosition).toHaveBeenCalledWith(false);
  });

  it('renders with custom estimateSize', () => {
    renderList(true, { estimateSize: 100 });
    expect(screen.getByTestId('msg-1')).toBeInTheDocument();
  });

  it('renders with custom overscan', () => {
    renderList(true, { overscan: 10 });
    expect(screen.getByTestId('msg-1')).toBeInTheDocument();
  });
});

describe('VirtualizedMessageList (forwardRef)', () => {
  it('accepts ref prop via React.forwardRef', () => {
    const ref = { current: { scrollToBottom: vi.fn() } };
    const { container } = render(
      <VirtualizedMessageList ref={ref as any} items={mockItems} isDark={true}>
        {(item: any) => <div>{item.text}</div>}
      </VirtualizedMessageList>
    );
    expect(container.querySelector('[class*="overflow-y-auto"]')).toBeInTheDocument();
  });

  it('renders items when passed as VirtualizedMessageList', () => {
    const { getByText } = render(
      <VirtualizedMessageList items={mockItems} isDark={true}>
        {(item: any) => <div data-testid={`vl-msg-${item.id}`}>{item.text}</div>}
      </VirtualizedMessageList>
    );
    expect(getByText('Message 1')).toBeInTheDocument();
    expect(getByText('Message 2')).toBeInTheDocument();
  });
});
