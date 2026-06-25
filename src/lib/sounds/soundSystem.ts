import { useEffect, useRef } from 'react';
import { soundPlayer } from './player';
import type { SoundEventType } from './config';

// Sound system integration for the app
export const useSoundSystem = () => {
  const playRef = useRef<(event: SoundEventType) => void>(() => {
    soundPlayer.play('error');
  });

  useEffect(() => {
    playRef.current = (event: SoundEventType) => {
      soundPlayer.play(event);
    };
  }, []);

  return { play: playRef.current };
};

// Play sound event
export const playSoundEffect = (event: SoundEventType): void => {
  soundPlayer.play(event);
};
