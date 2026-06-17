import React, { createContext, useContext, useCallback } from 'react';
import { soundPlayer } from '../lib/sounds/player';
import { useAppStore } from '../store';
import type { SoundEventType } from '../lib/sounds/config';

interface SoundContextType {
  enabled: boolean;
  volume: number;
  play: (event: SoundEventType) => void;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
}

const SoundContext = createContext<SoundContextType>({
  enabled: true,
  volume: 0.7,
  play: () => {},
  setEnabled: () => {},
  setVolume: () => {},
});

export const useSound = () => useContext(SoundContext);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const enabled = useAppStore(state => state.soundEnabled);
  const volume = useAppStore(state => state.soundVolume);
  const setStoreEnabled = useAppStore(state => state.setSoundEnabled);
  const setStoreVolume = useAppStore(state => state.setSoundVolume);

  const play = useCallback((event: SoundEventType) => {
    if (enabled) {
      soundPlayer.play(event);
    }
  }, [enabled]);

  const setEnabledWithState = useCallback((enabled: boolean) => {
    soundPlayer.enabled = enabled;
    setStoreEnabled(enabled);
  }, [setStoreEnabled]);

  const setVolumeWithState = useCallback((volume: number) => {
    soundPlayer.volume = volume;
    setStoreVolume(volume);
  }, [setStoreVolume]);

  return (
    <SoundContext.Provider value={{ enabled, volume, play, setEnabled: setEnabledWithState, setVolume: setVolumeWithState }}>
      {children}
    </SoundContext.Provider>
  );
};
