import { describe, it, expect } from 'vitest';
import { SignallingManager } from './manager';

describe('SignallingManager', () => {
  it('should create with seed URLs', () => {
    const mgr = new SignallingManager(['wss://s1.test/ws']);
    expect(mgr).toBeDefined();
  });

  it('should start in disconnected state', () => {
    const mgr = new SignallingManager(['wss://s1.test/ws']);
    expect(mgr.getState()).toBe('disconnected');
  });

  it('should transition through states', () => {
    const mgr = new SignallingManager(['wss://s1.test/ws']);
    const states: string[] = [];
    mgr.onStateChange((s) => states.push(s));
    mgr.setState('connecting');
    mgr.setState('connected');
    expect(states).toEqual(['connecting', 'connected']);
  });
});
