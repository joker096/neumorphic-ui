import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const wire = vi.hoisted(() => ({
  updateMessageStatus: vi.fn(),
  sendTextOverP2P: vi.fn(async (_bubble: any, _chat: any) => {}),
}));
const queueOffline = vi.hoisted(() => vi.fn());

vi.mock('./useMessageWire', () => ({
  useMessageWire: () => ({
    updateMessageStatus: wire.updateMessageStatus,
    sendTextOverP2P: wire.sendTextOverP2P,
  }),
}));
vi.mock('./useOfflineQueue', () => ({ useOfflineQueue: () => queueOffline }));

import { useAppStore } from '../store';
import { useScheduledMessages } from './useScheduledMessages';

const scheduled = (over: any = {}) => ({ id: 'sched-1', chatId: 'c1', text: 'Later', scheduledAt: Date.now() - 1000, ...over });

beforeEach(() => {
  vi.useFakeTimers();
  wire.updateMessageStatus.mockClear();
  wire.sendTextOverP2P.mockClear();
  queueOffline.mockClear();
  const q = useAppStore.getState().scheduledQueue;
  q.messages.forEach((m: any) => q.removeMessage(m.id));
  useAppStore.setState({
    chats: [{ id: 'c1', name: 'Bob', type: 'direct', history: [], unread: 0, message: '', time: '' }],
  });
});

afterEach(() => {
  vi.useRealTimers();
});

const tick = () => act(() => { vi.advanceTimersByTime(1000); });

describe('useScheduledMessages', () => {
  it('fires a due message through the live send path and unschedules it', () => {
    const setActiveChat = vi.fn();
    renderHook(() => useScheduledMessages(setActiveChat));

    act(() => { useAppStore.getState().scheduledQueue.addMessage(scheduled() as any); });
    tick();

    const chat = useAppStore.getState().chats[0];
    expect(chat.history).toHaveLength(1);
    expect(chat.history[0]).toMatchObject({ text: 'Later', sender: 'me', status: 'sent' });
    expect(typeof chat.history[0].ts).toBe('number');
    expect(chat.history[0].time).toBeTruthy();
    expect(chat.message).toBe('Later');
    expect(chat.time).toBe(chat.history[0].time);

    expect(wire.sendTextOverP2P).toHaveBeenCalledTimes(1);
    expect(wire.sendTextOverP2P.mock.calls[0][0]).toMatchObject({ text: 'Later' });
    expect(wire.sendTextOverP2P.mock.calls[0][1]).toMatchObject({ id: 'c1' });
    expect(queueOffline).toHaveBeenCalledTimes(1);
    expect(queueOffline.mock.calls[0][0]).toMatchObject({ chatId: 'c1', chatName: 'Bob' });

    expect(useAppStore.getState().scheduledQueue.messages).toHaveLength(0);
    expect(setActiveChat).toHaveBeenCalled();
  });

  it('mirrors the bubble into the open conversation through the functional updater', () => {
    const setActiveChat = vi.fn();
    renderHook(() => useScheduledMessages(setActiveChat));

    act(() => { useAppStore.getState().scheduledQueue.addMessage(scheduled() as any); });
    tick();

    const updater = setActiveChat.mock.calls.at(-1)![0];
    const next = updater({ id: 'c1', history: [], message: '', time: '' });
    expect(next.history).toHaveLength(1);
    expect(next.history[0].text).toBe('Later');
  });

  it('leaves a not-yet-due message queued', () => {
    renderHook(() => useScheduledMessages(vi.fn()));
    act(() => {
      useAppStore.getState().scheduledQueue.addMessage(scheduled({ scheduledAt: Date.now() + 60_000 }) as any);
    });
    tick();

    expect(useAppStore.getState().chats[0].history).toHaveLength(0);
    expect(useAppStore.getState().scheduledQueue.messages).toHaveLength(1);
    expect(wire.sendTextOverP2P).not.toHaveBeenCalled();
  });

  it('stamps queued status while offline', () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    renderHook(() => useScheduledMessages(vi.fn()));
    act(() => { useAppStore.getState().scheduledQueue.addMessage(scheduled() as any); });
    tick();

    expect(useAppStore.getState().chats[0].history[0].status).toBe('queued');
    onLine.mockRestore();
  });

  it('skips (and keeps) a message whose target chat is gone', () => {
    renderHook(() => useScheduledMessages(vi.fn()));
    act(() => { useAppStore.getState().scheduledQueue.addMessage(scheduled({ chatId: 'missing' }) as any); });
    tick();

    expect(useAppStore.getState().scheduledQueue.messages).toHaveLength(1);
    expect(wire.sendTextOverP2P).not.toHaveBeenCalled();
  });
});
