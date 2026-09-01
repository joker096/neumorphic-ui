import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Mock Audio that auto-fires oncanplaythrough via microtask when src is set ---
class FakeAudio {
  _src = '';
  preload = '';
  oncanplaythrough: (() => void) | null = null;
  onerror: (() => void) | null = null;

  get src(): string {
    return this._src;
  }

  set src(val: string) {
    this._src = val;
    queueMicrotask(() => this.oncanplaythrough?.());
  }
}

vi.stubGlobal('Audio', FakeAudio as any);

describe('soundCache', () => {
  let preloadICQSounds: typeof import('./soundCache').preloadICQSounds;
  let getCachedSound: typeof import('./soundCache').getCachedSound;
  let isSoundCached: typeof import('./soundCache').isSoundCached;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const mod = await import('./soundCache');
    preloadICQSounds = mod.preloadICQSounds;
    getCachedSound = mod.getCachedSound;
    isSoundCached = mod.isSoundCached;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('getCachedSound returns undefined for uncached event', () => {
    expect(getCachedSound('nonexistent')).toBeUndefined();
  });

  it('isSoundCached returns false for uncached event', () => {
    expect(isSoundCached('nonexistent')).toBe(false);
  });

  it('preloadICQSounds caches all 17 sound events', async () => {
    const promise = preloadICQSounds();
    await vi.advanceTimersByTimeAsync(2000);
    await promise;

    const expectedEvents = [
      'incoming-call', 'call-ringing', 'call-busy', 'call-hang-up', 'call-waiting',
      'incoming-chat', 'incoming-sms', 'incoming-file', 'incoming-contact',
      'outgoing-message', 'typing-indicator', 'error', 'contact-signs-in',
      'sign-out', 'file-transfer-done', 'birthday-reminder', 'flip-window',
    ];
    expect(expectedEvents).toHaveLength(17);
    for (const event of expectedEvents) {
      expect(isSoundCached(event)).toBe(true);
      expect(getCachedSound(event)).toBeInstanceOf(FakeAudio);
    }
  });

  it('cached sound has correct src URL', async () => {
    const promise = preloadICQSounds();
    await vi.advanceTimersByTimeAsync(2000);
    await promise;

    const audio = getCachedSound('incoming-call');
    expect(audio!.src).toBe('/ICQ/sound/zvuk-icq-incoming-call.mp3');
  });

  it('double preload returns same promise (activePromise guard)', async () => {
    const p1 = preloadICQSounds();
    const p2 = preloadICQSounds();
    expect(p1).toBe(p2);
    await vi.advanceTimersByTimeAsync(2000);
    await p1;
  });

  it('preloadICQSounds resolves even if some audio fails', async () => {
    vi.stubGlobal('Audio', class extends FakeAudio {
      set src(val: string) {
        this._src = val;
        queueMicrotask(() => {
          if (val.includes('error')) this.onerror?.();
          else this.oncanplaythrough?.();
        });
      }
    } as any);

    vi.resetModules();
    const mod = await import('./soundCache');
    const promise = mod.preloadICQSounds();
    await vi.advanceTimersByTimeAsync(2000);
    await promise;
    // Resolves without error — failed sounds skipped
  });
});
