import { useMemo, useRef, useState, type ReactElement } from "react";
import { AvatarRow, BulkActionsBar, FolderFilterBar, ViewTabs, ChatListSearchHeader, ChatListBots, ChatListSortControls } from "./chat-preview";
import { ChatListDialogs } from "./chat-list/ChatListDialogs";
import type { ChatFolder } from "../lib/chat/customFolders";
import { useGlobalSearchToggle } from "./chat-list/ChatListOverlays";
import { useChatListActions } from "../hooks/useChatListActions";
import { buildChatRows } from "./chat-list/buildChatRows";
import { ChatListVirtualRows, useChatListRowRenderer } from "./chat-list/ChatListBody";
import { ChatListEmptyState } from "./chat-list/ChatListEmptyState";
import { ChatListPinnedSection } from "./chat-list/ChatListPinnedSection";
import { CrmNextStepsBanner } from "./crm/CrmNextStepsBanner";
import { useAppStore } from "../store";
import { useUiStore } from "../store/uiStore";
import { CRM_SEGMENT_KEYS } from "../constants/chatConstants";

type Translate = (key: string, options?: any) => string;

interface ChatListViewProps {
  theme: "light" | "dark";
  view: string;
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  chatSortBy?: "recent" | "alpha";
  setChatSortBy?: (sort: "recent" | "alpha") => void;
  chatSearchQuery: string;
  setChatSearchQuery: (query: string) => void;
  filteredChats: any[];
  filteredChannels: any[];
  /** Unread totals per folder key, rendered as counters on the folder tabs. */
  folderUnread?: Record<string, number>;
  /** User-created folders; rendered in the filter bar and editable via the manager. */
  customFolders?: ChatFolder[];
  bots: any[];
  archivedUnreadCount: number;
  toggleArchive: (id: string | number) => void;
  contacts: any[];
  setGlobalSelectedContact: (contact: any) => void;
  setActiveChat: (chat: any) => void;
  onOpenChat?: (chat: any, opts?: { returnTo?: { view: string; subView?: string | null }; forceView?: string }) => void;
  activeChatId?: string | number | null;
  setView: (view: string) => void;
  setActiveStory: (story: any) => void;
  onComposeStory?: () => void;
  setShowCreateChannel: (show: boolean) => void;
  setShowCreateBot: (show: boolean) => void;
  setShowCreateGroup?: (show: boolean) => void;
  setShowAdvancedFilterModal: (show: boolean) => void;
  advancedFilters: Record<string, boolean>;
  t: Translate;
  isDark?: boolean;
  onCall: (name: string, color?: string) => void;
  onVideoCall: (name: string, color?: string) => void;
  onOpenBot?: (botId: string) => void;
  showAddContactFromChat?: boolean;
  setShowAddContactFromChat?: (show: boolean) => void;
  onAddContactFromChat?: (name: string, id: string, color?: string, localFields?: any[]) => void;
  draftTextByChat?: Record<string, string>;
}

