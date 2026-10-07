// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../config/signalling', () => ({
  SIGNALING_SEED_URLS: ['wss://relay.test'],
}));
vi.mock('../network/relayToken', () => ({
  getRelayToken: vi.fn(async () => ''),
  withToken: (base: string) => base,
}));

import { RelayClient } from './relayClient';

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static OPEN = 1;
  url: string;
  readyState = 1;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((ev: any) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }
  send(m: string) {
    this.sent.push(m);
  }
  close() {}
}

beforeEach(() => {
  FakeWebSocket.instances = [];
  (globalThis as any).WebSocket = FakeWebSocket as any;
});

describe('RelayClient', () => {
  it('registers and subscribes on open', () => {
    const c = new RelayClient('company:x:channel:y');
    c.start('tok');
    const ws = FakeWebSocket.instances[0];
    ws.onopen!();
    expect(ws.sent).toContain(JSON.stringify({ type: 'register', publicKey: 'embed' }));
    expect(ws.sent).toContain(JSON.stringify({ type: 'subscribe', topic: 'company:x:channel:y' }));
  });

  it('dispatches incoming publish to handler', () => {
    const c = new RelayClient('company:x:channel:y');
    let got: any = null;
    c.onMessage((p) => {
      got = p;
    });
    c.start('tok');
    const ws = FakeWebSocket.instances[0];
    ws.onmessage!({ data: JSON.stringify({ type: 'publish', topic: 'company:x:channel:y', data: { hi: 1 } }) });
    expect(got).toEqual({ hi: 1 });
  });

  it('publishes with the topic', () => {
    const c = new RelayClient('company:x:channel:y');
    c.start('tok');
    const ws = FakeWebSocket.instances[0];
    ws.onopen!();
    c.publish({ foo: 'bar' });
    expect(ws.sent).toContain(
      JSON.stringify({ type: 'publish', topic: 'company:x:channel:y', data: { foo: 'bar' } }),
    );
  });

  it('reports the current status to new subscribers and on transitions', () => {
    const c = new RelayClient('company:x:channel:y');
    const seen: string[] = [];
    c.onStatus((s) => seen.push(s));
    // The current state is pushed immediately so the UI never waits for the handshake.
    expect(seen).toEqual(['connecting']);
    expect(c.isOnline()).toBe(false);

    c.start('tok');
    FakeWebSocket.instances[0].onopen!();
    expect(c.isOnline()).toBe(true);
    expect(seen).toEqual(['connecting', 'online']);

    FakeWebSocket.instances[0].onclose!();
    expect(c.isOnline()).toBe(false);
    expect(seen).toEqual(['connecting', 'online', 'offline']);
  });

  it('publish returns false when the socket is not open', () => {
    const c = new RelayClient('company:x:channel:y');
    c.start('tok');
    const ws = FakeWebSocket.instances[0];
    ws.onopen!();
    expect(c.publish({ foo: 'bar' })).toBe(true);
    ws.onclose!();
    // Offline: callers must not show the message as delivered.
    expect(c.publish({ foo: 'baz' })).toBe(false);
    expect(ws.sent).not.toContain(
      JSON.stringify({ type: 'publish', topic: 'company:x:channel:y', data: { foo: 'baz' } }),
    );
  });
});
