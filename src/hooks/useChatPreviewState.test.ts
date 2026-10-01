import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatPreviewState } from './useChatPreviewState';
import { useAppStore } from '../store';
import { queueMessage } from '../lib/messageQueue';
import { p2pNetwork } from '../lib/p2p/network';
import { parseChatReadReceipt, parseChatLocation, parseChatArticle } from '../lib/p2p/chatFrame';
import { MINUTE_MS } from '../constants/time';

vi.mock('../lib/p2p/network', () => {
  const broadcast = vi.fn().mockResolvedValue(undefined);
  return {
    p2pNetwork: {
      broadcast,
      sendAddressed: vi.fn(async (_target: unknown, data: unknown) => { await broadcast(data); return false; }),
      peerForChat: vi.fn().mockReturnValue(undefined),
      peerForChatName: vi.fn().mockReturnValue(undefined),
    },
  };
});

vi.mock('../lib/messageQueue', () => ({
  queueMessage: vi.fn().mockResolvedValue('queued-id'),
}));

function setOnLine(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true, writable: true });
}

const channel = {
  id: 'chan-1',
  name: 'Tech Insights',
  isChannel: true,
  ownerId: 'owner-1',
  history: [{ id: 1, sender: 'them', text: 'first', time: '10:00', status: 'sent' }],
  postCount: 1,
};

describe('useChatPreviewState (channel posts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ channels: [JSON.parse(JSON.stringify(channel))] });
  });

  it('persists a channel post to the store and increments postCount', () => {
    const onUpdateChat = vi.fn();
    const { result } = renderHook(() =>
      useChatPreviewState(channel, onUpdateChat, undefined, [], undefined, true, true, 'New post', vi.fn())
    );

    act(() => result.current.sendMessage());

    expect(onUpdateChat).toHaveBeenCalledTimes(1);
    const updated = onUpdateChat.mock.calls[0][0];
    expect(updated.history.length).toBe(2);
    expect(updated.postCount).toBe(2);

    const stored = useAppStore.getState().channels.find((c: any) => c.id === 'chan-1');
    expect(stored.postCount).toBe(2);
    expect(stored.history.length).toBe(2);
  });

  it('does not change postCount for a non-channel chat', () => {
    const onUpdateChat = vi.fn();
    const directChat = { id: 'dm-1', name: 'Bob', history: [], postCount: 0 };
    const { result } = renderHook(() =>
      useChatPreviewState(directChat, onUpdateChat, undefined, [], undefined, true, true, 'hi', vi.fn())
    );

    act(() => result.current.sendMessage());

    const stored = useAppStore.getState().channels.find((c: any) => c.id === 'chan-1');
    expect(stored.postCount).toBe(1);
  });
});

describe('useChatPreviewState (offline-first queue)', () => {
  const dmChat = { id: 'dm-2', name: 'Bob', history: [] };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setOnLine(true);
  });

  it('marks the message queued and stores it when offline', () => {
    setOnLine(false);
    const onUpdateChat = vi.fn();
    const { result } = renderHook(() =>
      useChatPreviewState(dmChat, onUpdateChat, undefined, [], undefined, true, true, 'offline hello', vi.fn())
    );

    act(() => result.current.sendMessage());

    expect(queueMessage).toHaveBeenCalledWith(expect.objectContaining({ chatId: 'dm-2', status: 'queued' }));
    expect(onUpdateChat.mock.calls[0][0].history.at(-1).status).toBe('queued');
  });

  it('marks the message sent after the P2P broadcast succeeds', async () => {
    const onUpdateChat = vi.fn();
    const { result } = renderHook(() =>
      useChatPreviewState(dmChat, onUpdateChat, undefined, [], undefined, true, true, 'online hello', vi.fn())
    );

    await act(async () => { result.current.sendMessage(); });

    expect(queueMessage).toHaveBeenCalledWith(expect.objectContaining({ chatId: 'dm-2', status: 'sent' }));
    await waitFor(() => expect(onUpdateChat.mock.calls.at(-1)?.[0].history.at(-1).status).toBe('sent'));
  });

  it('keeps queued messages pending until a transport confirms delivery', async () => {
    const queuedChat = {
      id: 'dm-2',
      name: 'Bob',
      history: [{ id: 1, sender: 'me', text: 'offline hello', time: '10:00', status: 'queued' }],
    };
    const onUpdateChat = vi.fn();
    renderHook(() => useChatPreviewState(queuedChat, onUpdateChat, undefined, [], undefined, true, true, '', vi.fn()));

    await act(async () => { await Promise.resolve(); });

    expect(onUpdateChat).not.toHaveBeenCalled();
  });

  it('keeps the queue while offline', async () => {
    setOnLine(false);
    renderHook(() =>
      useChatPreviewState(
        { id: 'dm-2', name: 'Bob', history: [{ id: 1, sender: 'me', text: 'x', time: '10:00', status: 'queued' }] },
        vi.fn(), undefined, [], undefined, true, true, '', vi.fn()
      )
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

  });
});

