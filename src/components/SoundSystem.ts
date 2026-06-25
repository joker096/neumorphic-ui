import React, { useEffect, useRef } from 'react';
import { soundPlayer } from '../lib/sounds/player';
import type { SoundEventType } from '../lib/sounds/config';

export const SoundSystem: React.FC<{ onPlay?: (event: SoundEventType) => void }> = ({ onPlay }) => {
  const playRef = useRef<(event: SoundEventType) => void>((event: SoundEventType) => {
    onPlay?.(event);
    soundPlayer.play(event);
  });

  useEffect(() => {
    playRef.current = (event: SoundEventType) => {
      onPlay?.(event);
      soundPlayer.play(event);
    };
  }, [onPlay]);

  return null;
};
