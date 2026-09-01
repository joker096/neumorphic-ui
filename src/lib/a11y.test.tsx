import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook, act, fireEvent } from '@testing-library/react';
import { useRef } from 'react';
import { announce, useFocusTrap, useReducedMotion } from './a11y';

function stubMatchMedia(matches: boolean) {
  const listeners: ((e: MediaQueryListEvent) => void)[] = [];
  const mql = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => listeners.push(cb)),
    removeEventListener: vi.fn(),
  };
  window.matchMedia = vi.fn(() => mql as any);
  return { mql, emit: (v: boolean) => listeners.forEach((cb) => cb({ matches: v } as any)) };
}

describe('announce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.getElementById('sr-region')?.remove();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates an sr-region with aria-live and sets text after delay', () => {
    announce('hello world');
    const region = document.getElementById('sr-region');
    expect(region).not.toBeNull();
    expect(region!.getAttribute('aria-live')).toBe('polite');
    expect(region!.getAttribute('role')).toBe('status');
    expect(region!.textContent).toBe('');
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(region!.textContent).toBe('hello world');
  });

  it('reuses existing sr-region', () => {
    const pre = document.createElement('div');
    pre.id = 'sr-region';
    document.body.appendChild(pre);
    announce('warning', 'assertive');
    expect(document.querySelectorAll('#sr-region').length).toBe(1);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(pre.textContent).toBe('warning');
  });
});

describe('useFocusTrap', () => {
  it('focuses first focusable and traps Tab cycling', () => {
    function Trap() {
      const ref = useRef<HTMLDivElement>(null);
      useFocusTrap(ref, true);
      return (
        <div ref={ref}>
          <button>A</button>
          <button>B</button>
        </div>
      );
    }
    render(<Trap />);
    expect(document.activeElement?.textContent).toBe('A');
    // Shift+Tab from first wraps to last
    fireEvent.keyDown(document.activeElement!, { key: 'Tab', shiftKey: true });
    expect(document.activeElement?.textContent).toBe('B');
    // Tab from last wraps to first
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    expect(document.activeElement?.textContent).toBe('A');
  });

  it('does not trap when inactive', () => {
    function Trap() {
      const ref = useRef<HTMLDivElement>(null);
      useFocusTrap(ref, false);
      return (
        <div ref={ref}>
          <button>A</button>
          <button>B</button>
        </div>
      );
    }
    render(<Trap />);
    expect(document.activeElement?.textContent).not.toBe('A');
  });
});

describe('useReducedMotion', () => {
  it('starts true and reflects media query change', () => {
    const { mql, emit } = stubMatchMedia(true);
    const { result, unmount } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
    expect(mql.addEventListener).toHaveBeenCalled();
    act(() => emit(false));
    expect(result.current).toBe(false);
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalled();
  });
});
