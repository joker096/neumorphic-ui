import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwipeBack } from './useSwipeBack';

describe('useSwipeBack', () => {
  it('reports right swipe over threshold and velocity', () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipeBack(onSwipe));
    act(() => result.current.onDragStart());
    act(() =>
      result.current.onDragEnd(undefined, {
        offset: { x: 200, y: 0 },
        velocity: { x: 0.6, y: 0 },
      }),
    );
    expect(onSwipe).toHaveBeenCalledWith('right');
  });

  it('reports left swipe over threshold', () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipeBack(onSwipe));
    act(() => result.current.onDragStart());
    act(() =>
      result.current.onDragEnd(undefined, {
        offset: { x: -200, y: 0 },
        velocity: { x: -0.6, y: 0 },
      }),
    );
    expect(onSwipe).toHaveBeenCalledWith('left');
  });

  it('ignores drag below threshold', () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipeBack(onSwipe));
    act(() => result.current.onDragStart());
    act(() =>
      result.current.onDragEnd(undefined, {
        offset: { x: 30, y: 0 },
        velocity: { x: 0.6, y: 0 },
      }),
    );
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('ignores stale drag end without a start', () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipeBack(onSwipe));
    act(() =>
      result.current.onDragEnd(undefined, {
        offset: { x: 300, y: 0 },
        velocity: { x: 0.9, y: 0 },
      }),
    );
    expect(onSwipe).not.toHaveBeenCalled();
  });
});
