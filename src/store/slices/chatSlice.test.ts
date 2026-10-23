import { describe, it, expect } from 'vitest';
import { createChatSlice, canGroupPermission, getGroupRole, groupPermissionsOf, DEFAULT_GROUP_PERMISSIONS } from './chatSlice';
import { isChatMuteActive } from './chatSlice';

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

  it('toggleArchive toggles membership', () => {
    const { slice, get } = makeSlice();
    slice.toggleArchive('c1');
    expect(get().archivedChats).toContain('c1');
    slice.toggleArchive('c1');
    expect(get().archivedChats).not.toContain('c1');
  });

  it('setChatUnread marks a chat read and unread again', () => {
    const { slice, get } = makeSlice({ chats: [{ id: 'c1', unread: 4 }, { id: 'c2', unread: 7 }] });
    slice.setChatUnread('c1', false);
    expect(get().chats.find((c: any) => c.id === 'c1').unread).toBe(0);
    expect(get().chats.find((c: any) => c.id === 'c2').unread).toBe(7);
    slice.setChatUnread('c1', true);
    expect(get().chats.find((c: any) => c.id === 'c1').unread).toBeGreaterThanOrEqual(1);
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

  it('deleteGroup removes the group chat and its dangling references', () => {
    const { slice, get } = makeSlice({
      chats: [
        { id: 'g1', type: 'group', history: [] },
        { id: 'g1', type: 'dm', history: [] },
        { id: 'g2', type: 'group', history: [] },
      ],
      archivedChats: ['g1', 'g2'],
      pinnedMessageList: [{ id: 1, chatId: 'g1' }, { id: 2, chatId: 'g2' }],
    });
    slice.deleteGroup('g1');
    expect(get().chats.find((c: any) => c.id === 'g1' && c.type === 'group')).toBeUndefined();
    expect(get().chats.find((c: any) => c.id === 'g1' && c.type === 'dm')).toBeDefined();
    expect(get().archivedChats).not.toContain('g1');
    expect(get().pinnedMessageList.map((p: any) => p.chatId)).not.toContain('g1');
  });

  it('leaveGroup: owner leaving dissolves the group', () => {
    const { slice, get } = makeSlice({
      chats: [{ id: 'g1', type: 'group', group: { ownerId: 'me', inviteToken: 'ma_g1', slowModeSeconds: 0 }, members: [{ id: 'c1', name: 'C', color: '', role: 'member' }] }],
      archivedChats: ['g1'],
      pinnedMessageList: [{ id: 1, chatId: 'g1' }],
    });
    slice.leaveGroup('g1', 'me');
    expect(get().chats).toHaveLength(0);
    expect(get().archivedChats).not.toContain('g1');
    expect(get().pinnedMessageList).toHaveLength(0);
  });

  it('leaveGroup: non-owner member is removed, group stays', () => {
    const { slice, get } = makeSlice({
      chats: [{
        id: 'g1',
        type: 'group',
        group: { ownerId: 'me', inviteToken: 'ma_g1', slowModeSeconds: 0 },
        members: [{ id: 'c1', name: 'A', color: '', role: 'member' }, { id: 'c2', name: 'B', color: '', role: 'member' }],
      }],
    });
    slice.leaveGroup('g1', 'c2');
    expect(get().chats).toHaveLength(1);
    expect(get().chats[0].members.map((m: any) => m.id)).toEqual(['c1']);
  });

  it('leaveGroup: unknown chat or non-member user is a no-op', () => {
    const { slice, get } = makeSlice({
      chats: [{ id: 'g1', type: 'group', group: { ownerId: 'me', inviteToken: 'ma_g1', slowModeSeconds: 0 }, members: [{ id: 'c1', name: 'A', color: '', role: 'member' }] }],
    });
    slice.leaveGroup('nope', 'me');
    slice.leaveGroup('g1', 'stranger');
    expect(get().chats).toHaveLength(1);
    expect(get().chats[0].members.map((m: any) => m.id)).toEqual(['c1']);
  });

  it('addPinnedMessage/removePinnedMessage', () => {
    const { slice, get } = makeSlice();
    slice.addPinnedMessage({ id: 7, chatId: 'c', pinBy: 'u' });
    expect(get().pinnedMessageList).toHaveLength(1);
    slice.removePinnedMessage(7);
    expect(get().pinnedMessageList).toHaveLength(0);
  });

  it('removePinnedMessage is scoped by chatId', () => {
    const { slice, get } = makeSlice();
    slice.addPinnedMessage({ id: 1, chatId: 'c1', pinBy: 'u' });
    slice.addPinnedMessage({ id: 1, chatId: 'c2', pinBy: 'u' });
    slice.removePinnedMessage(1, 'c1');
    expect(get().pinnedMessageList).toHaveLength(1);
    expect(get().pinnedMessageList[0].chatId).toBe('c2');
  });

  it('addPinnedMessage does not duplicate the same message in the same chat', () => {
    const { slice, get } = makeSlice();
    slice.addPinnedMessage({ id: 7, chatId: 'c', pinBy: 'u' });
    slice.addPinnedMessage({ id: 7, chatId: 'c', pinBy: 'u' });
    expect(get().pinnedMessageList).toHaveLength(1);
  });

  it('getGroupRole resolves owner, member role, and null for strangers', () => {
    const chat = {
      group: { ownerId: 'me', inviteToken: 'x', slowModeSeconds: 0 },
      members: [{ id: 'c1', name: 'A', color: '', role: 'admin' as const }, { id: 'c2', name: 'B', color: '', role: 'member' as const }],
    };
    expect(getGroupRole(chat, 'me')).toBe('owner');
    expect(getGroupRole(chat, 'c1')).toBe('admin');
    expect(getGroupRole(chat, 'c2')).toBe('member');
    expect(getGroupRole(chat, 'stranger')).toBeNull();
    expect(getGroupRole(null, 'me')).toBeNull();
  });

  it('canGroupPermission follows the role matrix and is null-safe', () => {
    expect(canGroupPermission('owner', 'deleteGroup')).toBe(true);
    expect(canGroupPermission('owner', 'manageMembers')).toBe(true);
    expect(canGroupPermission('owner', 'manageGroup')).toBe(true);
    expect(canGroupPermission('admin', 'deleteGroup')).toBe(false);
    expect(canGroupPermission('admin', 'manageMembers')).toBe(true);
    expect(canGroupPermission('member', 'manageGroup')).toBe(false);
    expect(canGroupPermission(null, 'deleteGroup')).toBe(false);
  });

  it('groupPermissionsOf falls back to defaults when group or permissions missing', () => {
    expect(groupPermissionsOf(undefined)).toEqual(DEFAULT_GROUP_PERMISSIONS);
    expect(groupPermissionsOf({ ownerId: 'me', inviteToken: 'x', slowModeSeconds: 0 })).toEqual(DEFAULT_GROUP_PERMISSIONS);
    expect(groupPermissionsOf({ ownerId: 'me', inviteToken: 'x', slowModeSeconds: 0, permissions: { sendMessages: false, addMembers: true, mentionEveryone: true } }))
      .toEqual({ sendMessages: false, addMembers: true, mentionEveryone: true });
  });

  it('createGroup seeds default group permissions', () => {
    const { slice, get } = makeSlice({
      contacts: [{ id: 'c1', name: 'A', color: '' }, { id: 'c2', name: 'B', color: '' }],
      userProfile: { id: 'me' },
    });
    const id = slice.createGroup({ name: 'G', memberIds: ['c1', 'c2'] });
    const chat = get().chats.find((c: any) => c.id === id);
    expect(chat.group.permissions).toEqual(DEFAULT_GROUP_PERMISSIONS);
    expect(typeof chat.createdAt).toBe('number');
  });

  it('setChatMuted patches only the target chat, unknown id is a no-op', () => {
    const { slice, get } = makeSlice({
      chats: [{ id: 'g1', muted: false }, { id: 'g2' }],
    });
    slice.setChatMuted('g1', true);
    expect(get().chats.find((c: any) => c.id === 'g1').muted).toBe(true);
    expect(get().chats.find((c: any) => c.id === 'g2').muted).toBeUndefined();
    slice.setChatMuted('nope', false);
    expect(get().chats.find((c: any) => c.id === 'g1').muted).toBe(true);
  });

  it('setChatMuted mutes a channel-shaped chat (drives channel notifications)', () => {
    const { slice, get } = makeSlice({
      chats: [{ id: 'c1', isChannel: true, muted: false }],
    });
    slice.setChatMuted('c1', true);
    expect(get().chats.find((c: any) => c.id === 'c1').muted).toBe(true);
    slice.setChatMuted('c1', false);
    expect(get().chats.find((c: any) => c.id === 'c1').muted).toBe(false);
  });

  it('leaveChannel removes the channel chat and cleans archive/pinned refs, keeps groups', () => {
    const { slice, get } = makeSlice({
      chats: [{ id: 'ch1', isChannel: true }, { id: 'g1', type: 'group' }],
      archivedChats: ['ch1'],
      pinnedMessageList: [{ id: 1, chatId: 'ch1', pinBy: 'me', pinnedAt: 0 }],
    });
    slice.leaveChannel('ch1');
    expect(get().chats).toEqual([{ id: 'g1', type: 'group' }]);
    expect(get().archivedChats).toEqual([]);
    expect(get().pinnedMessageList).toEqual([]);
  });
});
describe('chatSlice mute durations', () => {
  it('setChatMuted writes BOTH keys so the list and the profile agree', () => {
    const { slice, get } = makeSlice({ chats: [{ id: 'd1' }] });
    slice.setChatMuted('d1', true);
    const chat = get().chats[0];
    expect(chat.isMuted).toBe(true);
    expect(chat.muted).toBe(true);
    slice.setChatMuted('d1', false);
    expect(get().chats[0].isMuted).toBe(false);
    expect(get().chats[0].muted).toBe(false);
  });

  it('setChatMuteUntil stores a deadline and "forever" stores no deadline', () => {
    const { slice, get } = makeSlice({ chats: [{ id: 'd1' }] });
    slice.setChatMuteUntil('d1', 1_000);
    expect(get().chats[0].isMuted).toBe(true);
    expect(get().chats[0].muteUntil).toBe(1_000);
    slice.setChatMuteUntil('d1', 'forever');
    expect(get().chats[0].isMuted).toBe(true);
    expect(get().chats[0].muteUntil).toBeUndefined();
    slice.setChatMuteUntil('d1', null);
    expect(get().chats[0].isMuted).toBe(false);
  });

  it('expireChatMutes clears only the lapsed mutes and writes nothing when idle', () => {
    const { slice, get } = makeSlice({
      chats: [
        { id: 'lapsed', isMuted: true, muted: true, muteUntil: 500 },
        { id: 'later', isMuted: true, muted: true, muteUntil: 5_000 },
        { id: 'forever', isMuted: true, muted: true },
        { id: 'plain', isMuted: false },
      ],
    });
    const before = get().chats;
    slice.expireChatMutes(100);
    expect(get().chats).toBe(before); // identity preserved: no persist churn
    slice.expireChatMutes(1_000);
    expect(get().chats[0].isMuted).toBe(false);
    expect(get().chats[1].isMuted).toBe(true);
    expect(get().chats[2].isMuted).toBe(true);
    expect(get().chats[3].isMuted).toBe(false);
  });

  it('isChatMuteActive lapses a timed mute without waiting for the sweep', () => {
    expect(isChatMuteActive({ isMuted: true, muteUntil: 2_000 }, 1_000)).toBe(true);
    expect(isChatMuteActive({ isMuted: true, muteUntil: 2_000 }, 2_001)).toBe(false);
    expect(isChatMuteActive({ muted: true })).toBe(true);
    expect(isChatMuteActive({}, 0)).toBe(false);
  });
});

