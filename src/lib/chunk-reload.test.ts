import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { forceFreshReload, isChunkLoadError } from './chunk-reload';

describe('isChunkLoadError', () => {
  it('matches Vite dynamic import failure', () => {
    const error = new Error(
      'Failed to fetch dynamically imported module: https://example.com/assets/Foo-abc123.js',
    );
    expect(isChunkLoadError(error)).toBe(true);
  });

  it('matches module script failure', () => {
    expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true);
  });

  it('matches chunk load error', () => {
    expect(isChunkLoadError(new Error('Chunk load error'))).toBe(true);
  });

  it('ignores unrelated errors', () => {
    expect(isChunkLoadError(new Error('Something went wrong'))).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });
});

describe('forceFreshReload', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('reloads with a cache-busted URL', () => {
    const navigate = vi.fn();
    expect(forceFreshReload(false, navigate)).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0][0]).toContain('v=');
  });

  it('blocks a second reload within the guard window', () => {
    const navigate = vi.fn();
    forceFreshReload(false, navigate);
    expect(forceFreshReload(false, navigate)).toBe(false);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('force bypasses the guard window', () => {
    const navigate = vi.fn();
    forceFreshReload(false, navigate);
    expect(forceFreshReload(true, navigate)).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(2);
  });
});
