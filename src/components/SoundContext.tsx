import React, { createContext, useContext, useState, useCallback } from 'react';
import { soundPlayer } from '../lib/sounds/player';
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
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);

  const play = useCallback((event: SoundEventType) => {
    if (enabled) {
      soundPlayer.play(event);
    }
  }, [enabled]);

  const setEnabledWithState = useCallback((enabled: boolean) => {
    soundPlayer.enabled = enabled;
    setEnabled(enabled);
  }, []);

  const setVolumeWithState = useCallback((volume: number) => {
    soundPlayer.volume = volume;
    setVolume(volume);
  }, []);

  return (
    <SoundContext.Provider value={{ enabled, volume, play, setEnabled: setEnabledWithState, setVolume: setVolumeWithState }}>
      {children}
    </SoundContext.Provider>
  );
};