describe('chatSlice clearChatHistory', () => {
  it('drops bubbles and unread but keeps the chat and its settings', () => {
    const { slice, get } = makeSlice({
      chats: [
        { id: 'c1', name: 'Ann', isMuted: true, folder: 'work', history: [{ id: 1 }], messages: [{ id: 1 }], unread: 3 },
        { id: 'c2', name: 'Bob', history: [{ id: 2 }], unread: 5 },
      ],
    });

    slice.clearChatHistory('c1');

    const cleared = get().chats.find((c: any) => c.id === 'c1');
    expect(cleared.history).toEqual([]);
    expect(cleared.messages).toEqual([]);
    expect(cleared.unread).toBe(0);
    // Clearing is not deleting: the chat, its folder and its mute survive.
    expect(cleared.name).toBe('Ann');
    expect(cleared.folder).toBe('work');
    expect(cleared.isMuted).toBe(true);
    expect(get().chats.find((c: any) => c.id === 'c2')).toEqual({ id: 'c2', name: 'Bob', history: [{ id: 2 }], unread: 5 });
  });

  it('drops pins of the cleared chat and leaves other chats pinned', () => {
    const { slice, get } = makeSlice({
      chats: [{ id: 'c1', history: [] }, { id: 'c2', history: [] }],
      pinnedMessageList: [
        { id: 1, chatId: 'c1', pinBy: 'me', pinnedAt: 0 },
        { id: 2, chatId: 'c2', pinBy: 'me', pinnedAt: 1 },
      ],
    });

    slice.clearChatHistory('c1');

    // A pin pointing at an erased bubble would render an empty pinned bar.
    expect(get().pinnedMessageList).toEqual([{ id: 2, chatId: 'c2', pinBy: 'me', pinnedAt: 1 }]);
  });
});

describe('chatSlice setPinnedOrder', () => {
  it('reassigns pinRank by the given id order', () => {
    const { slice, get } = makeSlice({
      chats: [
        { id: 'c1', pinned: true, pinRank: 5 },
        { id: 'c2', pinned: true, pinRank: 1 },
        { id: 'c3', pinned: false },
      ],
    });

    slice.setPinnedOrder(['c2', 'c1']);

    const chats = get().chats;
    expect(chats.find((c: any) => c.id === 'c1')).toEqual({ id: 'c1', pinned: true, pinRank: 1 });
    expect(chats.find((c: any) => c.id === 'c2')).toEqual({ id: 'c2', pinned: true, pinRank: 0 });
    // Non-pinned chats are not in the order and stay untouched.
    expect(chats.find((c: any) => c.id === 'c3')).toEqual({ id: 'c3', pinned: false });
  });

  it('does not add ranks to chats absent from the order', () => {
    const { slice, get } = makeSlice({
      chats: [
        { id: 'c1', pinned: true, pinRank: 0 },
        { id: 'c2', pinned: false },
      ],
    });

    slice.setPinnedOrder(['c1']);

    expect(get().chats.find((c: any) => c.id === 'c2')).toEqual({ id: 'c2', pinned: false });
  });
});