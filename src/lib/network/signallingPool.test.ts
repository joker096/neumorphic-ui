import { describe, it, expect, beforeEach } from 'vitest';
import { SignallingPool } from './signallingPool';

describe('SignallingPool', () => {
  const seeds = [
    'wss://signaling1.messanger.app/ws',
    'wss://signaling2.messanger.app/ws',
    'wss://signaling3.messanger.app/ws',
  ];

  beforeEach(() => { try { localStorage.clear(); } catch {} });

  it('should initialize with seed list', () => {
    const pool = new SignallingPool(seeds);
    expect(pool.getAll().length).toBe(3);
  });

  it('should mark server as failed', () => {
    const pool = new SignallingPool(seeds);
    pool.markFailed(seeds[0]);
    expect(pool.getStatus(seeds[0])).toBe('failed');
  });

  it('should return next available server', () => {
    const pool = new SignallingPool(seeds);
    const next = pool.getNextAvailable();
    expect(seeds).toContain(next);
  });

  it('should skip failed servers', () => {
    const pool = new SignallingPool(seeds);
    pool.markFailed(seeds[0]);
    pool.markFailed(seeds[1]);
    const next = pool.getNextAvailable();
    expect(next).toBe(seeds[2]);
  });

  it('should retry a failed server instead of parking when all seeds are failed', () => {
    const pool = new SignallingPool(seeds);
    seeds.forEach(s => pool.markFailed(s));
    expect(pool.getNextAvailable()).toBe(seeds[0]);
  });

  it('should return null only when the pool has no seeds', () => {
    const pool = new SignallingPool([]);
    expect(pool.getNextAvailable()).toBeNull();
  });

  it('should recover across reloads after a transient failure', () => {
    const pool = new SignallingPool([seeds[0]]);
    pool.markFailed(seeds[0]);
    expect(pool.getNextAvailable()).toBe(seeds[0]);
    pool.reset();
    expect(pool.getStatus(seeds[0])).toBe('untested');
    expect(pool.getNextAvailable()).toBe(seeds[0]);
  });

  it('should drop persisted seeds that are not in the current config', () => {
    // Simulate a stale bundle having persisted old signaling*.messanger.app seeds.
    const oldPool = new SignallingPool(seeds);
    expect(oldPool.getAll().length).toBe(3);
    // Reboot with a NEW config that no longer includes those seeds.
    const current = ['wss://mess.cvr.name/ws'];
    const pool = new SignallingPool(current);
    expect(pool.getAll().length).toBe(1);
    expect(pool.getAll()[0].url).toBe('wss://mess.cvr.name/ws');
    expect(pool.getNextAvailable()).toBe('wss://mess.cvr.name/ws');
  });

  it('should restore configured seeds that a stale run removed', () => {
    // A prior run saved only an old seed (config moved on).
    const stale = new SignallingPool(seeds);
    const current = ['wss://mess.cvr.name/ws'];
    const pool = new SignallingPool(current);
    // Re-instantiate with current config; the old seeds are gone, current present.
    expect(pool.getAll().map(e => e.url)).toEqual(current);
    // And the persisted state now matches config only.
    const reloaded = new SignallingPool(current);
    expect(reloaded.getAll().map(e => e.url)).toEqual(current);
  });
});
