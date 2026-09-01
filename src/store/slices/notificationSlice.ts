export type NotificationKind = 'message' | 'mention' | 'reply' | 'call' | 'group' | 'channel' | 'system';

export interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  kind: NotificationKind;
  chatId?: string;
  createdAt: number;
  read: boolean;
}

export interface NotificationSettings {
  allMessages: boolean;
  mentions: boolean;
  replies: boolean;
  calls: boolean;
  groups: boolean;
  channels: boolean;
  sounds: boolean;
  desktop: boolean;
  mobile: boolean;
}

export interface NotificationSlice {
  notificationItems: NotificationItem[];
  unreadCount: number;
  notificationSettings: NotificationSettings;
  browserPermission: NotificationPermission;
  pushNotification: (input: { title: string; body?: string; kind?: NotificationKind; chatId?: string }) => void;
  markNotificationsRead: () => void;
  clearNotifications: () => void;
  setNotificationSettings: (partial: Partial<NotificationSettings>) => void;
  setBrowserPermission: (perm: NotificationPermission) => void;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  allMessages: true,
  mentions: true,
  replies: true,
  calls: true,
  groups: true,
  channels: true,
  sounds: true,
  desktop: true,
  mobile: true,
};

function kindEnabled(kind: NotificationKind, s: NotificationSettings): boolean {
  switch (kind) {
    case 'message': return s.allMessages;
    case 'mention': return s.mentions;
    case 'reply': return s.replies;
    case 'call': return s.calls;
    case 'group': return s.groups;
    case 'channel': return s.channels;
    default: return true;
  }
}

export const createNotificationSlice = (set: any, get: any): NotificationSlice => ({
  notificationItems: [],
  unreadCount: 0,
  notificationSettings: DEFAULT_SETTINGS,
  browserPermission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
  pushNotification: ({ title, body, kind = 'system', chatId }) => {
    const settings = get().notificationSettings as NotificationSettings;
    if (!kindEnabled(kind, settings)) return;
    const item: NotificationItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      body,
      kind,
      chatId,
      createdAt: Date.now(),
      read: false,
    };
    set((st: any) => ({
      notificationItems: [item, ...st.notificationItems].slice(0, 100),
      unreadCount: st.unreadCount + 1,
    }));
  },
  markNotificationsRead: () =>
    set((st: any) => ({
      unreadCount: 0,
      notificationItems: st.notificationItems.map((n: NotificationItem) => ({ ...n, read: true })),
    })),
  clearNotifications: () => set({ notificationItems: [], unreadCount: 0 }),
  setNotificationSettings: (partial) =>
    set((st: any) => ({ notificationSettings: { ...st.notificationSettings, ...partial } })),
  setBrowserPermission: (perm) => set({ browserPermission: perm }),
});
