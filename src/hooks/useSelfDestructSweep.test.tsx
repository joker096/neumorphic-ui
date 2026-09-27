import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { FTR_MAGIC } from '../lib/fileTransfer/frames';

const mocks = vi.hoisted(() => ({
  store: { chats: [] as any[], channels: [] as any[] },
  setChats: vi.fn(),
  setChannels: vi.fn(),
  deleteVoiceBlob: vi.fn().mockResolvedValue(undefined),
  deleteTransfer: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/voiceStore', () => ({ deleteVoiceBlob: mocks.deleteVoiceBlob }));
vi.mock('../lib/fileTransfer/fileStore', () => ({ deleteTransfer: mocks.deleteTransfer }));
vi.mock('../store', () => ({
  useAppStore: Object.assign((selector: any) => selector(mocks.store), {
    getState: () => ({
      chats: mocks.store.chats,
      channels: mocks.store.channels,
      setChats: mocks.setChats,
      setChannels: mocks.setChannels,
    }),
  }),
}));

import { useSelfDestructSweep } from './useSelfDestructSweep';

const ago = (ms: number) => Date.now() - ms;

describe('useSelfDestructSweep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mocks.store.chats = [];
    mocks.store.channels = [];
  });

  it('purges messages whose deadline passed while the app was closed', () => {
    const expired = { id: 'old', selfDestructAt: ago(1000), fileTransferId: 't-x' };
    mocks.store.chats = [{ id: 'dm-1', history: [expired, { id: 'keep' }] }];

    renderHook(() => useSelfDestructSweep());

    expect(mocks.setChats).toHaveBeenCalledTimes(1);
    expect(mocks.setChats.mock.calls[0][0]).toEqual([{ id: 'dm-1', history: [{ id: 'keep' }] }]);
    expect(mocks.deleteTransfer).toHaveBeenCalledWith('t-x');
  });

  it('erases voice and album media of a purged message', () => {
    mocks.store.chats = [
      {
        id: 'dm-1',
        history: [
          {
            id: 'v',
            selfDestructAt: ago(1),
            type: 'audio',
            voiceId: 'voice-9',
            album: [{ url: FTR_MAGIC + 'a-1' }, { url: FTR_MAGIC + 'a-2' }],
          },
        ],
      },
    ];

    renderHook(() => useSelfDestructSweep());

    expect(mocks.deleteVoiceBlob).toHaveBeenCalledWith('voice-9');
    expect(mocks.deleteTransfer).toHaveBeenCalledWith('a-1');
    expect(mocks.deleteTransfer).toHaveBeenCalledWith('a-2');
  });

  it('purges channel posts and the saved-message copies', () => {
    const setSavedMessages = vi.fn();
    mocks.store.channels = [{ id: 'ch-1', history: [{ id: 'p1', selfDestructAt: ago(5) }] }];

    renderHook(() => useSelfDestructSweep({ setSavedMessages }));

    expect(mocks.setChannels).toHaveBeenCalledWith([{ id: 'ch-1', history: [] }]);
    const updater = setSavedMessages.mock.calls[0][0];
    expect(updater([{ messageId: 'p1' }, { messageId: 'other' }])).toEqual([{ messageId: 'other' }]);
  });

  it('mirrors the purge into the open chat snapshot', () => {
    const setActiveChat = vi.fn();
    const expired = { id: 'x', selfDestructAt: ago(1) };
    mocks.store.chats = [{ id: 'dm-1', history: [expired, { id: 'y' }] }];

    renderHook(() => useSelfDestructSweep({ activeChat: { id: 'dm-1', history: [expired, { id: 'y' }] }, setActiveChat }));

    expect(setActiveChat).toHaveBeenCalledWith({ id: 'dm-1', history: [{ id: 'y' }] });
  });

  it('leaves the open chat untouched when it holds no expired message', () => {
    const setActiveChat = vi.fn();
    mocks.store.chats = [{ id: 'dm-1', history: [{ id: 'x', selfDestructAt: ago(1) }] }];

    renderHook(() => useSelfDestructSweep({ activeChat: { id: 'dm-2', history: [{ id: 'z' }] }, setActiveChat }));

    expect(setActiveChat).not.toHaveBeenCalled();
  });

  it('deletes a live message when its deadline timer fires', () => {
    vi.useFakeTimers();
    const now = 5_000_000;
    vi.setSystemTime(now);
    mocks.store.chats = [{ id: 'dm-1', history: [{ id: 'live', selfDestructAt: now + 1_000 }] }];

    renderHook(() => useSelfDestructSweep());
    expect(mocks.setChats).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1_500);

    expect(mocks.setChats).toHaveBeenCalledWith([{ id: 'dm-1', history: [] }]);
  });

  it('keeps a pending message until its deadline', () => {
    vi.useFakeTimers();
    const now = 5_000_000;
    vi.setSystemTime(now);
    mocks.store.chats = [{ id: 'dm-1', history: [{ id: 'live', selfDestructAt: now + 60_000 }] }];

    renderHook(() => useSelfDestructSweep());
    vi.advanceTimersByTime(30_000);

    expect(mocks.setChats).not.toHaveBeenCalled();
    expect(mocks.setChannels).not.toHaveBeenCalled();
  });

  it('arms the timer for a deadline that is not in the first chat', () => {
    // The scan walks the chat list itself (no flattened copy), so an earlier
    // deadline in a later chat must still be picked up.
    vi.useFakeTimers();
    const now = 5_000_000;
    vi.setSystemTime(now);
    mocks.store.chats = [
      { id: 'dm-1', history: [{ id: 'a' }] },
      { id: 'dm-2' },
      { id: 'dm-3', history: [{ id: 'b', selfDestructAt: now + 1_000 }] },
    ];

    renderHook(() => useSelfDestructSweep());
    expect(mocks.setChats).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1_500);

    expect(mocks.setChats).toHaveBeenCalledWith([
      { id: 'dm-1', history: [{ id: 'a' }] },
      { id: 'dm-2' },
      { id: 'dm-3', history: [] },
    ]);
  });

  it('sweeps again when a background tab wakes up', () => {
    const pending = { id: 'late', selfDestructAt: Date.now() + 60_000 };
    mocks.store.chats = [{ id: 'dm-1', history: [pending] }];

    const { unmount } = renderHook(() => useSelfDestructSweep());
    expect(mocks.setChats).not.toHaveBeenCalled();

    // The deadline passes while the tab is hidden (timers are throttled there).
    pending.selfDestructAt = Date.now() - 1;
    document.dispatchEvent(new Event('visibilitychange'));

    expect(mocks.setChats).toHaveBeenCalledWith([{ id: 'dm-1', history: [] }]);
    unmount();
  });
});
