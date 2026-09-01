import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type GdModule = typeof import('./gracefulDegradation');
let gd: GdModule;

describe('gracefulDegradation', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.resetModules();
    gd = await import('./gracefulDegradation');
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  // --- trackComponentMount ---

  it('returns a cleanup function', () => {
    const cleanup = gd.trackComponentMount(() => true);
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  // --- safeSet ---

  it('calls setState when a component is mounted', () => {
    gd.trackComponentMount(() => true);
    const setState = vi.fn();
    gd.safeSet(setState, { count: 1 });
    expect(setState).toHaveBeenCalledWith({ count: 1 });
  });

  it('skips setState when no component is mounted', () => {
    const setState = vi.fn();
    gd.safeSet(setState, { count: 1 });
    expect(setState).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('catches setState errors', () => {
    gd.trackComponentMount(() => true);
    const setState = vi.fn(() => { throw new Error('boom'); });
    expect(() => gd.safeSet(setState, { count: 1 })).not.toThrow();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('cleanup removes the component from tracking', () => {
    const cleanup = gd.trackComponentMount(() => true);
    cleanup();
    const setState = vi.fn();
    gd.safeSet(setState, {});
    expect(setState).not.toHaveBeenCalled();
  });

  // --- retryableWrite ---

  it('returns result on success', async () => {
    const fn = vi.fn(async () => 'ok');
    expect(await gd.retryableWrite(fn)).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure then returns null', async () => {
    const fn = vi.fn(async () => { throw new Error('fail'); });
    const result = await gd.retryableWrite(fn, { maxRetries: 2, baseDelay: 10 });
    expect(result).toBeNull();
    expect(fn).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('returns null after all retries exhausted', async () => {
    let attempts = 0;
    const fn = vi.fn(async () => {
      attempts++;
      if (attempts < 3) throw new Error('not yet');
      return 'finally';
    });
    const result = await gd.retryableWrite(fn, { maxRetries: 3, baseDelay: 10 });
    expect(result).toBe('finally');
  });

  // --- safeRead ---

  it('returns result on success', async () => {
    const fn = vi.fn(async () => 42);
    expect(await gd.safeRead(fn, 0)).toBe(42);
  });

  it('returns fallback on failure', async () => {
    const fn = vi.fn(async () => { throw new Error('fail'); });
    expect(await gd.safeRead(fn, 'fallback')).toBe('fallback');
    expect(warnSpy).toHaveBeenCalled();
  });

  // --- retryWithFallback ---

  it('returns primary result when primary succeeds', async () => {
    const primary = vi.fn(async () => 'primary');
    const fallback = vi.fn(async () => 'fallback');
    expect(await gd.retryWithFallback(primary, fallback)).toBe('primary');
    expect(fallback).not.toHaveBeenCalled();
  });

  it('falls back when primary fails', async () => {
    const primary = vi.fn(async () => { throw new Error('fail'); });
    const fallback = vi.fn(async () => 'fallback-result');
    const result = await gd.retryWithFallback(primary, fallback, { baseDelay: 10 });
    expect(result).toBe('fallback-result');
    expect(fallback).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('throws primary error when both fail', async () => {
    const primary = vi.fn(async () => { throw new Error('primary-err'); });
    const fallback = vi.fn(async () => { throw new Error('fallback-err'); });
    await expect(
      gd.retryWithFallback(primary, fallback, { baseDelay: 10 }),
    ).rejects.toThrow('primary-err');
    expect(errorSpy).toHaveBeenCalled();
  });

  // --- initWithFallback ---

  it('returns primary result on success', async () => {
    const result = await gd.initWithFallback(
      async () => 'primary',
      async () => 'fallback',
    );
    expect(result).toBe('primary');
  });

  it('returns fallback when primary fails', async () => {
    const result = await gd.initWithFallback(
      async () => { throw new Error('fail'); },
      async () => 'fallback',
    );
    expect(result).toBe('fallback');
  });

  // --- safeAsync ---

  it('returns result on success', async () => {
    expect(await gd.safeAsync(async () => 'data')).toBe('data');
  });

  it('returns fallback on failure', async () => {
    const result = await gd.safeAsync(
      async () => { throw new Error('fail'); },
      'default',
    );
    expect(result).toBe('default');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('returns undefined on failure when no fallback', async () => {
    const result = await gd.safeAsync(async () => { throw new Error('fail'); });
    expect(result).toBeUndefined();
  });
});