describe('useChatPreviewState (real-P2P status gates)', () => {
  const msg = { id: 1, sender: 'me', text: 'hello', time: '10:00', status: 'failed' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('simulates delivered for non-wire chats after retry', async () => {
    setOnLine(true);
    const chat = { id: 'dm-1', name: 'Bob', history: [{ ...msg }] };
    const onUpdateChat = vi.fn();
    const { result } = renderHook(() =>
      useChatPreviewState(chat, onUpdateChat, undefined, [], undefined, true, true, '', vi.fn())
    );

    act(() => result.current.retryFailedMessage({ ...msg }));

    await waitFor(() => expect(onUpdateChat.mock.calls.at(-1)?.[0].history.at(-1).status).toBe('delivered'), { timeout: 2500 });
  });

  it('does not simulate delivered for wire chats', async () => {
    setOnLine(true);
    vi.mocked(p2pNetwork.peerForChat).mockReturnValue({} as any);
    const chat = { id: 'wire-1', name: 'Bob', history: [{ ...msg }] };
    const onUpdateChat = vi.fn();
    const { result } = renderHook(() =>
      useChatPreviewState(chat, onUpdateChat, undefined, [], undefined, true, true, '', vi.fn())
    );

    act(() => result.current.retryFailedMessage({ ...msg }));

    await waitFor(() => expect(onUpdateChat.mock.calls.at(-1)?.[0].history.at(-1).status).toBe('sent'));
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 1200)); });
    const statuses = onUpdateChat.mock.calls.map((call: any) => call[0].history.at(-1).status);
    expect(statuses).not.toContain('delivered');
  });
});

