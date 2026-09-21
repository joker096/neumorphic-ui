import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAppConnection } from './useAppConnection';
import { useAppStore } from '../store';

const relayProxy = vi.hoisted(() => ({ enabled: false }));
const identity = vi.hoisted(() => ({
  hasIdentity: false,
  signature: 'mock-signature',
  acceptInboundOffer: vi.fn().mockResolvedValue(undefined),
}));
const hoisted = vi.hoisted(() => {
  const managerArgs: Array<{ seeds: string[]; backend: string; autoReconnect: boolean }> = [];
  const managerState: { instance: any } = { instance: null };
  class MockManager {
    send = vi.fn();
    private cbs = new Set<(msg: any) => void>();
    constructor(seeds: string[], backend: string, autoReconnect: boolean) {
      managerArgs.push({ seeds, backend, autoReconnect });
      managerState.instance = this;
    }
    connect() { return Promise.resolve(); }
    onMessage(callback: (data: any) => void) {
      this.cbs.add(callback);
      return () => { this.cbs.delete(callback); };
    }
    emit(msg: any) { this.cbs.forEach((cb) => cb(msg)); }
    onStateChange() { return () => {}; }
    onBlockedRegion() { return () => {}; }
    disconnect() {}
    getBackend() { return managerArgs[managerArgs.length - 1].backend; }
    getLatency() { return 0; }
    getPool() { return { reset: () => {} }; }
    getLastError() { return null; }
  }
  return { managerArgs, managerState, MockManager };
});
const managerArgs = hoisted.managerArgs;
const managerState = hoisted.managerState;

vi.mock('../config/signalling', () => ({
  SIGNALING_SEED_URLS: ['wss://origin.example/ws'],
  get IS_RELAY_PROXY_CONFIGURED() {
    return relayProxy.enabled;
  },
}));

vi.mock('../lib/identity/masterKey', () => ({
  hasMasterIdentity: () => identity.hasIdentity,
  getMasterKeySet: vi.fn().mockResolvedValue({
    ed25519Public: new Uint8Array(32).fill(7),
    ed25519Secret: new Uint8Array(64).fill(9),
  }),
}));

vi.mock('../lib/p2p/identityPin', () => ({
  signDh: vi.fn(() => identity.signature),
}));

vi.mock('../lib/p2p/network', () => ({
  p2pNetwork: { acceptInboundOffer: (...a: any[]) => identity.acceptInboundOffer(...a) },
}));

vi.mock('../lib/signaling/manager', () => ({
  SignallingManager: hoisted.MockManager,
}));

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

describe('useAppConnection relay backend', () => {
  beforeEach(() => {
    managerArgs.length = 0;
    managerState.instance = null;
    relayProxy.enabled = false;
    identity.hasIdentity = false;
    identity.acceptInboundOffer.mockClear();
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

  it('registers the identity key with challenge-response on the main WS (M021)', async () => {
    identity.hasIdentity = true;
    renderHook(() => useAppConnection());

    await waitFor(() => {
      expect(managerState.instance.send).toHaveBeenCalledWith({
        type: 'register',
        publicKey: '07'.repeat(32),
      });
    });

    managerState.instance.emit({ type: 'challenge', nonce: 'ab'.repeat(32) });
    await flush();

    expect(managerState.instance.send).toHaveBeenCalledWith({
      type: 'register-challenge',
      publicKey: '07'.repeat(32),
      nonce: 'ab'.repeat(32),
      signature: 'mock-signature',
    });

    // Challenge resolution settles the flow without throwing.
    managerState.instance.emit({ type: 'registered' });
    await flush();
  });

  it('skips registration when no identity exists', async () => {
    identity.hasIdentity = false;
    renderHook(() => useAppConnection());
    await flush();
    expect(managerState.instance.send).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'register' }),
    );
  });

  it('forwards an inbound offer to p2pNetwork.acceptInboundOffer (M021)', async () => {
    renderHook(() => useAppConnection());
    // The offer-forward subscription installs inside mgr.connect().then() —
    // let the microtask run before emitting.
    await flush();
    const offer = { type: 'offer', from: 'peer-x', sdp: { type: 'offer', sdp: 's' } };

    managerState.instance.emit(offer);
    await waitFor(() => {
      expect(identity.acceptInboundOffer).toHaveBeenCalledWith('peer-x', offer);
    });
  });
});