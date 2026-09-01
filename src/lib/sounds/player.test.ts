import { describe, it, expect, vi, beforeEach } from 'vitest';
import { soundConfig, type SoundEventType } from './config';

const cached = { url: '', volume: 1, play: vi.fn(() => Promise.resolve()) } as any;

vi.mock('../soundCache', () => ({
  getCachedSound: vi.fn(() => null),
}));

const audioConstructions: { url: string; volume: number }[] = [];

class FakeAudio {
  url: string;
  volume = 1;
  constructor(url: string) {
    this.url = url;
    audioConstructions.push(this);
  }
  play(): Promise<void> {
    return Promise.resolve();
  }
  cloneNode(): any {
    return { play: () => Promise.resolve(), volume: 0.7 };
  }
}

import { SoundPlayer } from './player';

describe('soundPlayer', () => {
  beforeEach(() => {
    audioConstructions.length = 0;
    (globalThis as any).Audio = FakeAudio;
    vi.clearAllMocks();
  });

  it('config exposes all sound event urls', () => {
    expect(Object.keys(soundConfig).length).toBeGreaterThan(0);
    expect(soundConfig['incoming-call']).toContain('.mp3');
  });

  it('volume clamps between 0 and 1', () => {
    const p = new SoundPlayer();
    p.volume = 2;
    expect(p.volume).toBe(1);
    p.volume = -1;
    expect(p.volume).toBe(0);
    p.volume = 0.5;
    expect(p.volume).toBe(0.5);
  });

  it('no play when disabled', () => {
    const p = new SoundPlayer();
    p.enabled = false;
    p.play('incoming-chat');
    expect(audioConstructions.length).toBe(0);
  });

  it('plays via new Audio when not cached', () => {
    const p = new SoundPlayer();
    p.volume = 0.4;
    p.play('incoming-chat');
    expect(audioConstructions).toHaveLength(1);
    expect(audioConstructions[0].url).toBe(soundConfig['incoming-chat']);
    expect(audioConstructions[0].volume).toBe(0.4);
  });

  it('cooldown suppresses repeated play within 300ms', () => {
    vi.useFakeTimers();
    const p = new SoundPlayer();
    p.play('incoming-call');
    const count = audioConstructions.length;
    p.play('incoming-call');
    expect(audioConstructions.length).toBe(count);
    vi.advanceTimersByTime(300);
    p.play('incoming-call');
    expect(audioConstructions.length).toBe(count + 1);
    vi.useRealTimers();
  });
});
