import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 100));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 'initial' },
    });

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe('updated');
  });

  it('should reset timer on value change within delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'first' });
    act(() => {
      vi.advanceTimersByTime(50);
    });

    rerender({ value: 'second' });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe('second');
  });

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 0), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'immediate' });
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current).toBe('immediate');
  });

  it('should handle object values', () => {
    const obj = { foo: 'bar' };
    const { result } = renderHook(() => useDebounce(obj, 50));
    expect(result.current).toEqual(obj);
  });

  it('should handle array values', () => {
    const arr = [1, 2, 3];
    const { result } = renderHook(() => useDebounce(arr, 50));
    expect(result.current).toEqual(arr);
  });

  it('should handle null values', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 50), {
      initialProps: { value: null },
    });

    expect(result.current).toBe(null);

    rerender({ value: 'not-null' });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe('not-null');
  });

  it('should handle undefined values', () => {
    const { result } = renderHook(() => useDebounce(undefined, 50));
    expect(result.current).toBe(undefined);
  });

  it('should handle number values', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 50), {
      initialProps: { value: 1 },
    });

    rerender({ value: 42 });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe(42);
  });

  it('should clear timeout on unmount', () => {
    const { unmount } = renderHook(() => useDebounce('value', 100));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});