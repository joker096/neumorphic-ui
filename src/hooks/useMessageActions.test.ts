import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMessageActions } from './useMessageActions';
import { queueMessage, getPendingMessages, markMessageSent } from '../lib/messageQueue';

vi.mock('../lib/messageQueue', () => ({
  queueMessage: vi.fn().mockResolvedValue('queued-id'),
  getPendingMessages: vi.fn().mockResolvedValue([]),
  markMessageSent: vi.fn().mockResolvedValue(undefined),
}));

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
    vi.mocked(getPendingMessages).mockResolvedValue([]);
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

  it('marks the message sent when online', () => {
    const { state, result } = setup({ id: 'dm-1', name: 'Bob', history: [] }, 'online hello');

    act(() => result.current.handleSendMessage());

    expect(queueMessage).toHaveBeenCalledWith(expect.objectContaining({ chatId: 'dm-1', status: 'sent' }));
    expect(state.chats[0].history.at(-1).status).toBe('sent');
  });

  it('queues voice and sticker sends when offline', () => {
    setOnLine(false);
    const { state, result } = setup({ id: 'dm-1', name: 'Bob', history: [] }, '');

    act(() => result.current.sendVoiceMessage('blob:audio', '0:05'));
    act(() => result.current.sendStickerMessage('sticker-1'));

    expect(queueMessage).toHaveBeenNthCalledWith(1, expect.objectContaining({ chatId: 'dm-1', status: 'queued', type: 'audio' }));
    expect(queueMessage).toHaveBeenNthCalledWith(2, expect.objectContaining({ chatId: 'dm-1', status: 'queued', type: 'sticker' }));
    expect(state.activeChat.history.at(-2).status).toBe('queued');
    expect(state.activeChat.history.at(-1).status).toBe('queued');
  });

  it('flushes queued messages to sent when the network returns', async () => {
    vi.mocked(getPendingMessages).mockResolvedValueOnce([{ id: 'q1' }]);
    const queuedChat = {
      id: 'dm-1',
      name: 'Bob',
      history: [{ id: 1, sender: 'me', text: 'offline hello', time: '10:00', status: 'queued' }],
    };
    const { state } = setup(queuedChat, '');

    await act(async () => {
      await vi.waitFor(() => expect(markMessageSent).toHaveBeenCalledWith('q1'));
    });

    expect(getPendingMessages).toHaveBeenCalled();
    expect(state.chats[0].history[0].status).toBe('sent');
    expect(state.activeChat.history[0].status).toBe('sent');
  });

  it('keeps the queue while offline', async () => {
    setOnLine(false);
    vi.mocked(getPendingMessages).mockResolvedValueOnce([{ id: 'q1' }]);
    setup({ id: 'dm-1', name: 'Bob', history: [{ id: 1, sender: 'me', text: 'x', time: '10:00', status: 'queued' }] }, '');

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(markMessageSent).not.toHaveBeenCalled();
  });
});