export const ChatListView = ({
  theme,
  view,
  activeFolder,
  setActiveFolder,
  chatSortBy = "recent",
  setChatSortBy,
  chatSearchQuery,
  setChatSearchQuery,
  filteredChats,
  filteredChannels,
  folderUnread = {},
  customFolders = [],
  bots,
  archivedUnreadCount,
  toggleArchive,
  contacts,
  setGlobalSelectedContact,
  setActiveChat,
  onOpenChat,
  activeChatId,
  setView,
  setActiveStory,
  onComposeStory,
  setShowCreateChannel,
  setShowCreateBot,
  setShowCreateGroup,
  setShowAdvancedFilterModal,
  advancedFilters,
  t,
  isDark = false,
  onCall,
  onVideoCall,
  onOpenBot,
  showAddContactFromChat,
  setShowAddContactFromChat,
  onAddContactFromChat,
  draftTextByChat,
}: ChatListViewProps) => {
  const [globalSearchOpen, setGlobalSearchOpen] = useGlobalSearchToggle();
  const [folderManagerOpen, setFolderManagerOpen] = useState(false);
  const premium = Boolean(useAppStore((s) => s.premiumEntitlement?.premium));
  const crmContacts = useAppStore((s) => s.crmContacts);
  const crmSegments = crmContacts.length ? CRM_SEGMENT_KEYS : [];
  const requestCrmTab = useUiStore((s) => s.requestCrmTab);

  const {
    selectMode,
    selectedIds,
    handleToggleSelect,
    handleCancelSelect,
    handleBulkArchive,
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
    deleteConfirm,
    requestMenuDelete,
    requestBulkDelete,
    cancelDelete,
    confirmDelete,
  } = useChatListActions({ t, activeFolder, toggleArchive, setActiveChat, activeChatId });

  const pinnedChats = useMemo(
    () => filteredChats.filter((c: any) => c.pinned).sort((a: any, b: any) => (a.pinRank ?? Infinity) - (b.pinRank ?? Infinity)),
    [filteredChats],
  );
  const regularChats = useMemo(() => filteredChats.filter((c: any) => !c.pinned), [filteredChats]);
  // "Mark all as read" is only worth a control when the visible list actually
  // has unread chats — otherwise it is a tap that can never change anything.
  const hasFilteredUnread = useMemo(
    () => filteredChats.some((c: any) => Number(c.unread) > 0),
    [filteredChats],
  );

  const rows = useMemo(
    () => buildChatRows({ view, regularChats, filteredChannels, t }),
    [view, regularChats, filteredChannels, t]
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  const renderRow = useChatListRowRenderer({
    theme,
    t,
    activeChatId,
    activeFolder,
    selectMode,
    selectedIds,
    contacts,
    draftTextByChat,
    handleChatOpen,
    onOpenChat,
    toggleArchive,
    handleMenuMute,
    handleMenuPin,
    handleMenuToggleUnread,
    handleMenuDelete,
    onCall,
    onVideoCall,
    handleToggleSelect,
    openMenu,
    setGlobalSelectedContact,
  });

  return (
    <div className={"w-full flex-1 flex flex-col overflow-hidden px-3 md:px-5 py-3 md:py-5 bg-[var(--bg-secondary)]/50 dark:bg-[var(--bg-primary)]/50"}>
      <ChatListSearchHeader
        isDark={isDark}
        view={view}
        chatSearchQuery={chatSearchQuery}
        setChatSearchQuery={setChatSearchQuery}
        archivedUnreadCount={archivedUnreadCount}
        t={t}
        setView={setView}
        setActiveFolder={setActiveFolder}
        setShowCreateChannel={setShowCreateChannel}
        setShowCreateBot={setShowCreateBot}
        setShowCreateGroup={setShowCreateGroup}
        onOpenGlobalSearch={() => setGlobalSearchOpen(true)}
      />
      <ViewTabs view={view} onSelect={setView} t={t} />

      {view === "chats" && premium && (
        <CrmNextStepsBanner
          onOpenTasks={() => {
            requestCrmTab("tasks");
            setView("company");
          }}
        />
      )}

      {view === "chats" && (
        <>
          <FolderFilterBar
                        activeFolder={activeFolder}
            setActiveFolder={setActiveFolder}
            advancedFilters={advancedFilters}
            setShowAdvancedFilterModal={setShowAdvancedFilterModal}
            t={t}
            segments={crmSegments}
            folderUnread={folderUnread}
            customFolders={customFolders}
            onEditFolders={() => setFolderManagerOpen(true)}
          />
          <ChatListSortControls
            chatSortBy={chatSortBy}
            setChatSortBy={setChatSortBy}
            hasFilteredUnread={hasFilteredUnread}
            onMarkAllRead={() => handleMarkAllRead(filteredChats.map((c: any) => c.id))}
            t={t}
            isDark={isDark}
          />
        </>
      )}

      {view === "chats" && <AvatarRow theme={theme} onStoryClick={setActiveStory} onComposeStory={onComposeStory} t={t} />}

      {view === "chats" && filteredChats.length > 0 && selectMode && (
        <BulkActionsBar
                    selectedIds={selectedIds}
          t={t}
          onCancel={handleCancelSelect}
          onArchive={handleBulkArchive}
          onDelete={requestBulkDelete}
          onMarkRead={handleBulkMarkRead}
          onToggleMute={handleBulkMute}
        />
      )}

      <div ref={scrollRef} className="chat-list flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {view === "chats" && pinnedChats.length > 0 && !selectMode && (
          <ChatListPinnedSection
            pinnedChats={pinnedChats}
            renderRow={renderRow}
            onReorder={handleReorderPinned}
            t={t}
          />
        )}

        <ChatListVirtualRows rows={rows} scrollRef={scrollRef} renderRow={renderRow} />

        {view === "bots" && (
          <ChatListBots bots={bots} onOpenBot={onOpenBot} isDark={isDark} t={t} />
        )}

        {view !== "bots" && filteredChats.length === 0 && filteredChannels.length === 0 && (
          <ChatListEmptyState
            view={view}
            isDark={isDark}
            hasSearchQuery={!!chatSearchQuery.trim()}
            activeFolder={activeFolder}
            t={t}
            onClearSearch={() => setChatSearchQuery("")}
            setShowCreateGroup={setShowCreateGroup}
            setShowCreateChannel={setShowCreateChannel}
            setShowAddContactFromChat={setShowAddContactFromChat}
          />
        )}
      </div>

      <ChatListDialogs
        menu={menu}
        menuItems={menuItems}
        closeMenu={closeMenu}
        deleteConfirm={deleteConfirm}
        selectedCount={selectedIds.size}
        theme={theme}
        t={t}
        onConfirmDelete={confirmDelete}
        onCancelDelete={cancelDelete}
        folderManagerOpen={folderManagerOpen}
        setFolderManagerOpen={setFolderManagerOpen}
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
        globalSearchOpen={globalSearchOpen}
        isDark={isDark}
        filteredChats={filteredChats}
        filteredChannels={filteredChannels}
        contacts={contacts}
        onCloseGlobalSearch={() => setGlobalSearchOpen(false)}
        onOpenChatFromSearch={(c) => {
          handleChatOpen(c);
          onOpenChat?.(c);
        }}
        onOpenContact={(c) => setGlobalSelectedContact(c)}
      />
    </div>
  );
};
