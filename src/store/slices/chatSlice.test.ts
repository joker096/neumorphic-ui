import { describe, it, expect } from 'vitest';
import { createChatSlice } from './chatSlice';

const makeSlice = (initial: any = {}) => {
  let state: any = { ...initial };
  const set = (partial: any) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...next };
  };
  const get = () => state;
  const slice = createChatSlice(set, get);
  // Keep initial fields (e.g. chats) that the slice also default-defines.
  state = { ...slice, ...state };
  return { slice, get };
};

describe('chatSlice', () => {
  it('setChats updates chats', () => {
    const { slice, get } = makeSlice();
    slice.setChats([{ id: 1, history: [] }]);
    expect(get().chats).toHaveLength(1);
  });

  it('forwardMessage appends to the target chat history only', () => {
    const { slice, get } = makeSlice({
      chats: [{ id: 't1', history: [{ id: 1 }] }, { id: 't2', history: [] }],
    });
    const msg = { id: 99, text: 'hi' };
    slice.forwardMessage(msg, 't2');
    const target = get().chats.find((c: any) => c.id === 't2');
    expect(target.history).toHaveLength(1);
    expect(target.history[0].id).toBe(99);
    expect(get().chats.find((c: any) => c.id === 't1').history).toHaveLength(1);
  });

  it('forwardMessage respects the anonymization flag', () => {
    const { slice, get } = makeSlice({ chats: [{ id: 't1', history: [] }], forwardAnonymization: true });
    slice.forwardMessage({ id: 5 }, 't1');
    expect(get().chats[0].history[0].forwardedAt).toBeDefined();
  });

  it('addFavorite/removeFavorite toggles membership', () => {
    const { slice, get } = makeSlice();
    slice.addFavorite('u1');
    expect(get().favoriteContacts).toContain('u1');
    slice.removeFavorite('u1');
    expect(get().favoriteContacts).not.toContain('u1');
  });

  it('toggleArchive toggles membership', () => {
    const { slice, get } = makeSlice();
    slice.toggleArchive('c1');
    expect(get().archivedChats).toContain('c1');
    slice.toggleArchive('c1');
    expect(get().archivedChats).not.toContain('c1');
  });

  it('pinChat pins up to three chats', () => {
    const { slice, get } = makeSlice({ chats: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }] });
    slice.pinChat('a');
    slice.pinChat('b');
    slice.pinChat('c');
    expect(get().chats.filter((c: any) => c.pinned)).toHaveLength(3);
    slice.pinChat('d');
    expect(get().chats.find((c: any) => c.id === 'd').pinned).toBeFalsy();
  });

  it('pinChat unpins when already pinned', () => {
    const { slice, get } = makeSlice({ chats: [{ id: 'a' }] });
    slice.pinChat('a');
    slice.pinChat('a');
    expect(get().chats[0].pinned).toBe(false);
  });

  it('scheduledQueue add and remove', () => {
    const { slice, get } = makeSlice();
    slice.scheduledQueue.addMessage({ id: 's1' } as any);
    expect(get().scheduledQueue.messages).toHaveLength(1);
    slice.scheduledQueue.removeMessage('s1');
    expect(get().scheduledQueue.messages).toHaveLength(0);
  });

  it('addPinnedMessage/removePinnedMessage', () => {
    const { slice, get } = makeSlice();
    slice.addPinnedMessage({ id: 7, chatId: 'c', pinBy: 'u' });
    expect(get().pinnedMessageList).toHaveLength(1);
    slice.removePinnedMessage(7);
    expect(get().pinnedMessageList).toHaveLength(0);
  });
});
