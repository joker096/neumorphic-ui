import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockSeedMockData = vi.hoisted(() => vi.fn());
const mockStoreSelector = vi.hoisted(() => vi.fn());
const mockStoreGetState = vi.hoisted(() => vi.fn());

vi.mock('../utils/mockSeeding', () => ({
  seedMockData: mockSeedMockData,
}));

vi.mock('../store', () => ({
  useAppStore: Object.assign(
    (selector: any) => mockStoreSelector(selector),
    { getState: () => mockStoreGetState(), setState: vi.fn(), subscribe: vi.fn() }
  ),
}));

describe('useScheduledMessages', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not set interval when scheduledQueue is null', async () => {
    mockStoreSelector.mockImplementation((s: any) => s?.({ scheduledQueue: null }));

    const { useScheduledMessages } = await import('./useAppEffects');
    const setChats = vi.fn();
    const { unmount } = renderHook(() => useScheduledMessages(setChats));
    expect(vi.getTimerCount()).toBe(0);
    unmount();
  });

  it('should process scheduled messages', async () => {
    const removeMessage = vi.fn();
    mockStoreSelector.mockImplementation((s: any) => s?.({
      scheduledQueue: {
        messages: [
          { id: 'msg1', chatId: 'chat1', text: 'Hello', scheduledAt: Date.now() - 1000 },
        ],
        removeMessage,
        addMessage: vi.fn(),
      },
    }));

    const { useScheduledMessages } = await import('./useAppEffects');
    const setChats = vi.fn();
    setChats.mockImplementation((fn: any) => {
      if (typeof fn === 'function') fn([]);
    });
    renderHook(() => useScheduledMessages(setChats));

    act(() => { vi.advanceTimersByTime(1000); });
    expect(setChats).toHaveBeenCalled();
  });

  it('should clear interval on unmount', async () => {
    mockStoreSelector.mockImplementation((s: any) => s?.({
      scheduledQueue: {
        messages: [
          { id: 'msg1', chatId: 'chat1', text: 'Hello', scheduledAt: Date.now() + 50000 },
        ],
        removeMessage: vi.fn(),
      },
    }));

    const { useScheduledMessages } = await import('./useAppEffects');
    const { unmount } = renderHook(() => useScheduledMessages(vi.fn()));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('useDataSeeding', () => {
  it('should seed data when chats array is empty', async () => {
    mockStoreGetState.mockReturnValue({
      chats: [],
      contacts: [],
      channels: [],
      setChats: vi.fn(),
      setContacts: vi.fn(),
      setChannels: vi.fn(),
    });

    const { useDataSeeding } = await import('./useAppEffects');
    renderHook(() => useDataSeeding());
    expect(mockSeedMockData).toHaveBeenCalled();
  });
});
