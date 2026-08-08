import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScreenshotProtection } from './useScreenshotProtection';

describe('useScreenshotProtection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.classList.remove('screenshot-protect');
    const existingStyle = document.getElementById('__screenshot_protect_style');
    if (existingStyle) existingStyle.remove();
  });

  afterEach(() => {
    document.documentElement.classList.remove('screenshot-protect');
    const existingStyle = document.getElementById('__screenshot_protect_style');
    if (existingStyle) existingStyle.remove();
  });

  it('does nothing when enabled is false', () => {
    renderHook(() => useScreenshotProtection(false));
    expect(document.getElementById('__screenshot_protect_style')).toBeNull();
  });

  it('adds screenshot protection style when enabled', () => {
    renderHook(() => useScreenshotProtection(true));
    expect(document.getElementById('__screenshot_protect_style')).not.toBeNull();
  });

  it('adds screenshot-protect class to document when visibility changes to hidden', () => {
    renderHook(() => useScreenshotProtection(true));
    expect(document.documentElement.classList.contains('screenshot-protect')).toBe(false);

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(document.documentElement.classList.contains('screenshot-protect')).toBe(true);
  });

  it('removes screenshot-protect class when visibility changes to visible', () => {
    renderHook(() => useScreenshotProtection(true));

    act(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(document.documentElement.classList.contains('screenshot-protect')).toBe(true);

    act(() => {
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(document.documentElement.classList.contains('screenshot-protect')).toBe(false);
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useScreenshotProtection(true));
    expect(document.getElementById('__screenshot_protect_style')).not.toBeNull();

    unmount();

    expect(document.documentElement.classList.contains('screenshot-protect')).toBe(false);
  });

  it('does not add duplicate style elements', () => {
    renderHook(() => useScreenshotProtection(true));
    const firstStyle = document.getElementById('__screenshot_protect_style');
    expect(firstStyle).not.toBeNull();

    renderHook(() => useScreenshotProtection(true));
    const styles = document.querySelectorAll('#__screenshot_protect_style');
    expect(styles.length).toBe(1);
  });
});