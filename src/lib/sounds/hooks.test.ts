import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { soundPlayer } from './player';
import { useSoundSettings } from './hooks';

describe('useSoundSettings', () => {
  it('initializes soundPlayer from defaults', () => {
    renderHook(() => useSoundSettings({ enabled: true, volume: 0.5 }));
    expect(soundPlayer.enabled).toBe(true);
    expect(soundPlayer.volume).toBe(0.5);
  });

  it('setEnabled toggles player and local settings', () => {
    const { result } = renderHook(() => useSoundSettings({ enabled: true, volume: 0.7 }));
    act(() => result.current.setEnabled(false));
    expect(soundPlayer.enabled).toBe(false);
    expect(result.current.settings.enabled).toBe(false);
  });

  it('setVolume clamps player and updates local settings', () => {
    const { result } = renderHook(() => useSoundSettings({ enabled: true, volume: 0.7 }));
    act(() => result.current.setVolume(0.3));
    expect(soundPlayer.volume).toBe(0.3);
    expect(result.current.settings.volume).toBe(0.3);
    act(() => result.current.setVolume(5));
    expect(soundPlayer.volume).toBe(1); // player clamps
  });
});
