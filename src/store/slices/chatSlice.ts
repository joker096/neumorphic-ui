import type { Contact } from '../../types/contact';
import type { P2PChannel, BotConfig, ScheduledMessage } from '../types';

export type GroupRole = 'owner' | 'admin' | 'member';

export type GroupPermission = 'manageMembers' | 'manageGroup' | 'deleteGroup';

export const GROUP_ROLE_PERMISSIONS: Record<GroupRole, readonly GroupPermission[]> = {
  owner: ['manageMembers', 'manageGroup', 'deleteGroup'],
  admin: ['manageMembers', 'manageGroup'],
  member: [],
};

export interface GroupPermissions {
  sendMessages: boolean;
  addMembers: boolean;
  mentionEveryone: boolean;
}

export const DEFAULT_GROUP_PERMISSIONS: GroupPermissions = {
  sendMessages: true,
  addMembers: false,
  mentionEveryone: false,
};

export interface GroupMember {
  id: string;
  name: string;
  color: string;
  role: GroupRole;
  banned?: boolean;
  muted?: boolean;
}

export interface GroupInfo {
  inviteToken: string;
  slowModeSeconds: number;
  ownerId: string;
  permissions?: GroupPermissions;
}

export const canGroupPermission = (role: GroupRole | null | undefined, perm: GroupPermission): boolean =>
  role ? GROUP_ROLE_PERMISSIONS[role].includes(perm) : false;

export const getGroupRole = (
  chat: { group?: GroupInfo; members?: GroupMember[] } | undefined | null,
  userId: string,
): GroupRole | null => {
  if (!chat) return null;
  if (chat.group?.ownerId === userId) return 'owner';
  return (chat.members ?? []).find((m: GroupMember) => m.id === userId)?.role ?? null;
};

export const groupPermissionsOf = (group: GroupInfo | undefined | null): GroupPermissions =>
  group?.permissions ?? { ...DEFAULT_GROUP_PERMISSIONS };

export interface ChatSlice {
  chats: any[];
  /**
   * Id of the conversation currently open in the workspace — a store mirror of
   * App's `activeChat` state so the non-React inbound writers (P2P append
   * paths) can suppress unread badges / notifications for the chat the user is
   * already reading.
   */
  activeChatId: string | number | null;
  setActiveChatId: (id: string | number | null) => void;
  createGroup: (opts: { name: string; memberIds: string[] }) => string;
  updateGroup: (chatId: string, patch: Partial<{ members: GroupMember[]; group: GroupInfo }>) => void;
  deleteGroup: (chatId: string) => void;
  leaveGroup: (chatId: string, userId: string) => void;
  leaveChannel: (chatId: string | number) => void;
  setChatMuted: (chatId: string | number, muted: boolean) => void;
  /**
   * Timed mute (Telegram/WhatsApp presets). `until` is an absolute ms epoch,
   * `"forever"` keeps the chat muted until it is unmuted by hand, and `null`
   * unmutes immediately.
   */
  setChatMuteUntil: (chatId: string | number, until: number | "forever" | null) => void;
  /** Drops timed mutes whose moment has passed; identity-preserving when idle. */
  expireChatMutes: (now?: number) => void;
  setChats: (updater: any[] | ((prev: any[]) => any[])) => void;
  forwardMessage: (message: any, targetChatId: string) => void;
  contacts: Contact[];
  setContacts: (updater: Contact[] | ((prev: Contact[]) => Contact[])) => void;
  setContactMuted: (contactId: string, muted: boolean) => void;
  setContactBlocked: (contactId: string, blocked: boolean) => void;
  channels: P2PChannel[];
  setChannels: (updater: P2PChannel[] | ((prev: P2PChannel[]) => P2PChannel[])) => void;
  bots: BotConfig[];
  setBots: (updater: BotConfig[] | ((prev: BotConfig[]) => BotConfig[])) => void;
  scheduledQueue: { messages: ScheduledMessage[]; addMessage: (msg: ScheduledMessage) => void; removeMessage: (id: string) => void; rescheduleMessage: (id: string, at: number) => void };
  archivedChats: (string | number)[];
  toggleArchive: (id: string | number) => void;
  /** Mark a chat read (`unread = false`) or unread (`unread = true`, at least 1). */
  setChatUnread: (id: string | number, unread: boolean) => void;
  /** Drop every bubble of one chat while keeping the chat itself in the list. */
  clearChatHistory: (chatId: string | number) => void;
  pinChat: (chatId: string | number) => void;
  /**
   * Persists the manual order of pinned chats. Each pinned chat carries a
   * `pinRank` (0-based) used by the list to sort the pinned section; the order
   * is a list of chat ids in the desired top-to-bottom sequence.
   */
  setPinnedOrder: (orderedIds: Array<string | number>) => void;
  pinnedMessageList: Array<{ id: number; chatId: string | number; pinBy: string; pinnedAt: number }>;
  addPinnedMessage: (pin: { id: number; chatId: string | number; pinBy: string }) => void;
  removePinnedMessage: (id: number, chatId?: string | number) => void;
}

