import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatPreviewState } from './useChatPreviewState';
import { useAppStore } from '../store';
import { queueMessage } from '../lib/messageQueue';
import { p2pNetwork } from '../lib/p2p/network';
import { parseChatReadReceipt } from '../lib/p2p/chatFrame';

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

    expect(queueMessage).toHaveBeenCalledWith(expect.objectContaining({ chatId: 'dm-2', status: 'queued' }));
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

  it('sends the read receipt once the tab becomes visible again', () => {
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
