import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockErrorLog: any[] = [];
const mockErrorStats = { critical: 0, major: 0, minor: 0, total: 0 };
let subscribeCb: (() => void) | null = null;

vi.mock('../lib/errorHandling', () => ({
  getErrorLog: vi.fn(() => mockErrorLog),
  getErrorStats: vi.fn(() => mockErrorStats),
  subscribeToErrors: vi.fn((cb: () => void) => {
    subscribeCb = cb;
    return vi.fn();
  }),
}));

describe('useGlobalErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscribeCb = null;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with empty errors', async () => {
    const { useGlobalErrorHandler } = await import('./useGlobalErrorHandler');
    const { result } = renderHook(() => useGlobalErrorHandler());
    expect(result.current.errors).toEqual([]);
  });

  it('should handle errors and log to console', async () => {
    const { useGlobalErrorHandler } = await import('./useGlobalErrorHandler');
    const { result } = renderHook(() => useGlobalErrorHandler());

    act(() => {
      result.current.handleError(new Error('test error'), 'TestContext');
    });

    expect(console.error).toHaveBeenCalledWith(
      '[GlobalErrorHandler] TestContext:',
      expect.any(Error)
    );
  });

  it('should handle storage errors with degradation', async () => {
    const { useGlobalErrorHandler } = await import('./useGlobalErrorHandler');
    const { result } = renderHook(() => useGlobalErrorHandler());

    act(() => {
      result.current.handleError(new Error('indexeddb storage error'));
    });

    expect(console.warn).toHaveBeenCalledWith(
      '[GlobalErrorHandler] Storage error detected. Attempting graceful degradation.'
    );
  });

  it('should handle crypto errors with degradation', async () => {
    const { useGlobalErrorHandler } = await import('./useGlobalErrorHandler');
    const { result } = renderHook(() => useGlobalErrorHandler());

    act(() => {
      result.current.handleError(new Error('crypto encrypt failed'));
    });

    expect(console.warn).toHaveBeenCalledWith(
      '[GlobalErrorHandler] Crypto error detected. Operating in degraded mode.'
    );
  });

  it('should handle network errors with degradation', async () => {
    const { useGlobalErrorHandler } = await import('./useGlobalErrorHandler');
    const { result } = renderHook(() => useGlobalErrorHandler());

    act(() => {
      result.current.handleError(new Error('network connection lost'));
    });

    expect(console.warn).toHaveBeenCalledWith(
      '[GlobalErrorHandler] Network error detected. Reconnection attempted.'
    );
  });

  it('should subscribe to errors on mount', async () => {
    const { subscribeToErrors } = await import('../lib/errorHandling');
    const { useGlobalErrorHandler } = await import('./useGlobalErrorHandler');
    renderHook(() => useGlobalErrorHandler());
    expect(subscribeToErrors).toHaveBeenCalled();
  });
});

describe('useErrorStats', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return error stats and poll for updates', async () => {
    const { getErrorStats } = await import('../lib/errorHandling');
    const initialCalls = vi.mocked(getErrorStats).mock.calls.length;

    const { useErrorStats } = await import('./useGlobalErrorHandler');
    const { result } = renderHook(() => useErrorStats());

    expect(result.current).toEqual(mockErrorStats);

    act(() => { vi.advanceTimersByTime(5000); });
    expect(vi.mocked(getErrorStats).mock.calls.length).toBeGreaterThan(initialCalls + 1);
  });
});