describe('useChatPreviewState (read receipts)', () => {
  const incomingChat = {
    id: 'dm-4',
    name: 'Bob',
    isChannel: false,
    history: [{ id: 9, sender: 'them', text: 'hi', time: '10:00', status: 'sent' }],
  };

  function setTabVisible(visible: boolean) {
    Object.defineProperty(document, 'visibilityState', {
      value: visible ? 'visible' : 'hidden',
      configurable: true,
    });
  }

  function readReceiptFrames() {
    return vi.mocked(p2pNetwork.sendAddressed).mock.calls
      .map((call: any) => call[1])
      .filter((payload: unknown) => typeof payload === 'string' && parseChatReadReceipt(payload) !== null);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    setTabVisible(true);
  });

  afterEach(() => {
    setTabVisible(true);
  });

  it('sends a read receipt for the last incoming message when the tab is visible', () => {
    renderHook(() =>
      useChatPreviewState(incomingChat, vi.fn(), undefined, [], undefined, true, true, '', vi.fn())
    );

    expect(readReceiptFrames()).toHaveLength(1);
  });

  it('does not send a read receipt while the tab is hidden', () => {
    setTabVisible(false);
    renderHook(() =>
      useChatPreviewState(incomingChat, vi.fn(), undefined, [], undefined, true, true, '', vi.fn())
    );

    expect(readReceiptFrames()).toHaveLength(0);
  });

  it('sends a read receipt once the tab becomes visible again', () => {
    setTabVisible(false);
    renderHook(() =>
      useChatPreviewState(incomingChat, vi.fn(), undefined, [], undefined, true, true, '', vi.fn())
    );
    expect(readReceiptFrames()).toHaveLength(0);

    act(() => {
      setTabVisible(true);
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(readReceiptFrames()).toHaveLength(1);
  });
});

describe('useChatPreviewState (self-destruct coverage)', () => {
  const geoChat = { id: 'dm-3', name: 'Bob', history: [] };

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ selfDestructDefault: '1 min' });
  });

  afterEach(() => {
    useAppStore.setState({ selfDestructDefault: undefined });
  });

  it('stamps and announces a TTL for geo and article messages, not just text', async () => {
    const onUpdateChat = vi.fn();
    const { result } = renderHook(() =>
      useChatPreviewState(geoChat, onUpdateChat, undefined, [], undefined, true, true, '', vi.fn())
    );

    act(() => result.current.sendGeoMessage(52.37, 4.89));
    await act(async () => { result.current.sendArticleMessage('https://example.com', 'Example'); });

    const frames = vi.mocked(p2pNetwork.broadcast).mock.calls.map((c) => String(c[0]));
    const geo = parseChatLocation(frames.find((f) => f.includes('chat-location'))!);
    const article = parseChatArticle(frames.find((f) => f.includes('chat-article'))!);

    expect(geo!.ttlMs).toBeGreaterThan(0);
    expect(article!.ttlMs).toBeGreaterThan(0);
    for (const ttl of [geo!.ttlMs, article!.ttlMs]) {
      expect(ttl!).toBeLessThanOrEqual(MINUTE_MS);
    }
    // Each send path reports its own stamped message (the hook builds history
    // from the chat prop, which the caller re-renders with).
    for (const call of onUpdateChat.mock.calls) {
      expect(call[0].history.at(-1).selfDestructAt).toBeGreaterThan(Date.now());
    }
  });

  it('leaves TTLs off when no timer is configured', () => {
    useAppStore.setState({ selfDestructDefault: undefined });
    const onUpdateChat = vi.fn();
    const { result } = renderHook(() =>
      useChatPreviewState(geoChat, onUpdateChat, undefined, [], undefined, true, true, '', vi.fn())
    );

    act(() => result.current.sendGeoMessage(52.37, 4.89));

    const frames = vi.mocked(p2pNetwork.broadcast).mock.calls.map((c) => String(c[0]));
    expect(parseChatLocation(frames.find((f) => f.includes('chat-location'))!)!.ttlMs).toBeUndefined();
    expect(onUpdateChat.mock.calls[0][0].history.at(-1).selfDestructAt).toBeUndefined();
  });
});

