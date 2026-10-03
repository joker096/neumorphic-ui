import { useMemo, useRef } from "react";
import { Trash2, ArrowDownAZ } from "lucide-react";
import { AvatarRow, BulkActionsBar, FolderFilterBar, ViewTabs, ChatListSearchHeader, ChatListBots } from "./chat-preview";
import { ChatContextMenu } from "./chat-preview/ChatContextMenu";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { useChatListActions } from "../hooks/useChatListActions";
import { buildChatRows } from "./chat-list/buildChatRows";
import { ChatListVirtualRows, useChatListRowRenderer } from "./chat-list/ChatListBody";
import { ChatListEmptyState } from "./chat-list/ChatListEmptyState";
import { ChatListOverlays, useGlobalSearchToggle } from "./chat-list/ChatListOverlays";
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
    menu,
    openMenu,
    closeMenu,
    menuItems,
    handleMenuMute,
    handleChatOpen,
    handleMenuDelete,
    deleteConfirm,
    requestMenuDelete,
    requestBulkDelete,
    cancelDelete,
    confirmDelete,
  } = useChatListActions({ t, activeFolder, toggleArchive, setActiveChat, activeChatId });

  const pinnedChats = useMemo(() => filteredChats.filter((c: any) => c.pinned), [filteredChats]);
  const regularChats = useMemo(() => filteredChats.filter((c: any) => !c.pinned), [filteredChats]);

  const rows = useMemo(
    () => buildChatRows({ view, pinnedChats, regularChats, filteredChannels, t }),
    [view, pinnedChats, regularChats, filteredChannels, t]
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
    handleMenuDelete,
    onCall,
    onVideoCall,
    handleToggleSelect,
    openMenu,
    setGlobalSelectedContact,
  });

  return (
    <div className={`w-full flex-1 flex flex-col overflow-hidden px-3 md:px-5 py-3 md:py-5 ${isDark ? "bg-[var(--bg-primary)]/50" : "bg-[var(--bg-secondary)]/50"}`}>
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
      <ViewTabs view={view} isDark={isDark} onSelect={setView} t={t} />

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
            isDark={isDark}
            activeFolder={activeFolder}
            setActiveFolder={setActiveFolder}
            advancedFilters={advancedFilters}
            setShowAdvancedFilterModal={setShowAdvancedFilterModal}
            t={t}
            segments={crmSegments}
          />
          {setChatSortBy && (
            <div className="flex justify-end pb-2 -mt-1">
              <button
                type="button"
                onClick={() => setChatSortBy(chatSortBy === "alpha" ? "recent" : "alpha")}
                aria-pressed={chatSortBy === "alpha"}
                aria-label={chatSortBy === "alpha" ? t("chat.sortByRecent", "Sort by date") : t("chat.sortByName", "Sort by name")}
                title={chatSortBy === "alpha" ? t("chat.sortByRecent", "Sort by date") : t("chat.sortByName", "Sort by name")}
                className="group min-h-11 min-w-11 p-1 flex items-center justify-center rounded-full active:scale-95"
              >
                <span className={`px-3 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 transition-colors ${
                  chatSortBy === "alpha"
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : isDark
                      ? "bg-white/5 text-[var(--text-tertiary)]"
                      : "bg-black/5 text-[var(--text-tertiary)]"
                }`}>
                  <ArrowDownAZ size={12} aria-hidden="true" />
                  {chatSortBy === "alpha" ? t("chat.sortByName", "By name") : t("chat.sortByRecent", "By date")}
                </span>
              </button>
            </div>
          )}
        </>
      )}

      {view === "chats" && <AvatarRow theme={theme} onStoryClick={setActiveStory} onComposeStory={onComposeStory} t={t} />}

      {view === "chats" && filteredChats.length > 0 && selectMode && (
        <BulkActionsBar
          isDark={isDark}
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
        <ChatListVirtualRows rows={rows} isDark={isDark} scrollRef={scrollRef} renderRow={renderRow} />

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

      {menu && (
            <ChatContextMenu
              anchor={menu.anchor}
              anchorRect={menu.anchorRect}
              items={menuItems}
              onClose={closeMenu}
            />

      )}

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title={
          deleteConfirm?.kind === "bulk"
            ? t("chat.bulkDeleteConfirm", { count: selectedIds.size })
            : t("chat.deleteChat")
        }
        message={deleteConfirm?.kind === "bulk" ? "" : t("chat.deleteConfirm")}
        variant="danger"
        theme={theme}
        confirmLabel={t("chat.delete")}
        cancelLabel={t("common.cancel")}
        confirmIcon={<Trash2 size={18} />}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {globalSearchOpen && (
        <ChatListOverlays
          isDark={isDark}
          chats={filteredChats}
          channels={filteredChannels}
          contacts={contacts}
          onClose={() => setGlobalSearchOpen(false)}
          onOpenChat={(c) => {
            handleChatOpen(c);
            onOpenChat?.(c);
          }}
          onOpenContact={(c) => setGlobalSelectedContact(c)}
          t={t}
        />
      )}
    </div>
  );
};
