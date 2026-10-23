import { describe, it, expect, vi, beforeEach } from 'vitest';

const authorizeMock = vi.hoisted(() => vi.fn());
const releaseMock = vi.hoisted(() => vi.fn());
const removePinnedMock = vi.hoisted(() => vi.fn());
const storeState = vi.hoisted(() => ({ current: null as any }));

vi.mock('./inboundGate', () => ({ authorizeInboundChatFrame: authorizeMock }));
vi.mock('../../../store', () => ({ useAppStore: { getState: () => storeState.current } }));
vi.mock('../../messageMedia', () => ({ releaseMessageMedia: releaseMock }));

const { handleChatDelete } = await import('./inboundChatFrames');

const frame = (over: Record<string, any> = {}) => ({
  type: 'chat-delete' as const,
  seq: 3,
  messageId: 'm-1',
  chatId: 'dm-1',
  chatName: 'Alice',
  senderName: 'Bob',
  timestamp: 1_700_000_000_000,
  ...over,
});

beforeEach(() => {
  authorizeMock.mockReset();
  releaseMock.mockReset();
  removePinnedMock.mockReset();
  storeState.current = {
    chats: [
      {
        id: 'dm-1',
        name: 'Alice',
        history: [
          { id: 'm-1', sender: 'Alice', text: 'hi' },
          { id: 'm-2', sender: 'me', text: 'mine' },
        ],
      },
    ],
    removePinnedMessage: removePinnedMock,
    setChats: (updater: any) => {
      storeState.current.chats = typeof updater === 'function'
        ? updater(storeState.current.chats)
        : updater;
    },
  };
  authorizeMock.mockReturnValue({ id: 'dm-1', name: 'Alice', type: 'direct' });
});

describe('handleChatDelete (delete for everyone)', () => {
  it('removes the peer bubble, releases its media and drops a stale pin', () => {
    handleChatDelete(frame(), 'peer-1');
    expect(authorizeMock).toHaveBeenCalledWith('dm-1', 'Alice', 'peer-1', 'chat-delete');
    expect(releaseMock).toHaveBeenCalledTimes(1);
    expect(removePinnedMock).toHaveBeenCalledWith('m-1', 'dm-1');
    const history = storeState.current.chats[0].history;
    expect(history.map((m: any) => m.id)).toEqual(['m-2']);
  });

  it('never erases a message the local user wrote', () => {
    handleChatDelete(frame({ messageId: 'm-2' }), 'peer-1');
    expect(releaseMock).not.toHaveBeenCalled();
    expect(storeState.current.chats[0].history).toHaveLength(2);
  });

  it('ignores a frame the gate refuses (unknown chat / foreign peer)', () => {
    authorizeMock.mockReturnValue(null);
    handleChatDelete(frame(), 'peer-1');
    expect(storeState.current.chats[0].history).toHaveLength(2);
  });

  it('ignores a duplicate or late frame for an already removed message', () => {
    handleChatDelete(frame(), 'peer-1');
    handleChatDelete(frame(), 'peer-1');
    expect(storeState.current.chats[0].history).toHaveLength(1);
    expect(releaseMock).toHaveBeenCalledTimes(1);
  });

  it('is a no-op for a null frame', () => {
    handleChatDelete(null, 'peer-1');
    expect(authorizeMock).not.toHaveBeenCalled();
  });
});
