import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAppearanceEffects } from './useAppearanceEffects';
import { useAppStore } from '../store';

describe('useAppearanceEffects', () => {
  beforeEach(() => {
    const root = document.documentElement;
    root.removeAttribute('data-chat-bg');
    root.removeAttribute('data-density');
    root.removeAttribute('data-anim-intensity');
    root.style.cssText = '';
    useAppStore.setState({
      accentColor: '#10b981',
      chatBackground: 'default',
      density: 'comfortable',
      messageRadius: 16,
      animationIntensity: 'high',
    });
  });

  it('applies persisted appearance values onto <html>', () => {
    renderHook(() => useAppearanceEffects());
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--accent')).toBe('#10b981');
    expect(root.style.getPropertyValue('--accent-rgb')).toBe('16,185,129');
    expect(root.style.getPropertyValue('--accent2')).toBe('#0c9065');
    expect(root.style.getPropertyValue('--button-primary-bg')).toBe('#10b981');
    expect(root.style.getPropertyValue('--button-primary-text')).toBe('#ffffff');
    expect(root.getAttribute('data-chat-bg')).toBe('default');
    expect(root.getAttribute('data-density')).toBe('comfortable');
    expect(root.style.getPropertyValue('--message-radius')).toBe('16px');
    expect(root.getAttribute('data-anim-intensity')).toBe('high');
  });

  it('re-applies on change: accent rgb, radius + tail, chat bg and density', () => {
    const { rerender } = renderHook(() => useAppearanceEffects());

    act(() => {
      useAppStore.setState({
        accentColor: '#3b82f6',
        chatBackground: 'dots',
        density: 'compact',
        messageRadius: 24,
        animationIntensity: 'low',
      });
    });
    rerender();

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--accent')).toBe('#3b82f6');
    expect(root.style.getPropertyValue('--accent-rgb')).toBe('59,130,246');
    expect(root.style.getPropertyValue('--accent-soft')).toBe('#3b82f624');
    expect(root.style.getPropertyValue('--accent2')).toBe('#1d4ed8');
    expect(root.style.getPropertyValue('--accent2-rgb')).toBe('29,78,216');
    expect(root.style.getPropertyValue('--button-primary-bg')).toBe('#3b82f6');
    expect(root.style.getPropertyValue('--button-primary-text')).toBe('#ffffff');
    expect(root.getAttribute('data-chat-bg')).toBe('dots');
    expect(root.getAttribute('data-density')).toBe('compact');
    expect(root.style.getPropertyValue('--message-radius')).toBe('24px');
    expect(root.style.getPropertyValue('--message-radius-sm')).toBe('6px');
    expect(root.getAttribute('data-anim-intensity')).toBe('low');
  });

  it('ignores an invalid accent hex (does not write --accent-rgb)', () => {
    act(() => {
      useAppStore.setState({ accentColor: 'not-a-color' });
    });
    const { rerender } = renderHook(() => useAppearanceEffects());
    rerender();
    expect(document.documentElement.style.getPropertyValue('--accent-rgb')).toBe('');
  });

  it('sets --chat-bg-image when chat background is custom with a data URL', () => {
    act(() => {
      useAppStore.setState({ chatBackground: 'custom', customChatBackground: 'data:image/jpeg;base64,AAAA' });
    });
    const { rerender } = renderHook(() => useAppearanceEffects());
    rerender();

    const root = document.documentElement;
    expect(root.getAttribute('data-chat-bg')).toBe('custom');
    expect(root.style.getPropertyValue('--chat-bg-image')).toBe('url("data:image/jpeg;base64,AAAA")');
  });

  it('removes --chat-bg-image when leaving custom background', () => {
    act(() => {
      useAppStore.setState({ chatBackground: 'custom', customChatBackground: 'data:image/jpeg;base64,AAAA' });
    });
    const { rerender } = renderHook(() => useAppearanceEffects());
    rerender();
    expect(document.documentElement.style.getPropertyValue('--chat-bg-image')).toContain('base64,AAAA');

    act(() => {
      useAppStore.setState({ chatBackground: 'dots', customChatBackground: 'data:image/jpeg;base64,AAAA' });
    });
    rerender();

    const root = document.documentElement;
    expect(root.getAttribute('data-chat-bg')).toBe('dots');
    expect(root.style.getPropertyValue('--chat-bg-image')).toBe('');
  });

  it('uses the doc accent-2 companion + dark ink for the default green accent', () => {
    act(() => {
      useAppStore.setState({ accentColor: '#4ede63' });
    });
    const { rerender } = renderHook(() => useAppearanceEffects());
    rerender();
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--accent')).toBe('#4ede63');
    expect(root.style.getPropertyValue('--accent-rgb')).toBe('78,222,99');
    expect(root.style.getPropertyValue('--accent2')).toBe('#10b981');
    expect(root.style.getPropertyValue('--button-primary-text')).toBe('#0d1017');
  });

  it('does not write --chat-bg-image for custom bg with no data URL yet', () => {
    act(() => {
      useAppStore.setState({ chatBackground: 'custom', customChatBackground: '' });
    });
    const { rerender } = renderHook(() => useAppearanceEffects());
    rerender();
    expect(document.documentElement.style.getPropertyValue('--chat-bg-image')).toBe('');
  });
});