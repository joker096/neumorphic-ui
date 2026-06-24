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

  it('should return null when all servers failed', () => {
    const pool = new SignallingPool(seeds);
    seeds.forEach(s => pool.markFailed(s));
    expect(pool.getNextAvailable()).toBeNull();
  });
});
