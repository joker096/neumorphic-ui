import { useState, useCallback, useEffect } from 'react';
import { soundPlayer } from './player';
import type { SoundEventType } from './config';

export function useSoundSettings(defaults: { enabled: boolean; volume: number } = { enabled: true, volume: 0.7 }) {
  const [settings, setSettings] = useState(defaults);

  useEffect(() => {
    soundPlayer.enabled = defaults.enabled;
    soundPlayer.volume = defaults.volume;
  }, [defaults.enabled, defaults.volume]);

  const setEnabled = useCallback((enabled: boolean) => {
    soundPlayer.enabled = enabled;
    setSettings((prev) => ({ ...prev, enabled }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    soundPlayer.volume = volume;
    setSettings((prev) => ({ ...prev, volume }));
  }, []);

  return { settings, setEnabled, setVolume };
}
