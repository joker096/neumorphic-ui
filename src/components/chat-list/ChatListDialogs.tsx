import { ChatContextMenu, type MenuAnchorRect } from "../chat-preview/ChatContextMenu";
import { ChatListConfirmDialog } from "../chat-preview/ChatListConfirmDialog";
import { FolderManagerModal } from "../chat-preview/FolderManagerModal";
import { ChatListOverlays } from "./ChatListOverlays";

type Translate = (key: string, options?: any) => string;

interface ChatListDialogsProps {
  menu: { chat: any; anchor: { x: number; y: number } | null; anchorRect: MenuAnchorRect | null } | null;
  menuItems: any[];
  closeMenu: () => void;
  deleteConfirm: any;
  selectedCount: number;
  theme: "light" | "dark";
  t: Translate;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  folderManagerOpen: boolean;
  setFolderManagerOpen: (open: boolean) => void;
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  globalSearchOpen: boolean;
  isDark: boolean;
  filteredChats: any[];
  filteredChannels: any[];
  contacts: any[];
  onCloseGlobalSearch: () => void;
  onOpenChatFromSearch: (chat: any) => void;
  onOpenContact: (contact: any) => void;
}

/**
 * Every overlay and modal the chat list can open: the context menu, the delete
 * confirm dialog, the folder manager and the global search overlay. Grouped so
 * the list component stays focused on rows and ordering.
 */
export function ChatListDialogs({
  menu,
  menuItems,
  closeMenu,
  deleteConfirm,
  selectedCount,
  theme,
  t,
  onConfirmDelete,
  onCancelDelete,
  folderManagerOpen,
  setFolderManagerOpen,
  activeFolder,
  setActiveFolder,
  globalSearchOpen,
  isDark,
  filteredChats,
  filteredChannels,
  contacts,
  onCloseGlobalSearch,
  onOpenChatFromSearch,
  onOpenContact,
}: ChatListDialogsProps) {
  return (
    <>
      {menu && (
        <ChatContextMenu
          anchor={menu.anchor}
          anchorRect={menu.anchorRect}
          items={menuItems}
          onClose={closeMenu}
        />
      )}

      <ChatListConfirmDialog
        deleteConfirm={deleteConfirm}
        selectedCount={selectedCount}
        theme={theme}
        t={t}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />

      <FolderManagerModal
        open={folderManagerOpen}
        onClose={() => setFolderManagerOpen(false)}
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
        t={t}
      />

      {globalSearchOpen && (
        <ChatListOverlays
          isDark={isDark}
          chats={filteredChats}
          channels={filteredChannels}
          contacts={contacts}
          onClose={onCloseGlobalSearch}
          onOpenChat={onOpenChatFromSearch}
          onOpenContact={onOpenContact}
          t={t}
        />
      )}
    </>
  );
}
