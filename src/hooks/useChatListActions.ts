import { useState, useMemo } from "react";
import { useAppStore } from "../store";
import { buildMenuIcon, type ContextMenuItem } from "../components/chat-preview/ChatContextMenu";

interface UseChatListActionsArgs {
  t: (key: string, options?: any) => string;
  activeFolder: string;
  toggleArchive: (id: string | number) => void;
  setActiveChat: (chat: any | null) => void;
  activeChatId?: string | number | null;
}

export function useChatListActions({ t, activeFolder, toggleArchive, setActiveChat, activeChatId }: UseChatListActionsArgs) {
  const { setChats } = useAppStore();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [menu, setMenu] = useState<{ chat: any; anchor: { x: number; y: number } | null } | null>(null);

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

  const handleMenuPin = (chat: any) => {
    setChats(prev => prev.map((c: any) => c.id === chat.id ? { ...c, pinned: !c.pinned } : c));
  };
  const handleMenuMute = (chat: any) => {
    setChats(prev => prev.map((c: any) => c.id === chat.id ? { ...c, isMuted: !c.isMuted } : c));
  };
  const handleMenuMarkRead = (chat: any) => {
    setChats(prev => prev.map((c: any) => c.id === chat.id ? { ...c, unread: 0 } : c));
  };
  const handleMenuDelete = (chat: any) => {
    setChats(prev => prev.filter((c: any) => c.id !== chat.id));
    if (activeChatId != null && activeChatId === chat.id) setActiveChat(null);
  };
  const handleMenuSelect = (chat: any) => {
    setSelectMode(true);
    setSelectedIds(new Set([chat.id]));
  };

  const openMenu = (chat: any, anchor: { x: number; y: number } | null) => {
    setMenu({ chat, anchor });
  };

  const closeMenu = () => setMenu(null);

  const menuItems: ContextMenuItem[] = useMemo(() => {
    if (!menu) return [];
    return [
      {
        id: menu.chat.pinned ? "unpin" : "pin",
        label: t(menu.chat.pinned ? "chat.unpin" : "chat.pin"),
        icon: buildMenuIcon(menu.chat.pinned ? "unpin" : "pin"),
        onClick: () => handleMenuPin(menu.chat),
      },
      {
        id: menu.chat.isMuted ? "unmute" : "mute",
        label: t(menu.chat.isMuted ? "chat.unmute" : "chat.mute"),
        icon: buildMenuIcon(menu.chat.isMuted ? "unmute" : "mute"),
        onClick: () => handleMenuMute(menu.chat),
      },
      {
        id: "markRead",
        label: t("chat.markRead"),
        icon: buildMenuIcon("markRead"),
        disabled: !menu.chat.unread,
        onClick: () => handleMenuMarkRead(menu.chat),
      },
      {
        id: activeFolder === "archived" ? "unarchive" : "archive",
        label: activeFolder === "archived" ? t("chat.unarchive") : t("chat.archive"),
        icon: buildMenuIcon(activeFolder === "archived" ? "unarchive" : "archive"),
        onClick: () => toggleArchive(menu.chat.id),
      },
      {
        id: "select",
        label: t("chat.select"),
        icon: buildMenuIcon("select"),
        onClick: () => handleMenuSelect(menu.chat),
      },
      {
        id: "delete",
        label: t("chat.delete"),
        icon: buildMenuIcon("delete"),
        danger: true,
        onClick: () => handleMenuDelete(menu.chat),
      },
    ];
  }, [menu, t, activeFolder, toggleArchive, activeChatId]);

  return {
    selectMode,
    selectedIds,
    handleToggleSelect,
    handleCancelSelect,
    handleBulkArchive,
    handleBulkDelete,
    handleBulkMarkRead,
    menu,
    openMenu,
    closeMenu,
    menuItems,
  };
}
