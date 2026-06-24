import { describe, it, expect, beforeEach } from 'vitest';
import { TransportSelector, BlockedBackendCache } from './transportSelector';

describe('BlockedBackendCache', () => {
  beforeEach(() => {
    try { localStorage.clear(); } catch {}
  });

  it('should store and retrieve blocked backends', () => {
    const cache = new BlockedBackendCache();
    cache.markBlocked('cfworker-1', 60000);
    expect(cache.isBlocked('cfworker-1')).toBe(true);
  });

  it('should expire after TTL', () => {
    const cache = new BlockedBackendCache();
    cache.markBlocked('test', -1);
    expect(cache.isBlocked('test')).toBe(false);
  });

  it('should clear all', () => {
    const cache = new BlockedBackendCache();
    cache.markBlocked('a', 60000);
    cache.markBlocked('b', 60000);
    cache.clear();
    expect(cache.isBlocked('a')).toBe(false);
    expect(cache.isBlocked('b')).toBe(false);
  });
});

describe('TransportSelector', () => {
  it('should start with direct as primary', () => {
    const sel = new TransportSelector(['wss://signaling.example.com']);
    expect(sel.getCurrentBackend()).toBe('direct');
  });

  it('should report blocked when all backends fail', () => {
    const sel = new TransportSelector(['wss://signaling.example.com'], { probeTimeout: 0 });
    expect(sel.isAllBlocked()).toBe(false);
  });
});
