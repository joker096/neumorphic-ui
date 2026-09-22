import { useEffect } from 'react';
import { useAppStore } from '../store';
import { soundPlayer } from '../lib/sounds/player';

/**
 * Mirrors the persisted sound settings (soundEnabled / soundVolume) into the
 * sound player. Mount once near boot (App-level); the player is a module
 * singleton, so a single subscription covers the whole app.
 */
export function useSoundSettingsSync() {
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const soundVolume = useAppStore((s) => s.soundVolume);

  useEffect(() => {
    soundPlayer.enabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    soundPlayer.volume = soundVolume;
  }, [soundVolume]);
}