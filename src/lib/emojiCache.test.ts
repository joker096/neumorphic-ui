import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Image that fires onload synchronously when src is set, so the
// concurrency cascade drains fully and deterministically.
class FakeImage {
  _src = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  get src(): string {
    return this._src;
  }

  set src(val: string) {
    this._src = val;
    // Fire onload synchronously so the concurrency cascade drains fully.
    this.onload?.();
  }
}

vi.stubGlobal('Image', FakeImage as any);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ALL_IDS = [
  'acute','aggressive','air_kiss','angel','bad','bb','beach','beee','big_boss',
  'biggrin','blum2','blush','boast','bomb','boredom','bye','clapping','cray',
  'crazy','curtsey','dance4','dash1','dirol','drinks','feminist','flirt','focus',
  'fool','friends','gamer4','girl_cray2','girl_crazy','girl_drink4','girl_haha',
  'girl_hospital','girl_impossible','girl_in_love','girl_sigh','give_heart2',
  'give_rose','good','heart','help','hi','hunter','hysteric','i-m_so_happy',
  'ireful1','king','kiss2','kiss3','lazy','lol','mail1','mamba','mega_shock',
  'mocking','moil','music','nea','new_russian','ok','paint2','pardon','party2',
  'pleasantry','popcorn1','prankster2','preved','punish','rofl','sad','sarcastic',
  'scare','scratch_one-s_head','search','secret','shock','shout','slow','smile',
  'smoke','sorry2','spiteful','spruce_up','stop','tease','tender','thank_you2',
  'this','training1','unknown','vampire','vava','victory','wacko2','wink',
  'wizard','yahoo','yes3','yess',
];

describe('emojiCache', () => {
  let preloadICQTheme: typeof import('./emojiCache').preloadICQTheme;
  let getCachedEmoji: typeof import('./emojiCache').getCachedEmoji;
  let isEmojiCached: typeof import('./emojiCache').isEmojiCached;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('./emojiCache');
    preloadICQTheme = mod.preloadICQTheme;
    getCachedEmoji = mod.getCachedEmoji;
    isEmojiCached = mod.isEmojiCached;
  });

  it('getCachedEmoji returns undefined for uncached id', () => {
    expect(getCachedEmoji('nonexistent')).toBeUndefined();
  });

  it('isEmojiCached returns false for uncached id', () => {
    expect(isEmojiCached('nonexistent')).toBe(false);
  });

  it('preloadICQTheme caches loaded emoji (light skin)', async () => {
    const promise = preloadICQTheme('light');
    await promise;
    await sleep(300);

    expect(isEmojiCached('smile')).toBe(true);
    expect(getCachedEmoji('smile')).toBeInstanceOf(FakeImage);
  });

  it('preloadICQTheme caches loaded emoji (dark skin)', async () => {
    const promise = preloadICQTheme('dark');
    await promise;
    await sleep(300);

    expect(isEmojiCached('heart')).toBe(true);
    const img = getCachedEmoji('heart');
    expect(img).toBeDefined();
    expect(img!.src).toContain('hd_dark_skin');
  });

  it('preloadICQTheme uses light skin path for light theme', async () => {
    const promise = preloadICQTheme('light');
    await promise;
    await sleep(300);

    const img = getCachedEmoji('smile');
    expect(img!.src).toContain('hd_light_skin');
  });

  it('double preload returns same promise (activePromise guard)', async () => {
    const p1 = preloadICQTheme('light');
    const p2 = preloadICQTheme('light');
    expect(p1).toBe(p2);
    await p1;
  });

  it('preloadICQTheme resolves even if some images fail', async () => {
    vi.stubGlobal('Image', class extends FakeImage {
      get src(): string { return this._src; }
      set src(val: string) {
        this._src = val;
        if (Math.random() < 0.5) this.onerror?.();
        else this.onload?.();
      }
    } as any);

    const promise = preloadICQTheme('light');
    await promise;
    // Should resolve without error — failed images are skipped

    // Restore the base fake so later tests load every image.
    vi.stubGlobal('Image', FakeImage as any);
  });

  it('preloaded emoji count matches expected pool', async () => {
    const promise = preloadICQTheme('light');
    await promise;

    for (const id of ALL_IDS) {
      expect(isEmojiCached(id)).toBe(true);
    }
  });
});
