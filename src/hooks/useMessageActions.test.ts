import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessageActions } from './useMessageActions';
import { queueMessage } from '../lib/messageQueue';
import { persistVoiceBlob } from '../lib/voiceStore';

vi.mock('../lib/voiceStore', () => ({
  persistVoiceBlob: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/messageQueue', () => ({
  queueMessage: vi.fn().mockResolvedValue('queued-id'),
  getPendingMessages: vi.fn().mockResolvedValue([]),
  markMessageSent: vi.fn().mockResolvedValue(undefined),
  retryMessage: vi.fn().mockResolvedValue(undefined),
  removeQueuedMessage: vi.fn().mockResolvedValue(undefined),
  pruneExpiredQueuedMessages: vi.fn().mockResolvedValue(0),
  MAX_QUEUE_RETRIES: 5,
}));

vi.mock('../lib/p2p/network', () => {
  const broadcast = vi.fn().mockResolvedValue(undefined);
  return {
    p2pNetwork: {
      broadcast,
      sendAddressed: vi.fn(async (_target: unknown, data: unknown) => { await broadcast(data); return false; }),
      peerForChat: () => undefined,
      peerForChatName: () => undefined,
    },
  };
});

function setOnLine(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true, writable: true });
}

function setup(activeChat: any, messageText: string) {
  const state = {
    chats: [JSON.parse(JSON.stringify(activeChat))],
    activeChat: JSON.parse(JSON.stringify(activeChat)),
    messageText,
  };
  const scheduledQueue = { addMessage: vi.fn() };
  const setters = {
    setChats: (updater: any) => { state.chats = typeof updater === 'function' ? updater(state.chats) : updater; },
    setActiveChat: (updater: any) => { state.activeChat = typeof updater === 'function' ? updater(state.activeChat) : updater; },
    setMessageText: (v: string) => { state.messageText = v; },
    setScheduleDateTime: vi.fn(),
    setSilentMode: vi.fn(),
    setReplyTarget: vi.fn(),
    setDraftTextByChat: vi.fn(),
    setShowStickerPicker: vi.fn(),
    setSavedMessages: vi.fn(),
  };
  const { result } = renderHook(() => useMessageActions(
    state.activeChat,
    state.messageText,
    scheduledQueue,
    null,
    false,
    [],
    false,
    '',
    setters.setChats,
    setters.setActiveChat,
    setters.setMessageText,
    setters.setScheduleDateTime,
    setters.setSilentMode,
    setters.setReplyTarget,
    setters.setDraftTextByChat,
    setters.setShowStickerPicker,
    setters.setSavedMessages,
  ));
  return { state, result };
}