describe('useChatPreviewState (live location share)', () => {
  const dmChat = { id: 'dm-3', name: 'Bob', history: [] };
  let startOpts: any;

  const installGeo = (): { push: (lat: number, lng: number) => void } => {
    let watchCb: any;
    (globalThis as any).navigator.geolocation = {
      clearWatch: vi.fn(),
      getCurrentPosition: vi.fn((ok: any) => ok({ coords: { latitude: 52.37, longitude: 4.89, accuracy: 5 } })),
      watchPosition: vi.fn((cb: any) => { watchCb = cb; return 1; }),
    };
    (useAppStore as any).setState({
      startLiveLocation: vi.fn((opts: any) => { startOpts = opts; opts.onUpdate(firstShare(opts.approximate)); }),
      stopLiveLocation: vi.fn(),
      userProfile: { id: 'u1', name: 'Ann' },
    });
    return { push: (lat: number, lng: number) => watchCb?.({ coords: { latitude: lat, longitude: lng, accuracy: 5 } }) };
  };

  // Mirrors the real slice: the caller's `approximate` flag lands on the share.
  const firstShare = (approximate = true) => ({
    id: 'live_dm-3_1000', chatId: 'dm-3', userId: 'u1', senderName: 'Ann',
    latitude: 52.37, longitude: 4.89, accuracy: 5,
    timestamp: 1000, expiresAt: 1000 + 60_000, isLive: true, approximate,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    startOpts = null;
  });

  const sentLocationFrames = () => vi.mocked(p2pNetwork.broadcast).mock.calls
    .map((c) => parseChatLocation(String(c[0])))
    .filter((f): f is NonNullable<typeof f> => !!f);

  it('blurs an approximate share on the wire, not just locally', () => {
    installGeo();
    const { result } = renderHook(() =>
      useChatPreviewState(dmChat, vi.fn(), undefined, [], undefined, true, true, '', vi.fn())
    );

    act(() => result.current.startLiveLocationShare({ approximate: true }));
    startOpts.onUpdate(firstShare());

    const frame = sentLocationFrames()[0];
    expect(frame?.approximate).toBe(true);
    // 100m of blur at this latitude is ~0.0009 deg; a raw position would be exact.
    expect(frame?.lat).not.toBeCloseTo(52.37, 5);
  });

  it('reuses one messageId across the whole stream', () => {
    const geo = installGeo();
    const { result } = renderHook(() =>
      useChatPreviewState(dmChat, vi.fn(), undefined, [], undefined, true, true, '', vi.fn())
    );

    act(() => result.current.startLiveLocationShare({ approximate: false }));
    geo.push(52.38, 4.90);
    startOpts.onEnd({ ...firstShare(), latitude: 52.38, longitude: 4.9, isLive: false });

    const ids = new Set(sentLocationFrames().map((f) => f!.messageId));
    expect(ids.size).toBe(1);
  });

  it('closes the share with a final non-live frame on stop', () => {
    const geo = installGeo();
    const { result } = renderHook(() =>
      useChatPreviewState(dmChat, vi.fn(), undefined, [], undefined, true, true, '', vi.fn())
    );

    act(() => result.current.startLiveLocationShare({ approximate: false }));
    startOpts.onEnd({ ...firstShare(), isLive: false });

    const frames = sentLocationFrames();
    expect(frames.at(-1)?.live).toBe(false);
  });

  // The old-client gap. A peer that never sees the closing frame — closed tab,
  // dropped connection — has no signal that the share ended, and a static pin
  // carrying no deadline is a bubble nothing on its side can ever expire. Every
  // frame of the stream therefore ships the absolute deadline, the closing one
  // included; a legacy client ignores the field it does not know.
  it('carries the deadline on the closing frame, not just the live ones', () => {
    installGeo();
    let applied: any = { id: 'dm-3', history: [] };
    const onUpdateChat = vi.fn((updater: any) => {
      applied = typeof updater === 'function' ? updater(applied) : updater;
    });
    const { result } = renderHook(() =>
      useChatPreviewState(dmChat, onUpdateChat, undefined, [], undefined, true, true, '', vi.fn())
    );

    act(() => result.current.startLiveLocationShare({ approximate: false }));
    startOpts.onUpdate(firstShare(false));
    startOpts.onEnd({ ...firstShare(), isLive: false });

    const deadline = firstShare().expiresAt;
    for (const frame of sentLocationFrames()) {
      expect(frame!.expiresAt).toBe(deadline);
    }
    // The local bubble keeps it too, so sender and wire agree on the deadline.
    expect(applied.history[0].expiresAt).toBe(deadline);
  });

  // The share outlives many messages. Writing back the `chat` captured when the
  // share started would restore that snapshot and drop everything sent since.
  it('patches the live bubble without clobbering newer messages', () => {
    installGeo();
    let applied: any = { id: 'dm-3', history: [] };
    const onUpdateChat = vi.fn((updater: any) => {
      applied = typeof updater === 'function' ? updater(applied) : updater;
    });
    const { result } = renderHook(() =>
      useChatPreviewState(dmChat, onUpdateChat, undefined, [], undefined, true, true, '', vi.fn())
    );

    act(() => result.current.startLiveLocationShare({ approximate: false }));
    // A text message lands while the share is streaming.
    applied = { ...applied, history: [...applied.history, { id: 'later-1', type: 'text', text: 'hi' }] };
    startOpts.onUpdate(firstShare(false));
    startOpts.onUpdate({ ...firstShare(false), latitude: 52.40, longitude: 4.95, timestamp: 2000 });

    const ids = applied.history.map((m: any) => m.id);
    expect(ids).toEqual(['live_dm-3_1000', 'later-1']);
    const bubble = applied.history[0];
    expect(bubble.lat).toBeCloseTo(52.40, 5);
    expect(bubble.ts).toBe(1000);
  });
});
