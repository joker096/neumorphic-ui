import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value when key does not exist', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('returns stored value when key exists', () => {
    localStorage.setItem('test-key', '"stored-value"');
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('stored-value');
  });

  it('returns parsed object value', () => {
    localStorage.setItem('test-key', JSON.stringify({ foo: 'bar' }));
    const { result } = renderHook(() => useLocalStorage('test-key', { foo: 'baz' }));
    expect(result.current[0]).toEqual({ foo: 'bar' });
  });

  it('sets value and persists to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(localStorage.getItem('test-key')).toBe('"new-value"');
  });

  it('sets object value and persists to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', { count: 0 }));

    act(() => {
      result.current[1]({ count: 5 });
    });

    expect(result.current[0]).toEqual({ count: 5 });
    expect(localStorage.getItem('test-key')).toBe('{"count":5}');
  });

  it('returns raw string when JSON parse fails', () => {
    localStorage.setItem('test-key', 'invalid-json');
    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
    expect(result.current[0]).toBe('invalid-json');
  });

  it('handles localStorage exception on get', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage error');
    });
    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
    getItemSpy.mockRestore();
  });

  it('handles localStorage exception on set', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage error');
    });
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(setItemSpy).toHaveBeenCalled();
    setItemSpy.mockRestore();
  });
});