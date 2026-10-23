import { HOUR_MS, DAY_MS } from "../constants/time";
import { isChatMuteActive } from "../store/slices/chatSlice";
import { buildMenuIcon, type ContextMenuItem } from "../components/chat-preview/ChatContextMenu";

export type { ContextMenuItem } from "../components/chat-preview/ChatContextMenu";

/**
 * Telegram-style mute presets offered by the chat context menu. "Forever" is
 * the historical behaviour (a plain muted flag), the rest store an absolute
 * deadline that `useChatMuteExpiry` clears once it passes.
 */
export const MUTE_PRESETS: Array<{ id: string; label: string; ms: number | "forever" }> = [
  { id: "mute1h", label: "chat.mute1h", ms: HOUR_MS },
  { id: "mute8h", label: "chat.mute8h", ms: 8 * HOUR_MS },
  { id: "mute2d", label: "chat.mute2d", ms: 2 * DAY_MS },
  { id: "muteForever", label: "chat.muteForever", ms: "forever" },
];

export interface ChatListMenuDeps {
  chat: any;
  activeFolder: string;
  toggleArchive: (id: string | number) => void;
  t: (key: string, options?: any) => string;
  onPin: (chat: any) => void;
  onMute: (chat: any) => void;
  onMuteFor: (chat: any, ms: number | "forever") => void;
  onToggleUnread: (chat: any) => void;
  onSelect: (chat: any) => void;
  onExport: (chat: any) => void;
  onClearHistory: (chat: any) => void;
  onDelete: (chat: any) => void;
}

/**
 * Build the chat context-menu items. Kept pure (no hook state) so it can live
 * outside `useChatListActions` and be unit-tested in isolation; all actions are
 * injected as callbacks by the hook.
 */
export function buildChatListMenuItems({
  chat,
  activeFolder,
  toggleArchive,
  t,
  onPin,
  onMute,
  onMuteFor,
  onToggleUnread,
  onSelect,
  onExport,
  onClearHistory,
  onDelete,
}: ChatListMenuDeps): ContextMenuItem[] {
  return [
    {
      id: chat.pinned ? "unpin" : "pin",
      label: t(chat.pinned ? "chat.unpin" : "chat.pin"),
      icon: buildMenuIcon(chat.pinned ? "unpin" : "pin"),
      onClick: () => onPin(chat),
    },
    ...(isChatMuteActive(chat)
      ? [{
          id: "unmute",
          label: t("chat.unmute"),
          icon: buildMenuIcon("unmute"),
          onClick: () => onMute(chat),
        }]
      : MUTE_PRESETS.map(({ id, label, ms }) => ({
          id,
          label: t(label),
          icon: buildMenuIcon("mute"),
          onClick: () => onMuteFor(chat, ms),
        }))),
    {
      id: chat.unread ? "markRead" : "markUnread",
      label: t(chat.unread ? "chat.markRead" : "chat.markUnread"),
      icon: buildMenuIcon(chat.unread ? "markRead" : "markUnread"),
      onClick: () => onToggleUnread(chat),
    },
    {
      id: activeFolder === "archived" ? "unarchive" : "archive",
      label: activeFolder === "archived" ? t("chat.unarchive") : t("chat.archive"),
      icon: buildMenuIcon(activeFolder === "archived" ? "unarchive" : "archive"),
      onClick: () => toggleArchive(chat.id),
    },
    {
      id: "select",
      label: t("chat.select"),
      icon: buildMenuIcon("select"),
      onClick: () => onSelect(chat),
    },
    {
      id: "export",
      label: t("chat.export"),
      icon: buildMenuIcon("export"),
      onClick: () => onExport(chat),
    },
    {
      id: "clearHistory",
      label: t("chat.clearHistory"),
      icon: buildMenuIcon("clearHistory"),
      onClick: () => onClearHistory(chat),
    },
    {
      id: "delete",
      label: t("chat.delete"),
      icon: buildMenuIcon("delete"),
      danger: true,
      onClick: () => onDelete(chat),
    },
  ];
}
