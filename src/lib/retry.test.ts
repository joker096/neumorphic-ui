import { describe, it, expect, vi } from 'vitest';
import { retry, retrySync } from './retry';

describe('retry', () => {
  it('returns the result on first success', async () => {
    const fn = vi.fn(async () => 42);
    const res = await retry(fn, { maxRetries: 3, baseDelay: 1 });
    expect(res).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries and then succeeds', async () => {
    let attempts = 0;
    const fn = vi.fn(async () => {
      attempts++;
      if (attempts < 3) throw new Error('fail');
      return 'ok';
    });
    const res = await retry(fn, { maxRetries: 3, baseDelay: 1 });
    expect(res).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after maxRetries', async () => {
    const fn = vi.fn(async () => { throw new Error('always'); });
    await expect(retry(fn, { maxRetries: 2, baseDelay: 1 })).rejects.toThrow('always');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('calls onRetry and onError callbacks', async () => {
    const onRetry = vi.fn();
    const onError = vi.fn();
    const fn = vi.fn(async () => { throw new Error('x'); });
    await expect(retry(fn, { maxRetries: 2, baseDelay: 1, onRetry, onError })).rejects.toThrow();
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('uses fixed backoff and succeeds', async () => {
    let attempts = 0;
    const fn = vi.fn(async () => { attempts++; if (attempts < 2) throw new Error('f'); return 'ok'; });
    const res = await retry(fn, { maxRetries: 3, baseDelay: 1, backoff: 'fixed' });
    expect(res).toBe('ok');
  });

  it('retrySync retries synchronously and succeeds', () => {
    let attempts = 0;
    const res = retrySync(() => { attempts++; if (attempts < 2) throw new Error('f'); return 'ok'; }, { maxRetries: 3, baseDelay: 1 });
    expect(res).toBe('ok');
    expect(attempts).toBe(2);
  });

  it('retrySync throws after maxRetries', () => {
    expect(() => retrySync(() => { throw new Error('always'); }, { maxRetries: 2, baseDelay: 1 })).toThrow('always');
  });
});
