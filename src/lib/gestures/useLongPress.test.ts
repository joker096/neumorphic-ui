import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLongPress } from './useLongPress';

const stop = vi.fn();
const down = (x: number, y: number) => ({ clientX: x, clientY: y, stopPropagation: stop }) as any;
const up = (x: number, y: number) => ({ clientX: x, clientY: y, stopPropagation: stop }) as any;
const move = (x: number, y: number) => ({ clientX: x, clientY: y }) as any;

describe('useLongPress', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('fires onLongPress after delay', () => {
    const onLongPress = vi.fn();
    const onShortPress = vi.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, onShortPress, delay: 500 }));
    act(() => result.current.pointerProps.onPointerDown(down(0, 0)));
    act(() => vi.advanceTimersByTime(500));
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onShortPress).not.toHaveBeenCalled();
    act(() => result.current.pointerProps.onPointerUp(up(0, 0)));
    expect(onShortPress).not.toHaveBeenCalled();
  });

  it('fires onShortPress on quick release', () => {
    const onLongPress = vi.fn();
    const onShortPress = vi.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, onShortPress, delay: 500 }));
    act(() => result.current.pointerProps.onPointerDown(down(0, 0)));
    act(() => result.current.pointerProps.onPointerUp(up(0, 0)));
    expect(onShortPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('cancels long press when pointer moves beyond trigger distance', () => {
    const onLongPress = vi.fn();
    const onShortPress = vi.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, onShortPress, triggerDistance: 10, delay: 500 }));
    act(() => result.current.pointerProps.onPointerDown(down(0, 0)));
    act(() => result.current.pointerProps.onPointerMove(move(30, 0)));
    act(() => vi.advanceTimersByTime(500));
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('does nothing when disabled', () => {
    const onLongPress = vi.fn();
    const onShortPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, onShortPress, delay: 500 }, true),
    );
    act(() => result.current.pointerProps.onPointerDown(down(0, 0)));
    act(() => vi.advanceTimersByTime(500));
    act(() => result.current.pointerProps.onPointerUp(up(0, 0)));
    expect(onLongPress).not.toHaveBeenCalled();
    expect(onShortPress).not.toHaveBeenCalled();
  });
});