/**
 * Chat mute is stored through ONE helper so the two historical keys stay in
 * sync: `isMuted` is what the chat list, the swipe drawer and the mute icon
 * read, while `muted` is still written for older persisted snapshots and for
 * the notification gate that predates the rename. Writing either key alone made
 * "mute from the profile" invisible in the list — a mute that never reached its
 * own reader.
 *
 * A timed mute additionally carries `muteUntil` (absolute ms epoch); passing
 * `undefined` clears it, which is how "forever" and "unmuted" differ.
 */
export const applyChatMute = (chat: any, muted: boolean, muteUntil?: number) => {
  const next: any = { ...chat, isMuted: muted, muted };
  if (muteUntil === undefined) delete next.muteUntil;
  else next.muteUntil = muteUntil;
  return next;
};

/**
 * True while a chat's mute is in force. Timed mutes lapse on their own, so
 * readers that must stay quiet even between sweep ticks (notifications) use
 * this instead of the raw boolean.
 */
export const isChatMuteActive = (chat: any, now: number = Date.now()): boolean => {
  if (!chat) return false;
  const muted = !!(chat.isMuted ?? chat.muted);
  if (!muted) return false;
  return typeof chat.muteUntil === "number" ? chat.muteUntil > now : true;
};

export const createChatSlice = (set: any, get: any): ChatSlice => ({
  chats: [],
  activeChatId: null,
  setActiveChatId: (id) => set({ activeChatId: id }),
  setChats: (updater) => set((state: any) => ({
    chats: typeof updater === 'function' ? updater(state.chats) : updater
  })),
  createGroup: ({ name, memberIds }) => {
    const profile = get().userProfile;
    const contacts = get().contacts;
    const id = `group_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const members: GroupMember[] = contacts
      .filter((c: Contact) => memberIds.includes(c.id))
      .map((c: Contact, i: number) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        role: (i === 0 ? 'owner' : 'member') as GroupRole,
      }));
    const chat = {
      id,
      name,
      type: 'group',
      createdAt: Date.now(),
      color: 'from-emerald-400 to-teal-500',
      online: false,
      history: [],
      unread: 0,
      message: '',
      time: 'now',
      members,
      memberIds: members.map((m) => m.id),
      group: {
        inviteToken: `ma_${id}`,
        slowModeSeconds: 0,
        ownerId: profile?.id || 'me',
        permissions: { ...DEFAULT_GROUP_PERMISSIONS },
      },
    };
    set((state: any) => ({ chats: [chat, ...state.chats] }));
    return id;
  },
  updateGroup: (chatId, patch) => set((state: any) => ({
    chats: state.chats.map((chat: any) => {
      if (chat.id !== chatId || chat.type !== 'group') return chat;
      return {
        ...chat,
        ...(patch.members ? { members: patch.members, memberIds: patch.members.map((m: GroupMember) => m.id) } : null),
        group: patch.group ? { ...chat.group, ...patch.group } : chat.group,
      };
    })
  })),
  deleteGroup: (chatId) => set((state: any) => ({
    chats: state.chats.filter((chat: any) => !(chat.id === chatId && chat.type === 'group')),
    archivedChats: state.archivedChats.filter((id: string | number) => id !== chatId),
    pinnedMessageList: state.pinnedMessageList.filter((p: any) => p.chatId !== chatId),
  })),
  leaveGroup: (chatId, userId) => {
    const chat = get().chats.find((c: any) => c.id === chatId && c.type === 'group');
    if (!chat) return;
    if (chat.group?.ownerId === userId) {
      get().deleteGroup(chatId);
      return;
    }
    get().updateGroup(chatId, { members: (chat.members ?? []).filter((m: GroupMember) => m.id !== userId) });
  },
  leaveChannel: (chatId) => set((state: any) => ({
    chats: state.chats.filter((chat: any) => !(chat.id === chatId && (chat.isChannel || chat.type === 'channel'))),
    archivedChats: state.archivedChats.filter((id: string | number) => id !== chatId),
    pinnedMessageList: state.pinnedMessageList.filter((p: any) => p.chatId !== chatId),
  })),
  setChatMuted: (chatId, muted) => set((state: any) => ({
    chats: state.chats.map((chat: any) => (chat.id === chatId ? applyChatMute(chat, muted) : chat)),
  })),
  setChatMuteUntil: (chatId, until) => set((state: any) => ({
    chats: state.chats.map((chat: any) => (chat.id === chatId
      ? applyChatMute(chat, until !== null, typeof until === "number" ? until : undefined)
      : chat)),
  })),
  expireChatMutes: (now = Date.now()) => set((state: any) => {
    let changed = false;
    const chats = state.chats.map((chat: any) => {
      if (typeof chat.muteUntil === "number" && chat.muteUntil <= now) {
        changed = true;
        return applyChatMute(chat, false);
      }
      return chat;
    });
    // No expired mute → return no patch at all, so the persist subscriber does
    // not write an identical snapshot every sweep tick.
    return changed ? { chats } : {};
  }),
  forwardMessage: (message: any, targetChatId: string) => {
    set((storeState: any) => {
      const anonymized = storeState.forwardAnonymization ? {
        ...message, forwardedAt: Date.now()
      } : message;
      const updatedChats = storeState.chats.map((chat: any) => {
        if (chat.id === targetChatId && Array.isArray(chat.history)) {
          return { ...chat, history: [...chat.history, anonymized] };
        }
        return chat;
      });
      return { chats: updatedChats };
    });
  },
  contacts: [],
  setContacts: (updater) => set((state: any) => ({
    contacts: typeof updater === 'function' ? updater(state.contacts) : updater
  })),
  setContactMuted: (contactId, muted) => set((state: any) => ({
    contacts: state.contacts.map((c: Contact) => (c.id === contactId ? { ...c, muted } : c)),
  })),
  setContactBlocked: (contactId, blocked) => set((state: any) => ({
    contacts: state.contacts.map((c: Contact) => (c.id === contactId ? { ...c, isBlocked: blocked } : c)),
  })),
  channels: [],
  setChannels: (updater) => set((state: any) => ({
    channels: typeof updater === 'function' ? updater(state.channels) : updater
  })),
  bots: [],
  setBots: (updater) => set((state: any) => ({
    bots: typeof updater === 'function' ? updater(state.bots) : updater
  })),
  scheduledQueue: {
    messages: [],
    addMessage: (msg) => set((state: any) => ({ scheduledQueue: { ...state.scheduledQueue, messages: [...state.scheduledQueue.messages, msg] } })),
    removeMessage: (id) => set((state: any) => ({ scheduledQueue: { ...state.scheduledQueue, messages: state.scheduledQueue.messages.filter((m: any) => m.id !== id) } })),
    rescheduleMessage: (id, at) => set((state: any) => ({ scheduledQueue: { ...state.scheduledQueue, messages: state.scheduledQueue.messages.map((m: any) => m.id === id ? { ...m, scheduledAt: at } : m) } }))
  },
  archivedChats: [],
  toggleArchive: (id) => set((state: any) => ({
    archivedChats: state.archivedChats.includes(id) ? state.archivedChats.filter((i: string | number) => i !== id) : [...state.archivedChats, id]
  })),
  setChatUnread: (id, unread) => set((state: any) => ({
    chats: state.chats.map((c: any) => (
      c.id === id ? { ...c, unread: unread ? Math.max(1, Number(c.unread) || 0) : 0 } : c
    ))
  })),
  clearChatHistory: (chatId) => set((state: any) => ({
    chats: state.chats.map((c: any) => (
      c.id === chatId ? { ...c, history: [], messages: [], unread: 0 } : c
    )),
    // A pin points at a bubble that no longer exists; keeping it renders an
    // empty pinned bar the user cannot dismiss from the chat header.
    pinnedMessageList: state.pinnedMessageList.filter((p: any) => p.chatId !== chatId)
  })),
  pinChat: (chatId) => set((state: any) => {
    const pinnedCount = state.chats.filter((c: any) => c.pinned).length;
    const chat = state.chats.find((c: any) => c.id === chatId);
    if (!chat) return state;
    if (chat.pinned) return { chats: state.chats.map((c: any) => c.id === chatId ? { ...c, pinned: false } : c) };
    if (pinnedCount >= 3) return state;
    return { chats: state.chats.map((c: any) => c.id === chatId ? { ...c, pinned: true } : c) };
  }),
  setPinnedOrder: (orderedIds) => set((state: any) => ({
    chats: state.chats.map((c: any) => {
      if (!c.pinned) return c;
      const idx = orderedIds.findIndex((id: string | number) => String(id) === String(c.id));
      return idx >= 0 ? { ...c, pinRank: idx } : c;
    }),
  })),
  pinnedMessageList: [],
  addPinnedMessage: (pin) => set((state: any) => (
    state.pinnedMessageList.some((p: any) => p.id === pin.id && p.chatId === pin.chatId)
      ? state
      : { pinnedMessageList: [...state.pinnedMessageList, { ...pin, pinnedAt: state.pinnedMessageList.length }] }
  )),
  removePinnedMessage: (id, chatId) => set((state: any) => ({
    pinnedMessageList: state.pinnedMessageList.filter((p: any) => !(p.id === id && (chatId === undefined || p.chatId === chatId)))
  })),
});
