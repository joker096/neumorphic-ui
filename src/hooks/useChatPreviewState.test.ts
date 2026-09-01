import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatPreviewState } from './useChatPreviewState';
import { useAppStore } from '../store';
import { queueMessage, getPendingMessages, markMessageSent } from '../lib/messageQueue';

vi.mock('../lib/messageQueue', () => ({
  queueMessage: vi.fn().mockResolvedValue('queued-id'),
  getPendingMessages: vi.fn().mockResolvedValue([]),
  markMessageSent: vi.fn().mockResolvedValue(undefined),
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
    vi.mocked(getPendingMessages).mockResolvedValue([]);
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

  it('marks the message sent when online', () => {
    const onUpdateChat = vi.fn();
    const { result } = renderHook(() =>
      useChatPreviewState(dmChat, onUpdateChat, undefined, [], undefined, true, true, 'online hello', vi.fn())
    );

    act(() => result.current.sendMessage());

    expect(queueMessage).toHaveBeenCalledWith(expect.objectContaining({ chatId: 'dm-2', status: 'sent' }));
    expect(onUpdateChat.mock.calls[0][0].history.at(-1).status).toBe('sent');
  });

  it('flushes queued messages to sent when the network returns', async () => {
    vi.mocked(getPendingMessages).mockResolvedValueOnce([{ id: 'q1' }]);
    const queuedChat = {
      id: 'dm-2',
      name: 'Bob',
      history: [{ id: 1, sender: 'me', text: 'offline hello', time: '10:00', status: 'queued' }],
    };
    const onUpdateChat = vi.fn();
    renderHook(() => useChatPreviewState(queuedChat, onUpdateChat, undefined, [], undefined, true, true, '', vi.fn()));

    await act(async () => {
      await vi.waitFor(() => expect(onUpdateChat).toHaveBeenCalled());
    });

    expect(markMessageSent).toHaveBeenCalledWith('q1');
    expect(onUpdateChat.mock.calls[0][0].history[0].status).toBe('sent');
  });

  it('keeps the queue while offline', async () => {
    setOnLine(false);
    vi.mocked(getPendingMessages).mockResolvedValueOnce([{ id: 'q1' }]);
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

    expect(markMessageSent).not.toHaveBeenCalled();
  });
});
