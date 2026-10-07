// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../config/signalling', () => ({
  SIGNALING_SEED_URLS: ['wss://relay.test'],
}));
vi.mock('../network/relayToken', () => ({
  withToken: (base: string, token: string) => (token ? `${base}?token=${token}` : base),
}));

import {
  openRelaySocket,
  RELAY_CONNECT_TIMEOUT_MS,
  RELAY_RETRY_DELAYS_MS,
  RELAY_STABLE_RESET_MS,
} from './relaySocket';

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static OPEN = 1;
  url: string;
  readyState = 0;
  closed = false;
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
  close() {
    this.closed = true;
    this.readyState = 3;
  }
  /** Simulate a successful handshake. */
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  /** Simulate an inbound frame. */
  deliver(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

const sockets = () => FakeWebSocket.instances;

beforeEach(() => {
  FakeWebSocket.instances = [];
  (globalThis as any).WebSocket = FakeWebSocket as any;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function open() {
  return openRelaySocket({
    base: 'wss://relay.test',
    token: 'tok',
    onOpen: (send) => {
      send({ type: 'register' });
      send({ type: 'subscribe', topic: 't' });
    },
    onMessage: () => {},
  });
}

describe('openRelaySocket', () => {
  it('sends the open frames once the handshake completes', () => {
    const socket = open();
    const ws = sockets()[0];
    ws.open();
    expect(ws.url).toBe('wss://relay.test?token=tok');
    expect(ws.sent).toEqual([JSON.stringify({ type: 'register' }), JSON.stringify({ type: 'subscribe', topic: 't' })]);
    socket.close();
  });

  it('publishes only while OPEN', () => {
    const socket = open();
    const ws = sockets()[0];
    expect(socket.publish({ type: 'ping' })).toBe(false); // still CONNECTING
    ws.open();
    expect(socket.publish({ type: 'ping' })).toBe(true);
    expect(ws.sent).toContain(JSON.stringify({ type: 'ping' }));
    socket.close();
  });

  it('closes a socket that never reaches OPEN and retries once the connect timeout elapses', () => {
    const socket = open();
    expect(sockets()).toHaveLength(1);
    vi.advanceTimersByTime(RELAY_CONNECT_TIMEOUT_MS);
    expect(sockets()[0].closed).toBe(true);
    vi.advanceTimersByTime(RELAY_RETRY_DELAYS_MS[0]);
    expect(sockets()).toHaveLength(2);
    socket.close();
  });

  it('retries a dropped connection with the documented backoff, then gives up', () => {
    const socket = open();
    sockets()[0].open();
    sockets()[0].onclose?.();
    expect(sockets()).toHaveLength(1);

    vi.advanceTimersByTime(RELAY_RETRY_DELAYS_MS[0]);
    expect(sockets()).toHaveLength(2);
    // Second attempt never opens: the connect timeout counts it as failed too.
    vi.advanceTimersByTime(RELAY_CONNECT_TIMEOUT_MS);
    vi.advanceTimersByTime(RELAY_RETRY_DELAYS_MS[1]);
    expect(sockets()).toHaveLength(3);
    vi.advanceTimersByTime(RELAY_CONNECT_TIMEOUT_MS);
    vi.advanceTimersByTime(RELAY_RETRY_DELAYS_MS[2]);
    expect(sockets()).toHaveLength(4);

    // Budget exhausted: no further reconnects (degrade to no-op, stop hammering).
    vi.advanceTimersByTime(10 * 60_000);
    expect(sockets()).toHaveLength(4);
    socket.close();
  });

  it('does not let a flapping connection reset its own budget', () => {
    const socket = open();
    for (let i = 0; i < 5; i += 1) {
      const ws = sockets()[sockets().length - 1];
      ws.open(); // reaches OPEN…
      ws.onclose?.(); // …and dies immediately, before it can look "stable"
      vi.advanceTimersByTime(10_000); // longer than every backoff step
    }
    expect(sockets()).toHaveLength(4); // initial attempt + 3 retries
    vi.advanceTimersByTime(10 * 60_000);
    expect(sockets()).toHaveLength(4);
    socket.close();
  });

  it('restores the budget after a long-lived connection', () => {
    const socket = open();
    sockets()[0].open();
    vi.advanceTimersByTime(RELAY_STABLE_RESET_MS + 1);
    sockets()[0].onclose?.();
    vi.advanceTimersByTime(RELAY_RETRY_DELAYS_MS[0]);
    const reconnected = sockets()[1];
    reconnected.open();
    // Budget is full again → two more reconnects are available.
    vi.advanceTimersByTime(60_000);
    reconnected.onclose?.();
    vi.advanceTimersByTime(RELAY_RETRY_DELAYS_MS[0]);
    expect(sockets()).toHaveLength(3);
    socket.close();
  });

  it('cancels pending retries on close()', () => {
    const socket = open();
    vi.advanceTimersByTime(RELAY_CONNECT_TIMEOUT_MS);
    expect(sockets()).toHaveLength(1); // retry is scheduled
    socket.close();
    vi.advanceTimersByTime(60_000);
    expect(sockets()).toHaveLength(1);
  });

  it('ignores unparseable frames instead of throwing', () => {
    const socket = open();
    sockets()[0].open();
    expect(() => sockets()[0].onmessage?.({ data: 'not json' })).not.toThrow();
    socket.close();
  });

  it('reports status transitions without repeating the current value', () => {
    const seen: string[] = [];
    const socket = openRelaySocket({
      base: 'wss://relay.test',
      token: '',
      onOpen: () => {},
      onMessage: () => {},
      onStatus: (s) => seen.push(s),
    });
    // Connecting → online after the handshake.
    const ws = sockets()[0];
    ws.open();
    ws.open(); // a stray duplicate event must not re-emit 'online'
    expect(seen).toEqual(['online']);
    expect(socket.status()).toBe('online');

    // Drop → offline, then 'connecting' again while the retry is in flight.
    ws.onclose?.();
    expect(socket.status()).toBe('offline');
    vi.advanceTimersByTime(RELAY_RETRY_DELAYS_MS[0]);
    expect(socket.status()).toBe('connecting');
    sockets()[1].open();
    expect(seen).toEqual(['online', 'offline', 'connecting', 'online']);
    socket.close();
  });

  it('reports offline when the reconnect budget is exhausted', () => {
    const seen: string[] = [];
    const socket = openRelaySocket({
      base: 'wss://relay.test',
      token: '',
      onOpen: () => {},
      onMessage: () => {},
      onStatus: (s) => seen.push(s),
    });
    for (let i = 0; i < 4; i += 1) {
      const ws = sockets()[sockets().length - 1];
      ws.open();
      ws.onclose?.();
      vi.advanceTimersByTime(10_000);
    }
    vi.advanceTimersByTime(10 * 60_000);
    expect(socket.status()).toBe('offline');
    expect(seen[seen.length - 1]).toBe('offline');
    socket.close();
  });

  it('retries when the constructor itself throws', () => {
    let attempts = 0;
    (globalThis as any).WebSocket = class {
      constructor() {
        attempts += 1;
        throw new Error('SecurityError');
      }
    };
    const socket = openRelaySocket({
      base: 'wss://relay.test',
      token: '',
      onOpen: () => {},
      onMessage: () => {},
    });
    expect(attempts).toBe(1);
    vi.advanceTimersByTime(RELAY_RETRY_DELAYS_MS[0]);
    expect(attempts).toBe(2);
    socket.close();
  });
});
