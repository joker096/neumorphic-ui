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
  setChatMuted: (chatId: string, muted: boolean) => void;
  setChats: (updater: any[] | ((prev: any[]) => any[])) => void;
  forwardMessage: (message: any, targetChatId: string) => void;
  contacts: Contact[];
  setContacts: (updater: Contact[] | ((prev: Contact[]) => Contact[])) => void;
  setContactMuted: (contactId: string, muted: boolean) => void;
  setContactBlocked: (contactId: string, blocked: boolean) => void;
  favoriteContacts: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  channels: P2PChannel[];
  setChannels: (updater: P2PChannel[] | ((prev: P2PChannel[]) => P2PChannel[])) => void;
  bots: BotConfig[];
  setBots: (updater: BotConfig[] | ((prev: BotConfig[]) => BotConfig[])) => void;
  scheduledQueue: { messages: ScheduledMessage[]; addMessage: (msg: ScheduledMessage) => void; removeMessage: (id: string) => void };
  archivedChats: (string | number)[];
  toggleArchive: (id: string | number) => void;
  pinChat: (chatId: string | number) => void;
  pinnedMessageList: Array<{ id: number; chatId: string | number; pinBy: string; pinnedAt: number }>;
  addPinnedMessage: (pin: { id: number; chatId: string | number; pinBy: string }) => void;
  removePinnedMessage: (id: number, chatId?: string | number) => void;
}

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
    chats: state.chats.map((chat: any) => (chat.id === chatId ? { ...chat, muted } : chat)),
  })),
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
  favoriteContacts: [],
  addFavorite: (id) => set((state: any) => ({
    favoriteContacts: state.favoriteContacts.includes(id) ? state.favoriteContacts : [...state.favoriteContacts, id]
  })),
  removeFavorite: (id) => set((state: any) => ({
    favoriteContacts: state.favoriteContacts.filter((i: string) => i !== id)
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
    removeMessage: (id) => set((state: any) => ({ scheduledQueue: { ...state.scheduledQueue, messages: state.scheduledQueue.messages.filter((m: any) => m.id !== id) } }))
  },
  archivedChats: [],
  toggleArchive: (id) => set((state: any) => ({
    archivedChats: state.archivedChats.includes(id) ? state.archivedChats.filter((i: string | number) => i !== id) : [...state.archivedChats, id]
  })),
  pinChat: (chatId) => set((state: any) => {
    const pinnedCount = state.chats.filter((c: any) => c.pinned).length;
    const chat = state.chats.find((c: any) => c.id === chatId);
    if (!chat) return state;
    if (chat.pinned) return { chats: state.chats.map((c: any) => c.id === chatId ? { ...c, pinned: false } : c) };
    if (pinnedCount >= 3) return state;
    return { chats: state.chats.map((c: any) => c.id === chatId ? { ...c, pinned: true } : c) };
  }),
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
