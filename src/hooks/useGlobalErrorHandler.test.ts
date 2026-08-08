import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGlobalErrorHandler } from './useGlobalErrorHandler';

vi.mock('../lib/errorHandling', () => ({
  getErrorLog: vi.fn(() => []),
  getErrorStats: vi.fn(() => ({ critical: 0, major: 0, minor: 0, total: 0 })),
  subscribeToErrors: vi.fn((cb: any) => { setTimeout(cb, 0); return vi.fn(); }),
}));

describe('useGlobalErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty errors array initially', () => {
    const { result } = renderHook(() => useGlobalErrorHandler());
    expect(result.current.errors).toEqual([]);
  });

  it('handles generic error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useGlobalErrorHandler());

    act(() => {
      result.current.handleError(new Error('Test error'), 'test context');
    });

    expect(consoleSpy).toHaveBeenCalledWith('[GlobalErrorHandler] test context:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('handles string error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useGlobalErrorHandler());

    act(() => {
      result.current.handleError('string error', 'test context');
    });

    expect(consoleSpy).toHaveBeenCalledWith('[GlobalErrorHandler] test context:', 'string error');
    consoleSpy.mockRestore();
  });

  it('handles storage errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useGlobalErrorHandler());

    act(() => {
      result.current.handleError(new Error('storage quota exceeded'), 'storage error');
    });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Storage error'));
    consoleSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('handles crypto errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useGlobalErrorHandler());

    act(() => {
      result.current.handleError(new Error('crypto operation failed'), 'crypto error');
    });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Crypto error'));
    consoleSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('handles network errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useGlobalErrorHandler());

    act(() => {
      result.current.handleError(new Error('network timeout'), 'network error');
    });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Network error'));
    consoleSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('returns handleError function', () => {
    const { result } = renderHook(() => useGlobalErrorHandler());
    expect(typeof result.current.handleError).toBe('function');
  });
});