import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePullToRefresh } from './usePullToRefresh';

function containerEl(scrollTop: number) {
  const el = document.createElement('div');
  el.setAttribute('data-pull-refresh', '');
  (el as any).scrollTop = scrollTop;
  return el;
}

function evt(el: HTMLElement, clientY: number) {
  return {
    clientY,
    target: {
      closest: (sel: string) => (sel === '[data-pull-refresh]' ? el : null),
    },
  } as any;
}

describe('usePullToRefresh', () => {
  it('fires onRefresh when pull exceeds threshold', async () => {
    const onRefresh = vi.fn(async () => {});
    const el = containerEl(0);
    const { result } = renderHook(() => usePullToRefresh({ onRefresh, threshold: 120, friction: 0.1 }));
    act(() => result.current.refreshContainer.onTouchStart(evt(el, 0)));
    act(() => result.current.refreshContainer.onTouchMove(evt(el, 2000))); // clamped to threshold
    act(() => result.current.refreshContainer.onTouchEnd());
    expect(onRefresh).toHaveBeenCalled();
    await act(async () => {});
  });

  it('does not refresh below threshold', async () => {
    const onRefresh = vi.fn(async () => {});
    const el = containerEl(0);
    const { result } = renderHook(() => usePullToRefresh({ onRefresh, threshold: 120, friction: 0.1 }));
    act(() => result.current.refreshContainer.onTouchStart(evt(el, 0)));
    act(() => result.current.refreshContainer.onTouchMove(evt(el, 50)));
    act(() => result.current.refreshContainer.onTouchEnd());
    expect(onRefresh).not.toHaveBeenCalled();
    await act(async () => {});
  });

  it('ignores pull when container not scrolled to top', () => {
    const onRefresh = vi.fn(async () => {});
    const el = containerEl(10);
    const { result } = renderHook(() => usePullToRefresh({ onRefresh, threshold: 120, friction: 0.1 }));
    act(() => result.current.refreshContainer.onTouchStart(evt(el, 0)));
    act(() => result.current.refreshContainer.onTouchMove(evt(el, 500)));
    act(() => result.current.refreshContainer.onTouchEnd());
    expect(onRefresh).not.toHaveBeenCalled();
  });
});
