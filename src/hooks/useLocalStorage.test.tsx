import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should return parsed value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('should return raw string value when JSON parse fails', () => {
    localStorage.setItem('test-key', 'not-json');
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('not-json');
  });

  it('should return initial value when localStorage throws', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');

    getItemSpy.mockRestore();
  });

  it('should update state and localStorage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('updated');
  });

  it('should handle setValue with function updater', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 10));

    act(() => {
      result.current[1]((prev) => prev! + 5);
    });

    expect(result.current[0]).toBe(15);
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe(15);
  });

  it('should handle object values', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', { name: 'test' }));

    act(() => {
      result.current[1]({ name: 'updated' });
    });

    expect(result.current[0]).toEqual({ name: 'updated' });
    expect(JSON.parse(localStorage.getItem('test-key')!)).toEqual({ name: 'updated' });
  });

  it('should silently fail when setItem throws', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    expect(() => {
      act(() => {
        result.current[1]('updated');
      });
    }).not.toThrow();

    setItemSpy.mockRestore();
  });

  it('should handle different keys independently', () => {
    const { result: resultA } = renderHook(() => useLocalStorage('key-a', 'value-a'));
    const { result: resultB } = renderHook(() => useLocalStorage('key-b', 'value-b'));

    act(() => {
      resultA.current[1]('updated-a');
    });
    act(() => {
      resultB.current[1]('updated-b');
    });

    expect(resultA.current[0]).toBe('updated-a');
    expect(resultB.current[0]).toBe('updated-b');
  });
});