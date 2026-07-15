import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockSetChats = vi.fn();
const mockScheduledQueue = {
  messages: [],
  addMessage: vi.fn(),
  removeMessage: vi.fn(),
};

vi.mock('../store', () => ({
  useAppStore: (selector: any) => selector({
    chats: [],
    setChats: mockSetChats,
    scheduledQueue: mockScheduledQueue,
  }),
}));

vi.mock('../components/chat-preview/MorseDecoder', () => ({
  encodeMorse: vi.fn((s: string) => s.split('').join(' ')),
}));

vi.mock('../constants', () => ({
  isDNDEnabled: vi.fn(() => false),
  isPriorityContact: vi.fn(() => false),
  parseMentions: vi.fn((text: string) => ({ text, mentions: [] })),
}));

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

vi.mock('../constants/storage', () => ({
  STORAGE_KEYS: {
    DRAFTS: 'mess_drafts',
    SAVED_MESSAGES: 'mess_saved',
  },
}));

describe('useChatInteraction', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should have initial state', async () => {
    const { useChatInteraction } = await import('./useChatInteraction');
    const { result } = renderHook(() => useChatInteraction());

    expect(result.current.messageText).toBe('');
    expect(result.current.morseMode).toBe(false);
    expect(result.current.silentMode).toBe(false);
    expect(result.current.replyTarget).toBeNull();
    expect(result.current.chatSearchQuery).toBe('');
    expect(result.current.savedMessages).toEqual([]);
  });

  it('should update message text', async () => {
    const { useChatInteraction } = await import('./useChatInteraction');
    const { result } = renderHook(() => useChatInteraction());

    act(() => { result.current.setMessageText('Hello'); });
    expect(result.current.messageText).toBe('Hello');
  });

  it('should toggle morse mode', async () => {
    const { useChatInteraction } = await import('./useChatInteraction');
    const { result } = renderHook(() => useChatInteraction());

    act(() => { result.current.setMorseMode(true); });
    expect(result.current.morseMode).toBe(true);
  });

  it('should toggle silent mode', async () => {
    const { useChatInteraction } = await import('./useChatInteraction');
    const { result } = renderHook(() => useChatInteraction());

    act(() => { result.current.setSilentMode(true); });
    expect(result.current.silentMode).toBe(true);
  });

  it('should handle reply target', async () => {
    const { useChatInteraction } = await import('./useChatInteraction');
    const { result } = renderHook(() => useChatInteraction());
    const reply = { id: 1, sender: 'Alice', text: 'Original' };

    act(() => { result.current.setReplyTarget(reply); });
    expect(result.current.replyTarget).toEqual(reply);

    act(() => { result.current.setReplyTarget(null); });
    expect(result.current.replyTarget).toBeNull();
  });

  it('should handle send message', async () => {
    const { useChatInteraction } = await import('./useChatInteraction');
    const { result } = renderHook(() => useChatInteraction());
    const activeChat = { id: 'chat-1', name: 'Test' };
    const setActiveChat = vi.fn();

    act(() => {
      result.current.setMessageText('Hello');
    });

    act(() => {
      result.current.handleSendMessage(activeChat, null, 'Hello', false, '', false, mockSetChats, setActiveChat);
    });

    expect(mockSetChats).toHaveBeenCalled();
    expect(result.current.messageText).toBe('');
  });

  it('should not send empty message', async () => {
    const { useChatInteraction } = await import('./useChatInteraction');
    const { result } = renderHook(() => useChatInteraction());
    const setActiveChat = vi.fn();

    result.current.handleSendMessage({ id: 'chat-1' }, null, '', false, '', false, mockSetChats, setActiveChat);
    expect(mockSetChats).not.toHaveBeenCalled();
  });

  it('should toggle saved messages', async () => {
    const { useChatInteraction } = await import('./useChatInteraction');
    const { result } = renderHook(() => useChatInteraction());
    const chat = { id: 'chat-1', name: 'Chat' };
    const msg = { id: 1, text: 'Save me', type: 'text' };

    act(() => { result.current.toggleSavedMessage(chat, msg); });
    expect(result.current.savedMessages).toHaveLength(1);
    expect(result.current.savedMessages[0].chatId).toBe('chat-1');

    act(() => { result.current.toggleSavedMessage(chat, msg); });
    expect(result.current.savedMessages).toHaveLength(0);
  });

  it('should persist drafts to localStorage', async () => {
    const { useChatInteraction } = await import('./useChatInteraction');
    const { result } = renderHook(() => useChatInteraction());

    act(() => {
      result.current.setDraftTextByChat({ 'chat-1': 'draft message' });
    });

    const stored = JSON.parse(localStorage.getItem('mess_drafts') || '{}');
    expect(stored['chat-1']).toBe('draft message');
  });
});
