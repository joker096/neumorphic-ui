import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  state: { chats: [] as any[] },
  setState: vi.fn(),
  release: vi.fn().mockResolvedValue(undefined),
  toast: vi.fn(),
  sendDelete: vi.fn(),
}));

vi.mock('../store', () => ({
  useAppStore: {
    getState: () => mocks.state,
    setState: mocks.setState,
  },
}));
vi.mock('../lib/messageMedia', () => ({ releaseMessageMedia: mocks.release }));
vi.mock('../lib/p2p/deleteSync', () => ({ sendChatDelete: mocks.sendDelete }));
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
    mocks.sendDelete.mockClear();
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

  it('retracts own messages on the peer by default', () => {
    const own = { id: 'm3', sender: 'me' };
    mocks.state.chats = [{ id: 'chat-1', history: [own] }];
    const { result } = renderHook(() => useChatMessageActions({ chatId: 'chat-1' }));

    act(() => result.current.handleDeleteMessage(own));

    expect(mocks.sendDelete).toHaveBeenCalledWith(mocks.state.chats[0], 'm3');
  });

  it('"delete for me" never touches the wire', () => {
    const own = { id: 'm3', sender: 'me' };
    mocks.state.chats = [{ id: 'chat-1', history: [own] }];
    const { result } = renderHook(() => useChatMessageActions({ chatId: 'chat-1' }));

    act(() => result.current.handleDeleteMessage(own, 'me'));

    expect(mocks.sendDelete).not.toHaveBeenCalled();
    expect(mocks.setState).toHaveBeenCalledTimes(1);
  });

  it('bulk delete retracts only the selected own bubbles', () => {
    const own = { id: 'a', sender: 'me' };
    const foreign = { id: 'b', sender: 'friend' };
    const kept = { id: 'c', sender: 'me' };
    mocks.state.chats = [{ id: 'chat-1', history: [own, foreign, kept] }];
    const { result } = renderHook(() => useChatMessageActions({ chatId: 'chat-1' }));

    act(() => result.current.handleEnterSelection(own));
    act(() => result.current.handleToggleSelect(foreign.id));
    act(() => result.current.handleDeleteSelected(mocks.state.chats[0].history));

    expect(mocks.sendDelete).toHaveBeenCalledTimes(1);
    expect(mocks.sendDelete).toHaveBeenCalledWith(mocks.state.chats[0], 'a');
    const next = mocks.setState.mock.calls[0][0].chats;
    expect(next[0].history).toEqual([kept]);
  });

  it('bulk "delete for me" keeps the peer copy', () => {
    const own = { id: 'a', sender: 'me' };
    mocks.state.chats = [{ id: 'chat-1', history: [own] }];
    const { result } = renderHook(() => useChatMessageActions({ chatId: 'chat-1' }));

    act(() => result.current.handleEnterSelection(own));
    act(() => result.current.handleDeleteSelected(mocks.state.chats[0].history, 'me'));

    expect(mocks.sendDelete).not.toHaveBeenCalled();
    const next = mocks.setState.mock.calls[0][0].chats;
    expect(next[0].history).toEqual([]);
  });
});
