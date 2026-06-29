import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useUndoDelete } from './useUndoDelete';

describe('useUndoDelete', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should have initial state with visible false', () => {
    const { result } = renderHook(() => useUndoDelete());
    expect(result.current.undo.visible).toBe(false);
    expect(result.current.undo.message).toBe('');
  });

  it('should show undo with message and callback', () => {
    const onUndoMock = vi.fn();
    const { result } = renderHook(() => useUndoDelete());

    act(() => {
      result.current.showUndo('Item deleted', onUndoMock);
    });

    expect(result.current.undo.visible).toBe(true);
    expect(result.current.undo.message).toBe('Item deleted');
  });

  it('should auto-hide undo after 5 seconds', () => {
    const onUndoMock = vi.fn();
    const { result } = renderHook(() => useUndoDelete());

    act(() => {
      result.current.showUndo('Item deleted', onUndoMock);
    });

    expect(result.current.undo.visible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.undo.visible).toBe(false);
  });

  it('should call onUndo when handleUndo is triggered', () => {
    const onUndoMock = vi.fn();
    const { result } = renderHook(() => useUndoDelete());

    act(() => {
      result.current.showUndo('Delete item', onUndoMock);
    });

    act(() => {
      result.current.handleUndo();
    });

    expect(onUndoMock).toHaveBeenCalled();
    expect(result.current.undo.visible).toBe(false);
  });

  it('should reset timer when showUndo is called again', () => {
    const onUndoMock = vi.fn();
    const { result } = renderHook(() => useUndoDelete());

    act(() => {
      result.current.showUndo('First message', onUndoMock);
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    act(() => {
      result.current.showUndo('Second message', vi.fn());
    });

    expect(result.current.undo.message).toBe('Second message');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.undo.visible).toBe(false);
  });

  it('should dismiss undo without calling onUndo', () => {
    const onUndoMock = vi.fn();
    const { result } = renderHook(() => useUndoDelete());

    act(() => {
      result.current.showUndo('Warning', onUndoMock);
    });

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.undo.visible).toBe(false);
    expect(onUndoMock).not.toHaveBeenCalled();
  });
});