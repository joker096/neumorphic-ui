import { soundPlayer } from '../lib/sounds/player';

export const playSound = (event: string) => {
  soundPlayer.play(event as any);
};
