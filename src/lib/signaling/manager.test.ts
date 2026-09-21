import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

describe('SignallingManager connection lifecycle', () => {
  const fakeWebSockets: any[] = [];

  class FakeWebSocket {
    static OPEN = 1;
    static CONNECTING = 0;
    url: string;
    readyState = FakeWebSocket.CONNECTING;
    onopen: ((e?: any) => void) | null = null;
    onmessage: ((e: any) => void) | null = null;
    onclose: ((e?: any) => void) | null = null;
    onerror: ((e?: any) => void) | null = null;
    close = vi.fn();
    send = vi.fn();

    constructor(url: string) {
      this.url = url;
      fakeWebSockets.push(this);
    }
  }

  async function openSocket(mgr: SignallingManager): Promise<any> {
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);
    const ws = fakeWebSockets[fakeWebSockets.length - 1];
    ws.readyState = FakeWebSocket.OPEN;
    ws.onopen?.();
    await vi.advanceTimersByTimeAsync(0);
    return ws;
  }

  beforeEach(() => {
    fakeWebSockets.length = 0;
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', FakeWebSocket);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline in tests')));
    vi.stubGlobal('navigator', { onLine: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('enters blocked on a server rejection (1008) and retries slowly', async () => {
    const mgr = new SignallingManager(['wss://s1.test/ws']);
    const p = mgr.connect().catch(() => {});
    const ws = await openSocket(mgr);
    await p;
    expect(mgr.getState()).toBe('connected');

    ws.onclose({ code: 1008, reason: 'Too many connections' });

    expect(mgr.getState()).toBe('blocked');
    expect(mgr.getLastError()).toBe('Too many connections');

    await vi.advanceTimersByTimeAsync(44000);
    expect(fakeWebSockets.length).toBe(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(fakeWebSockets.length).toBe(2);
    mgr.disconnect();
  });

  it('recognises reason-based rejections (Origin not allowed) as blocked', async () => {
    const mgr = new SignallingManager(['wss://s1.test/ws']);
    const p = mgr.connect().catch(() => {});
    const ws = await openSocket(mgr);
    await p;

    ws.onclose({ code: 1008, reason: 'Origin not allowed' });

    expect(mgr.getState()).toBe('blocked');
    mgr.disconnect();
  });

  it('parses raw-string frames into objects for onMessage handlers', async () => {
    const mgr = new SignallingManager(['wss://s1.test/ws']);
    const p = mgr.connect().catch(() => {});
    const ws = await openSocket(mgr);
    await p;

    const seen: any[] = [];
    mgr.onMessage((msg) => seen.push(msg));

    // wsTunnel dispatches event.data which is a raw JSON string; the manager
    // must parse it before app handlers (offer-forward, registerMainIdentity).
    ws.onmessage({ data: JSON.stringify({ type: 'offer', from: 'peerA', seq: 1 }) });

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({ type: 'offer', from: 'peerA', seq: 1 });
    expect(typeof seen[0]).toBe('object');
    mgr.disconnect();
  });

  it('passes non-JSON messages through unparsed', async () => {
    const mgr = new SignallingManager(['wss://s1.test/ws']);
    const p = mgr.connect().catch(() => {});
    const ws = await openSocket(mgr);
    await p;

    const seen: any[] = [];
    mgr.onMessage((msg) => seen.push(msg));

    // Binary/raw frames (e.g. pong keepalive) must not throw or be mangled.
    ws.onmessage({ data: 'raw-bytes' });

    expect(seen).toEqual(['raw-bytes']);
    mgr.disconnect();
  });

  it('treats abrupt closes (1006) as transient and reconnects with backoff', async () => {
    const mgr = new SignallingManager(['wss://s1.test/ws']);
    const p = mgr.connect().catch(() => {});
    const ws = await openSocket(mgr);
    await p;

    ws.onclose(); // no frame → 1006

    expect(mgr.getState()).not.toBe('blocked');
    expect(mgr.getState()).toBe('disconnected');

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(0);
    expect(fakeWebSockets.length).toBe(2);
    mgr.disconnect();
  });

  it('reconnects after a transient close although state was "connected" (dead-lock guard)', async () => {
    const mgr = new SignallingManager(['wss://s1.test/ws']);
    const p = mgr.connect().catch(() => {});
    const ws = await openSocket(mgr);
    await p;
    expect(mgr.getState()).toBe('connected');

    ws.onclose({ code: 1006, reason: '' });

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(0);
    expect(fakeWebSockets.length).toBe(2);
    expect(mgr.getState()).toBe('connecting');
    mgr.disconnect();
  });

  it('schedules a single reconnect when both error and close fire for the same socket', async () => {
    const mgr = new SignallingManager(['wss://s1.test/ws']);
    const p = mgr.connect().catch(() => {});
    const ws = await openSocket(mgr);
    await p;

    ws.onerror(new Error('network down'));
    ws.onclose({ code: 1006, reason: '' });

    await vi.advanceTimersByTimeAsync(1500);
    await vi.advanceTimersByTimeAsync(0);
    expect(fakeWebSockets.length).toBe(2);
    mgr.disconnect();
  });

  it('backs off exponentially for repeated transient failures', async () => {
    const mgr = new SignallingManager(['wss://s1.test/ws']);
    const p = mgr.connect().catch(() => {});
    const ws = await openSocket(mgr);
    await p;

    ws.onclose({ code: 1006, reason: '' });
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(0);
    fakeWebSockets[1].onerror(new Error('down'));

    await vi.advanceTimersByTimeAsync(1000);
    expect(fakeWebSockets.length).toBe(2);

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(0);
    expect(fakeWebSockets.length).toBe(3);
    expect(mgr.getState()).toBe('connecting');
    mgr.disconnect();
  });
});
