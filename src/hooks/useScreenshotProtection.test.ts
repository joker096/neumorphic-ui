import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

describe('useScreenshotProtection', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.documentElement.classList.remove('screenshot-protect');
  });

  it('should not add style or listener when disabled', async () => {
    const { useScreenshotProtection } = await import('./useScreenshotProtection');
    renderHook(() => useScreenshotProtection(false));
    expect(document.getElementById('__screenshot_protect_style')).toBeNull();
  });

  it('should inject a style element when enabled', async () => {
    const { useScreenshotProtection } = await import('./useScreenshotProtection');
    renderHook(() => useScreenshotProtection(true));
    const style = document.getElementById('__screenshot_protect_style');
    expect(style).not.toBeNull();
    expect(style?.tagName).toBe('STYLE');
  });

  it('should add screenshot-protect class when page becomes hidden', async () => {
    const { useScreenshotProtection } = await import('./useScreenshotProtection');
    renderHook(() => useScreenshotProtection(true));

    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(document.documentElement.classList.contains('screenshot-protect')).toBe(true);
  });

  it('should remove screenshot-protect class when page becomes visible', async () => {
    const { useScreenshotProtection } = await import('./useScreenshotProtection');
    renderHook(() => useScreenshotProtection(true));

    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.documentElement.classList.add('screenshot-protect');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(document.documentElement.classList.contains('screenshot-protect')).toBe(false);
  });

  it('should clean up style and class on unmount', async () => {
    const { useScreenshotProtection } = await import('./useScreenshotProtection');
    const { unmount } = renderHook(() => useScreenshotProtection(true));
    expect(document.getElementById('__screenshot_protect_style')).not.toBeNull();

    unmount();
    expect(document.getElementById('__screenshot_protect_style')).not.toBeNull();
    expect(document.documentElement.classList.contains('screenshot-protect')).toBe(false);
  });

  it('should not duplicate style element if already present', async () => {
    const style = document.createElement('style');
    style.id = '__screenshot_protect_style';
    document.head.appendChild(style);

    const { useScreenshotProtection } = await import('./useScreenshotProtection');
    renderHook(() => useScreenshotProtection(true));

    const styles = document.querySelectorAll('#__screenshot_protect_style');
    expect(styles.length).toBe(1);
  });
});
