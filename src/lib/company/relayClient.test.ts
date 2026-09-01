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
});
