import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WsTunnel, createWsTunnel } from './wsTunnel';

describe('WsTunnel v2', () => {
  it('should create tunnel with direct backend', () => {
    const tunnel = createWsTunnel('wss://example.com/ws', 'direct');
    expect(tunnel).toBeDefined();
    expect(tunnel.getBackend()).toBe('direct');
  });

  it('should create tunnel with cfworker backend', () => {
    const tunnel = createWsTunnel('https://worker.example.com/ws', 'cfworker');
    expect(tunnel.getBackend()).toBe('cfworker');
  });

  it('should format CF Worker URL correctly', () => {
    const tunnel = createWsTunnel('https://my-worker.example.workers.dev/ws', 'cfworker');
    const formatted = tunnel.formatRelayUrl('my-worker.example.workers.dev');
    expect(formatted).toContain('wss://my-worker.example.workers.dev/ws');
  });
});

describe('WsTunnel heartbeat', () => {
  const fakeWebSockets: any[] = [];

  class FakeWebSocket {
    static OPEN = 1;
    static CONNECTING = 0;
    url: string;
    readyState = FakeWebSocket.CONNECTING;
    send: ReturnType<typeof vi.fn> | undefined;
    close: ReturnType<typeof vi.fn> | undefined;
    onopen: (() => void) | null = null;
    onmessage: ((event: { data: string }) => void) | null = null;
    onclose: ((event?: { code?: number; reason?: string }) => void) | null = null;
    onerror: ((err: Error) => void) | null = null;

    constructor(url: string) {
      this.url = url;
      this.send = vi.fn();
      this.close = vi.fn();
      fakeWebSockets.push(this);
    }
  }

  beforeEach(() => {
    fakeWebSockets.length = 0;
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', FakeWebSocket);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline in tests')));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function openTunnel(): Promise<{ tunnel: WsTunnel; ws: any }> {
    const tunnel = createWsTunnel('wss://example.com/ws', 'direct');
    const p = tunnel.connect();
    for (let i = 0; i < 3 && fakeWebSockets.length === 0; i += 1) {
      await vi.advanceTimersByTimeAsync(0);
    }
    const ws = fakeWebSockets[0];
    ws.readyState = FakeWebSocket.OPEN;
    ws.onopen();
    await p;
    return { tunnel, ws };
  }

  it('sends pings every 30s while pong responses keep the tunnel alive', async () => {
    const { tunnel, ws } = await openTunnel();

    await vi.advanceTimersByTimeAsync(30000);
    expect(ws.send).toHaveBeenCalledTimes(1);
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: 'ping' }));

    ws.onmessage({ data: JSON.stringify({ type: 'pong' }) });
    await vi.advanceTimersByTimeAsync(30000);
    expect(ws.send).toHaveBeenCalledTimes(2);

    ws.onmessage({ data: JSON.stringify({ type: 'pong' }) });
    await vi.advanceTimersByTimeAsync(30000);
    expect(ws.send).toHaveBeenCalledTimes(3);

    tunnel.close();
  });

  it('swallows pong frames and does not dispatch them to app handlers', async () => {
    const { tunnel, ws } = await openTunnel();
    const onMessage = vi.fn();
    tunnel.onMessage(onMessage);

    ws.onmessage({ data: JSON.stringify({ type: 'pong' }) });

    expect(onMessage).not.toHaveBeenCalled();
    tunnel.close();
  });

  it('closes the socket when no pong arrives within the heartbeat window', async () => {
    const { tunnel, ws } = await openTunnel();

    await vi.advanceTimersByTimeAsync(30000);
    expect(ws.send).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(30000);
    expect(ws.close).toHaveBeenCalledTimes(1);

    tunnel.close();
  });

  it('hands the server close code/reason to onClose handlers and keeps it for inspection', async () => {
    const { tunnel, ws } = await openTunnel();
    const onClose = vi.fn();
    tunnel.onClose(onClose);

    ws.onclose({ code: 1008, reason: 'Too many connections' });

    expect(onClose).toHaveBeenCalledWith({ code: 1008, reason: 'Too many connections' });
    expect(tunnel.getLastClose()).toEqual({ code: 1008, reason: 'Too many connections' });
    tunnel.close();
  });

  it('stores a close frame even when no onClose handler is registered yet', async () => {
    const { tunnel, ws } = await openTunnel();

    ws.onclose({ code: 1006, reason: '' });

    expect(tunnel.getLastClose()).toEqual({ code: 1006, reason: '' });
    tunnel.close();
  });

  it('normalises an abrupt (no-frame) close to code 1006', async () => {
    const { tunnel, ws } = await openTunnel();
    const onClose = vi.fn();
    tunnel.onClose(onClose);

    ws.onclose();

    expect(onClose).toHaveBeenCalledWith({ code: 1006, reason: '' });
    tunnel.close();
  });
});
