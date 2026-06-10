import { soundConfig } from './config';
import type { SoundEventType } from './config';

const soundMap = new Map<string, string>();
Object.entries(soundConfig).forEach(([key, url]) => soundMap.set(key, url));

export class SoundPlayer {
  private _volume = 0.7;
  private _enabled = true;
  private cooldowns = new Map<string, number>();

  get volume(): number { return this._volume; }
  set volume(v: number) { this._volume = Math.max(0, Math.min(1, v)); }

  get enabled(): boolean { return this._enabled; }
  set enabled(e: boolean) { this._enabled = e; }

  play(event: SoundEventType): void {
    if (!this._enabled) return;
    const lastPlayed = this.cooldowns.get(event);
    if (lastPlayed && Date.now() - lastPlayed < 300) return;
    this.cooldowns.set(event, Date.now());
    const url = soundMap.get(event);
    if (!url) return;
    const audio = new Audio(url);
    audio.volume = this._volume;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  }
}

export const soundPlayer = new SoundPlayer();
export const playSound = (event: SoundEventType): void => soundPlayer.play(event);
