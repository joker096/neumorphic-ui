import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoDelete } from './useUndoDelete';

describe('useUndoDelete', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with undo not visible', () => {
    const { result } = renderHook(() => useUndoDelete());
    expect(result.current.undo.visible).toBe(false);
    expect(result.current.undo.message).toBe('');
  });

  it('shows undo with message and onUndo callback', () => {
    const onUndo = vi.fn();
    const { result } = renderHook(() => useUndoDelete());

    act(() => {
      result.current.showUndo('Message deleted', onUndo);
    });

    expect(result.current.undo.visible).toBe(true);
    expect(result.current.undo.message).toBe('Message deleted');
    expect(result.current.undo.onUndo).toBe(onUndo);
  });

  it('hides undo after timeout', () => {
    const onUndo = vi.fn();
    const { result } = renderHook(() => useUndoDelete());

    act(() => {
      result.current.showUndo('Message deleted', onUndo);
    });

    expect(result.current.undo.visible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.undo.visible).toBe(false);
  });

  it('calls onUndo when handleUndo is called', () => {
    const onUndo = vi.fn();
    const { result } = renderHook(() => useUndoDelete());

    act(() => {
      result.current.showUndo('Message deleted', onUndo);
    });

    act(() => {
      result.current.handleUndo();
    });

    expect(onUndo).toHaveBeenCalledOnce();
    expect(result.current.undo.visible).toBe(false);
  });

  it('dismisses undo without calling onUndo', () => {
    const onUndo = vi.fn();
    const { result } = renderHook(() => useUndoDelete());

    act(() => {
      result.current.showUndo('Message deleted', onUndo);
    });

    act(() => {
      result.current.dismiss();
    });

    expect(onUndo).not.toHaveBeenCalled();
    expect(result.current.undo.visible).toBe(false);
  });

  it('clears previous timeout when showUndo is called again', () => {
    const onUndo1 = vi.fn();
    const onUndo2 = vi.fn();
    const { result } = renderHook(() => useUndoDelete());

    act(() => {
      result.current.showUndo('First message', onUndo1);
    });

    act(() => {
      result.current.showUndo('Second message', onUndo2);
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.undo.visible).toBe(false);
    expect(result.current.undo.message).toBe('Second message');
  });
});