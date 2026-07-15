import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatMessages } from './useChatMessages';

describe('useChatMessages', () => {
  const activeChat = { id: 'chat-1', name: 'Test', history: [] };
  let setActiveChat: (...args: any[]) => any;

  beforeEach(() => {
    setActiveChat = vi.fn();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useChatMessages(activeChat, setActiveChat));
    expect(result.current.messageText).toBe('');
    expect(result.current.morseMode).toBe(false);
    expect(result.current.silentMode).toBe(false);
    expect(result.current.replyTarget).toBeNull();
  });

  it('should send a text message', () => {
    const { result } = renderHook(() => useChatMessages(activeChat, setActiveChat));

    act(() => { result.current.setMessageText('Hello world'); });
    act(() => { result.current.handleSendMessage(); });

    expect(setActiveChat).toHaveBeenCalled();
    expect(result.current.messageText).toBe('');
    expect(result.current.replyTarget).toBeNull();
  });

  it('should not send empty message', () => {
    const { result } = renderHook(() => useChatMessages(activeChat, setActiveChat));
    act(() => { result.current.handleSendMessage(); });
    expect(setActiveChat).not.toHaveBeenCalled();
  });

  it('should not send without active chat', () => {
    const { result } = renderHook(() => useChatMessages(null, setActiveChat));
    act(() => { result.current.setMessageText('text'); });
    act(() => { result.current.handleSendMessage(); });
    expect(setActiveChat).not.toHaveBeenCalled();
  });

  it('should send a voice message', () => {
    const { result } = renderHook(() => useChatMessages(activeChat, setActiveChat));

    act(() => { result.current.sendVoiceMessage('https://audio.url', '1:30'); });

    expect(setActiveChat).toHaveBeenCalled();
  });

  it('should not send voice message without active chat', () => {
    const { result } = renderHook(() => useChatMessages(null, setActiveChat));
    act(() => { result.current.sendVoiceMessage('url', '0:30'); });
    expect(setActiveChat).not.toHaveBeenCalled();
  });

  it('should send a sticker message', () => {
    const { result } = renderHook(() => useChatMessages(activeChat, setActiveChat));

    act(() => { result.current.sendStickerMessage('🚀'); });

    expect(setActiveChat).toHaveBeenCalled();
  });

  it('should toggle saved messages', () => {
    const { result } = renderHook(() => useChatMessages(activeChat, setActiveChat));
    const chat = { id: 'chat-1', name: 'Test' };
    const msg = { id: 1, text: 'Saved' };

    act(() => { result.current.toggleSavedMessage(chat, msg); });
    expect(result.current.savedMessages.length).toBe(1);
    expect(result.current.savedMessages[0].messageId).toBe(1);

    act(() => { result.current.toggleSavedMessage(chat, msg); });
    expect(result.current.savedMessages.length).toBe(0);
  });

  it('should update messageText state', () => {
    const { result } = renderHook(() => useChatMessages(activeChat, setActiveChat));

    act(() => { result.current.setMessageText('New text'); });
    expect(result.current.messageText).toBe('New text');
  });

  it('should reset morse and silent mode after send', () => {
    const { result } = renderHook(() => useChatMessages(activeChat, setActiveChat));

    act(() => {
      result.current.setMorseMode(true);
      result.current.setSilentMode(true);
      result.current.setMessageText('Test');
    });
    act(() => { result.current.handleSendMessage(); });

    expect(result.current.morseMode).toBe(false);
    expect(result.current.silentMode).toBe(false);
  });
});
