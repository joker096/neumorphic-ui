import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAppConnection } from './useAppConnection';
import { useAppStore } from '../store';

const { relayProxy } = vi.hoisted(() => ({ relayProxy: { enabled: false } }));
const managerArgs: Array<{ seeds: string[]; backend: string; autoReconnect: boolean }> = [];

vi.mock('../config/signalling', () => ({
  SIGNALING_SEED_URLS: ['wss://origin.example/ws'],
  get IS_RELAY_PROXY_CONFIGURED() {
    return relayProxy.enabled;
  },
}));

vi.mock('../lib/signaling/manager', () => ({
  SignallingManager: class {
    constructor(seeds: string[], backend: string, autoReconnect: boolean) {
      managerArgs.push({ seeds, backend, autoReconnect });
    }
    connect() { return Promise.resolve(); }
    onStateChange() { return () => {}; }
    onBlockedRegion() { return () => {}; }
    disconnect() {}
    getBackend() { return managerArgs[managerArgs.length - 1].backend; }
    getLatency() { return 0; }
    getPool() { return { reset: () => {} }; }
    getLastError() { return null; }
  },
}));

describe('useAppConnection relay backend', () => {
  beforeEach(() => {
    managerArgs.length = 0;
    relayProxy.enabled = false;
    useAppStore.setState({ relayBackend: 'cfworker', autoReconnect: true });
  });

  afterEach(() => {
    useAppStore.setState({ relayBackend: 'direct' });
  });

  it('downgrades a persisted relay backend to direct without a relay proxy', () => {
    renderHook(() => useAppConnection());
    expect(managerArgs).toHaveLength(1);
    expect(managerArgs[0].backend).toBe('direct');
    expect(managerArgs[0].seeds).toEqual(['wss://origin.example/ws']);
  });

  it('honours the persisted relay backend when a relay proxy is configured', () => {
    relayProxy.enabled = true;
    renderHook(() => useAppConnection());
    expect(managerArgs[0].backend).toBe('cfworker');
  });
});
