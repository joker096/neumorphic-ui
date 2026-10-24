import type { Contact } from '../../types/contact';
import type { ChatSlice } from './chatSlice';
import { makeId } from '../../lib/id';

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

/**
 * Group lifecycle actions of the chat slice. Kept in their own module so the
 * slice stays under the 300-line budget; the group `Pick` is typed against the
 * slice interface, so dropping or renaming an action breaks tsc.
 */
export type ChatGroupActions = Pick<
  ChatSlice,
  'createGroup' | 'updateGroup' | 'deleteGroup' | 'leaveGroup' | 'leaveChannel'
>;

export function chatGroupActions(set: any, get: any): ChatGroupActions {
  return {
    createGroup: ({ name, memberIds }) => {
      const profile = get().userProfile;
      const contacts = get().contacts;
      const id = `group_${makeId()}`;
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
  };
}
