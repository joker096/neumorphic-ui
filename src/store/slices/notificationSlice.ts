import { fireOsNotification } from '../../lib/notifications/osNotify';

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
  messagePreview: boolean;
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

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  allMessages: true,
  mentions: true,
  replies: true,
  calls: true,
  groups: true,
  channels: true,
  sounds: true,
  desktop: true,
  mobile: true,
  messagePreview: true,
};

export function isNotificationKindEnabled(kind: NotificationKind, s: NotificationSettings): boolean {
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
  notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
  browserPermission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
  pushNotification: ({ title, body, kind = 'system', chatId }) => {
    const st = get();
    const settings = st.notificationSettings as NotificationSettings;
    if (!isNotificationKindEnabled(kind, settings)) return;
    const item: NotificationItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      body,
      kind,
      chatId,
      createdAt: Date.now(),
      read: false,
    };
    set((s: any) => ({
      notificationItems: [item, ...s.notificationItems].slice(0, 100),
      unreadCount: s.unreadCount + 1,
    }));
    // Mirror to an OS notification when permission is granted and the user has
    // mobile/desktop notifications enabled. The body is withheld when the
    // "message preview" setting is off; the chat id always travels for
    // tap-to-open.
    if (st.browserPermission === 'granted' && (settings.mobile || settings.desktop)) {
      fireOsNotification(title, settings.messagePreview ? body : undefined, chatId);
    }
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
