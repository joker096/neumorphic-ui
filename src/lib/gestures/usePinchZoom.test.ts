import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePinchZoom } from './usePinchZoom';

// two touches: first at x=0, second at x=distance
const twoTouches = (distance: number) =>
  ({
    touches: [
      { clientX: 0, clientY: 0 },
      { clientX: distance, clientY: 0 },
    ],
    target: { closest: () => null },
    preventDefault: vi.fn(),
  }) as any;

describe('usePinchZoom', () => {
  it('zooms in when fingers spread apart', () => {
    const onZoomChange = vi.fn();
    const { result } = renderHook(() => usePinchZoom({ onZoomChange, minZoom: 0.5, maxZoom: 4 }));
    act(() => result.current.pinchProps.onTouchStart(twoTouches(100)));
    act(() => result.current.pinchProps.onTouchMove(twoTouches(200)));
    expect(result.current.scale).toBe(2);
    expect(onZoomChange).toHaveBeenCalledWith(2);
  });

  it('clamps zoom to min/max', () => {
    const { result } = renderHook(() => usePinchZoom({ minZoom: 0.5, maxZoom: 4 }));
    act(() => result.current.pinchProps.onTouchStart(twoTouches(100)));
    act(() => result.current.pinchProps.onTouchMove(twoTouches(1000000)));
    expect(result.current.scale).toBe(4);
  });

  it('wheel zooms in and out', () => {
    const { result } = renderHook(() => usePinchZoom({}));
    act(() => result.current.pinchProps.onWheel({ deltaY: -1 } as any));
    expect(result.current.scale).toBe(1.1);
    act(() => result.current.pinchProps.onWheel({ deltaY: 1 } as any));
    expect(result.current.scale).toBeGreaterThan(0.9);
    expect(result.current.scale).toBeLessThan(1.1);
  });

  it('reset returns scale to 1', () => {
    const { result } = renderHook(() => usePinchZoom({}));
    act(() => result.current.pinchProps.onWheel({ deltaY: -1 } as any));
    act(() => result.current.reset());
    expect(result.current.scale).toBe(1);
  });
});
