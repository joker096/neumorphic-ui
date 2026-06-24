import { describe, it, expect } from 'vitest';
import { ConnectionPool } from './pool';

describe('ConnectionPool', () => {
  it('should create pool with primary and standby', () => {
    const pool = new ConnectionPool();
    expect(pool.getPrimary()).toBeNull();
    expect(pool.getStandby()).toBeNull();
  });

  it('should manage state transitions', () => {
    const pool = new ConnectionPool();
    pool.setState('primary', 'connecting');
    expect(pool.getState('primary')).toBe('connecting');
    pool.setState('primary', 'connected');
    expect(pool.getState('primary')).toBe('connected');
  });
});