describe('useMessageActions (offline-first queue)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setOnLine(true);
  });

  it('marks the message queued and stores it when offline', () => {
    setOnLine(false);
    const { state, result } = setup({ id: 'dm-1', name: 'Bob', history: [] }, 'offline hello');

    act(() => result.current.handleSendMessage());

    expect(queueMessage).toHaveBeenCalledWith(expect.objectContaining({ chatId: 'dm-1', status: 'queued' }));
    expect(state.chats[0].history.at(-1).status).toBe('queued');
    expect(state.activeChat.history.at(-1).status).toBe('queued');
  });

  it('marks the message sent after the P2P broadcast succeeds', async () => {
    const { state, result } = setup({ id: 'dm-1', name: 'Bob', history: [] }, 'online hello');

    await act(async () => { result.current.handleSendMessage(); });

    expect(queueMessage).toHaveBeenCalledWith(expect.objectContaining({ chatId: 'dm-1', status: 'sent' }));
    await waitFor(() => expect(state.chats[0].history.at(-1).status).toBe('sent'));
  });

  it('queues voice and sticker sends when offline and persists the live blob', () => {
    setOnLine(false);
    const { state, result } = setup({ id: 'dm-1', name: 'Bob', history: [] }, '');
    const liveBlob = new Blob(['voice-bytes'], { type: 'audio/webm' });

    act(() => result.current.sendVoiceMessage('blob:audio', '0:05', liveBlob));
    act(() => result.current.sendStickerMessage('sticker-1'));

    expect(queueMessage).toHaveBeenNthCalledWith(1, expect.objectContaining({ chatId: 'dm-1', status: 'queued', type: 'audio' }));
    expect(queueMessage).toHaveBeenNthCalledWith(2, expect.objectContaining({ chatId: 'dm-1', status: 'queued', type: 'sticker' }));
    expect(state.activeChat.history.at(-2).status).toBe('queued');
    expect(state.activeChat.history.at(-2).voiceId).toEqual(expect.any(String));
    expect(persistVoiceBlob).toHaveBeenCalledWith(state.activeChat.history.at(-2).voiceId, liveBlob);
    expect(state.activeChat.history.at(-1).status).toBe('queued');
  });

  it('keeps queued messages in the chat until a flush cycle processes them', async () => {
    const queuedChat = {
      id: 'dm-1',
      name: 'Bob',
      history: [{ id: 1, sender: 'me', text: 'offline hello', time: '10:00', status: 'queued' }],
    };
    const { state } = setup(queuedChat, '');

    await act(async () => { await Promise.resolve(); });

    expect(state.chats[0].history[0].status).toBe('queued');
    expect(state.activeChat.history[0].status).toBe('queued');
  });

  it('keeps the queue while offline', async () => {
    setOnLine(false);
    setup({ id: 'dm-1', name: 'Bob', history: [{ id: 1, sender: 'me', text: 'x', time: '10:00', status: 'queued' }] }, '');

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

  });

  it('flushes queued text and sticker over P2P on reconnect, keeps media queued', async () => {
    const { getPendingMessages, markMessageSent } = await import('../lib/messageQueue');
    const { p2pNetwork } = await import('../lib/p2p/network');
    const sendAddressed = vi.mocked(p2pNetwork.sendAddressed);

    vi.mocked(getPendingMessages).mockResolvedValue([]);
    setup({ id: 'dm-1', name: 'Bob', history: [] }, '');
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

    vi.mocked(getPendingMessages).mockResolvedValue([
      { id: 'q1', data: { text: 'hello', chatId: 'dm-1', chatName: 'Bob', status: 'queued' }, sent: false },
      { id: 'q2', data: { text: 'sticker-1', type: 'sticker', chatId: 'dm-1', chatName: 'Bob', status: 'queued' }, sent: false },
      { id: 'q3', data: { text: '', type: 'audio', audioUrl: 'blob:a', duration: '0:05', chatId: 'dm-1', chatName: 'Bob', status: 'queued' }, sent: false },
    ]);

    await act(async () => { window.dispatchEvent(new Event('online')); });

    await waitFor(() => expect(vi.mocked(markMessageSent)).toHaveBeenCalledTimes(2));
    expect(sendAddressed).toHaveBeenCalledTimes(2);
    expect(sendAddressed.mock.calls[0][1]).toContain('"text":"hello"');
    expect(sendAddressed.mock.calls[1][1]).toContain('"text":"sticker-1"');
    expect(sendAddressed.mock.calls.some((c) => String(c[1]).includes('audioUrl'))).toBe(false);
  });

  it('marks a failed flush item sent (best-effort) and continues the queue', async () => {
    const { getPendingMessages, markMessageSent, retryMessage, removeQueuedMessage } = await import('../lib/messageQueue');
    const { p2pNetwork } = await import('../lib/p2p/network');

    vi.mocked(getPendingMessages).mockResolvedValue([
      { id: 'q1', data: { id: 1, text: 'first', chatId: 'dm-1', chatName: 'Bob', status: 'queued' }, sent: false, retryCount: 0 },
      { id: 'q2', data: { id: 2, text: 'second', chatId: 'dm-1', chatName: 'Bob', status: 'queued' }, sent: false, retryCount: 0 },
    ]);

    let calls = 0;
    vi.mocked(p2pNetwork.sendAddressed).mockImplementation(async () => {
      calls += 1;
      if (calls === 1) throw new Error('temporary');
      return false;
    });

    const { state } = setup({
      id: 'dm-1',
      name: 'Bob',
      history: [
        { id: 1, sender: 'me', text: 'first', time: '10:00', status: 'queued' },
        { id: 2, sender: 'me', text: 'second', time: '10:00', status: 'queued' },
      ],
    }, '');

    await waitFor(() => expect(vi.mocked(markMessageSent)).toHaveBeenCalledTimes(2));
    expect(vi.mocked(markMessageSent)).toHaveBeenCalledWith('q1');
    expect(vi.mocked(markMessageSent)).toHaveBeenCalledWith('q2');
    expect(vi.mocked(retryMessage)).not.toHaveBeenCalled();
    expect(vi.mocked(removeQueuedMessage)).not.toHaveBeenCalled();
    expect(state.chats[0].history[0].status).toBe('queued');
    expect(state.chats[0].history[1].status).toBe('sent');
  });

  it('never evicts a failing message to failed state; marks it sent instead', async () => {
    const { getPendingMessages, markMessageSent, retryMessage, removeQueuedMessage } = await import('../lib/messageQueue');
    const { p2pNetwork } = await import('../lib/p2p/network');

    vi.mocked(getPendingMessages).mockResolvedValue([
      { id: 'q1', data: { id: 1, text: 'first', chatId: 'dm-1', chatName: 'Bob', status: 'queued' }, sent: false, retryCount: 99 },
    ]);
    vi.mocked(p2pNetwork.sendAddressed).mockImplementation(async () => {
      throw new Error('permanent');
    });

    const { state } = setup({
      id: 'dm-1',
      name: 'Bob',
      history: [{ id: 1, sender: 'me', text: 'first', time: '10:00', status: 'queued' }],
    }, '');

    await waitFor(() => expect(vi.mocked(markMessageSent)).toHaveBeenCalledWith('q1'));
    expect(vi.mocked(retryMessage)).not.toHaveBeenCalled();
    expect(vi.mocked(removeQueuedMessage)).not.toHaveBeenCalled();
    expect(state.chats[0].history[0].status).toBe('queued');
  });
});
