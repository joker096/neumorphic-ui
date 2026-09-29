import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  state: { chats: [] as any[] },
  setState: vi.fn(),
  release: vi.fn().mockResolvedValue(undefined),
  toast: vi.fn(),
}));

vi.mock('../store', () => ({
  useAppStore: {
    getState: () => mocks.state,
    setState: mocks.setState,
  },
}));
vi.mock('../lib/messageMedia', () => ({ releaseMessageMedia: mocks.release }));
vi.mock('../components/ui/Toast', () => ({ toast: mocks.toast }));
vi.mock('../lib/i18n', () => ({ useI18n: () => ({ t: (k: string, f: string) => f }) }));

import { useChatMessageActions } from './useChatMessageActions';

const voiceMsg = {
  id: 'm1',
  type: 'audio',
  voiceId: 'v1',
  audioUrl: 'blob:http://x/1',
  history: undefined,
};

describe('useChatMessageActions — media release on delete', () => {
  beforeEach(() => {
    mocks.state.chats = [
      { id: 'chat-1', history: [voiceMsg, { id: 'm2' }], messages: [voiceMsg, { id: 'm2' }] },
    ];
    mocks.setState.mockClear();
    mocks.release.mockClear().mockResolvedValue(undefined);
    mocks.toast.mockClear();
  });

  it('releases the deleted bubble media before dropping it from the store', () => {
    const { result } = renderHook(() => useChatMessageActions({ chatId: 'chat-1' }));

    act(() => result.current.handleDeleteMessage(voiceMsg));

    expect(mocks.release).toHaveBeenCalledWith([voiceMsg]);
    expect(mocks.setState).toHaveBeenCalledTimes(1);
    const next = mocks.setState.mock.calls[0][0].chats;
    expect(next[0].history).toEqual([{ id: 'm2' }]);
  });

  it('releases exactly the selected subset of the stored history', () => {
    const { result } = renderHook(() => useChatMessageActions({ chatId: 'chat-1' }));

    act(() => result.current.handleEnterSelection(voiceMsg));
    act(() => result.current.handleDeleteSelected(mocks.state.chats[0].history));

    // The call site passes the whole history; only selected ids may be erased.
    expect(mocks.release).toHaveBeenCalledWith([voiceMsg]);
    const next = mocks.setState.mock.calls[0][0].chats;
    expect(next[0].history).toEqual([{ id: 'm2' }]);
  });

  it('leaves a delegated onDelete host in charge of its own cleanup', () => {
    const onDelete = vi.fn();
    const { result } = renderHook(() => useChatMessageActions({ chatId: 'chat-1', onDelete }));

    act(() => result.current.handleDeleteMessage(voiceMsg));

    expect(onDelete).toHaveBeenCalledWith(voiceMsg);
    expect(mocks.release).not.toHaveBeenCalled();
    expect(mocks.setState).not.toHaveBeenCalled();
  });
});
