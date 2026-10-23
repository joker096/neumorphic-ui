import { useState, useMemo } from "react";
import { useAppStore } from "../store";
import { applyChatMute, isChatMuteActive } from "../store/slices/chatSlice";
import { releaseMessageMedia } from "../lib/messageMedia";
import { downloadChatExport } from "../lib/chatExport";
import { toast } from "../components/ui/Toast";
import { type MenuAnchorRect } from "../components/chat-preview/ChatContextMenu";
import { buildChatListMenuItems, type ContextMenuItem } from "./chatListMenuItems";

interface UseChatListActionsArgs {
  t: (key: string, options?: any) => string;
  activeFolder: string;
  toggleArchive: (id: string | number) => void;
  setActiveChat: (chat: any | null) => void;
  activeChatId?: string | number | null;
}

export function useChatListActions({ t, activeFolder, toggleArchive, setActiveChat, activeChatId }: UseChatListActionsArgs) {
  const { setChats, setChatUnread, setChatMuteUntil, clearChatHistory, userProfile, setPinnedOrder } = useAppStore();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [menu, setMenu] = useState<{ chat: any; anchor: { x: number; y: number } | null; anchorRect: MenuAnchorRect | null } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<
    | { kind: "single"; chat: any }
    | { kind: "clear"; chat: any }
    | { kind: "bulk" }
    | null
  >(null);

  const handleToggleSelect = (chatId: string | number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(chatId)) next.delete(chatId);
      else next.add(chatId);
      return next;
    });
  };

  const handleCancelSelect = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkArchive = () => {
    selectedIds.forEach(id => toggleArchive(id));
    handleCancelSelect();
  };

  const handleBulkDelete = () => {
    setChats(prev => prev.filter((c: any) => !selectedIds.has(c.id)));
    handleCancelSelect();
  };

  const handleBulkMarkRead = () => {
    setChats(prev => prev.map((c: any) => selectedIds.has(c.id) ? { ...c, unread: 0 } : c));
    handleCancelSelect();
  };

  /**
   * One-tap "mark all as read" for the chats currently on screen: the caller
   * passes the filtered ids, so the action honours the active folder, search
   * query and advanced filters instead of silently clearing hidden chats.
   * Returns the previous state object when nothing had unread — otherwise every
   * tap would rewrite the whole `chats_all` snapshot for no reason.
   */
  const handleMarkAllRead = (ids: Array<string | number>) => {
    const scope = new Set(ids);
    if (scope.size === 0) return;
    setChats((prev: any[]) => {
      let changed = false;
      const next = prev.map((c: any) => {
        if (!scope.has(c.id) || !c.unread) return c;
        changed = true;
        return { ...c, unread: 0 };
      });
      return changed ? next : prev;
    });
  };

  const handleBulkMute = () => {
    // Bulk stays a plain toggle (no duration picker): mute forever / unmute.
    setChats(prev => prev.map((c: any) => selectedIds.has(c.id) ? applyChatMute(c, !isChatMuteActive(c)) : c));
    handleCancelSelect();
  };

  const handleMenuPin = (chat: any) => {
    setChats(prev => {
      const willPin = !chat.pinned;
      if (!willPin) {
        // Unpin: drop the rank too, so the next pin finds a clean slot.
        return prev.map((c: any) => c.id === chat.id ? { ...c, pinned: false, pinRank: undefined } : c);
      }
      const nextRank = prev.reduce(
        (mx: number, c: any) => (c.pinned && typeof c.pinRank === "number" ? Math.max(mx, c.pinRank) : mx),
        -1,
      );
      return prev.map((c: any) => c.id === chat.id ? { ...c, pinned: true, pinRank: nextRank + 1 } : c);
    });
  };
  /**
   * Framer `Reorder` hands us the pinned chats in their new visual order; we
   * persist the ids so the section keeps the user's arrangement across reloads.
   */
  const handleReorderPinned = (ordered: any[]) => {
    setPinnedOrder(ordered.map((c: any) => c.id));
  };
  /** Toggle used by the swipe drawer: mute forever, or unmute a mute of any kind. */
  const handleMenuMute = (chat: any) => {
    setChatMuteUntil(chat.id, isChatMuteActive(chat) ? null : "forever");
  };
  const handleMenuMuteFor = (chat: any, ms: number | "forever") => {
    setChatMuteUntil(chat.id, ms === "forever" ? "forever" : Date.now() + ms);
  };
  const handleMenuMarkRead = (chat: any) => {
    setChatUnread(chat.id, false);
  };
  /** Telegram behaviour: the row toggles — read chats can be pushed back to unread. */
  const handleMenuToggleUnread = (chat: any) => {
    setChatUnread(chat.id, !chat.unread);
  };
  const handleChatOpen = (chat: any) => {
    if (chat?.unread) setChatUnread(chat.id, false);
    setActiveChat(chat);
  };
  const handleMenuDelete = (chat: any) => {
    setChats(prev => prev.filter((c: any) => c.id !== chat.id));
    if (activeChatId != null && activeChatId === chat.id) setActiveChat(null);
  };
  const handleMenuSelect = (chat: any) => {
    setSelectMode(true);
    setSelectedIds(new Set([chat.id]));
  };
  /**
   * Telegram's "Clear history": the chat stays in the list, its bubbles go.
   * Media is released first — after the clear the message ids are unreachable,
   * so nothing could evict their IDB records or revoke their object URLs later.
   */
  const handleMenuClearHistory = (chat: any) => {
    void releaseMessageMedia(chat.history ?? chat.messages ?? []);
    clearChatHistory(chat.id);
    // The open chat renders from the App-level activeChat snapshot rather than
    // straight from the store, so an open copy would keep painting dead bubbles.
    if (activeChatId != null && activeChatId === chat.id) {
      setActiveChat({ ...chat, history: [], messages: [], unread: 0 });
    }
  };

  /**
   * Telegram's "Export chat history" in the lightest useful form: a readable
   * `.txt` transcript. Media is described by kind instead of embedded — this is
   * a record for reading/grepping, the encrypted backup is `lib/backup.ts`.
   */
  const handleMenuExport = (chat: any) => {
    downloadChatExport(chat, {
      labels: {
        selfName: String(userProfile?.name ?? "me"),
        title: t("chat.export"),
        photo: t("chat.photo"),
        video: t("chat.video"),
        voice: t("chat.voiceNote").replace(/[\s•]+$/, ""),
        file: t("chat.file"),
        article: t("chat.article"),
        location: t("chat.location"),
        sticker: t("a11y.sticker"),
        poll: t("chat.createPoll"),
      },
    });
    toast(t("chat.exportDone"), "success");
  };

  const requestMenuDelete = (chat: any) => {
    setDeleteConfirm({ kind: "single", chat });
  };
  const requestClearHistory = (chat: any) => {
    setDeleteConfirm({ kind: "clear", chat });
  };
  const requestBulkDelete = () => {
    setDeleteConfirm({ kind: "bulk" });
  };
  const cancelDelete = () => setDeleteConfirm(null);
  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.kind === "single") {
      handleMenuDelete(deleteConfirm.chat);
    } else if (deleteConfirm.kind === "clear") {
      handleMenuClearHistory(deleteConfirm.chat);
    } else {
      handleBulkDelete();
    }
    setDeleteConfirm(null);
  };

  const openMenu = (chat: any, anchor: { x: number; y: number } | null, anchorRect: MenuAnchorRect | null = null) => {
    setMenu({ chat, anchor, anchorRect });
  };

  const closeMenu = () => setMenu(null);

  const menuItems: ContextMenuItem[] = useMemo(() => {
    if (!menu) return [];
    return buildChatListMenuItems({
      chat: menu.chat,
      activeFolder,
      toggleArchive,
      t,
      onPin: handleMenuPin,
      onMute: handleMenuMute,
      onMuteFor: handleMenuMuteFor,
      onToggleUnread: handleMenuToggleUnread,
      onSelect: handleMenuSelect,
      onExport: handleMenuExport,
      onClearHistory: requestClearHistory,
      onDelete: requestMenuDelete,
    });
  }, [menu, t, activeFolder, toggleArchive]);

  return {
    selectMode,
    selectedIds,
    handleToggleSelect,
    handleCancelSelect,
    handleBulkArchive,
    handleBulkDelete,
    handleBulkMarkRead,
    handleBulkMute,
    handleMarkAllRead,
    menu,
    openMenu,
    closeMenu,
    menuItems,
    handleMenuMute,
    handleMenuPin,
    handleReorderPinned,
    handleMenuToggleUnread,
    handleChatOpen,
    handleMenuDelete,
    handleMenuClearHistory,
    deleteConfirm,
    requestMenuDelete,
    requestClearHistory,
    requestBulkDelete,
    cancelDelete,
    confirmDelete,
  };
}
