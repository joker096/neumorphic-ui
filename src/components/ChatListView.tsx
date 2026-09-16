import React, { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { Search, Trash2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { SearchInput } from "./ui/SearchInput";
import { OnboardingPanel } from "./ui/OnboardingPanel";
import { ChatListItem, AvatarRow, BulkActionsBar, FolderFilterBar, ViewTabs, ChatListSearchHeader, ChatListBots } from "./chat-preview";
import { ChatContextMenu } from "./chat-preview/ChatContextMenu";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { DataState } from "./ui/DataState";
import { useChatListActions } from "../hooks/useChatListActions";

const InviteQRModal = lazy(() => import("./ui/InviteQRModal").then((m) => ({ default: m.InviteQRModal })));
const GlobalSearch = lazy(() => import("./GlobalSearch").then((m) => ({ default: m.GlobalSearch })));

type Translate = (key: string, options?: any) => string;

interface ChatListViewProps {
  theme: "light" | "dark";
  view: string;
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
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

type ChatRow =
  | { kind: "header"; text: string; innerClass: string; wrapperClass: string }
  | { kind: "divider" }
  | { kind: "chat"; chat: any }
  | { kind: "channel"; chat: any };

export const ChatListView = ({
  theme,
  view,
  activeFolder,
  setActiveFolder,
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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  // Ctrl/Cmd+K — toggle global search (desktop keyboard shortcut).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setGlobalSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

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

  // Flat row model for the virtualized list: section headers, dividers and chat rows.
  const rows = useMemo<ChatRow[]>(() => {
    const list: ChatRow[] = [];
    if (view === "chats") {
      if (pinnedChats.length > 0) {
        list.push({
          kind: "header",
          text: t("chat.sectionPinned"),
          innerClass: `text-xs sm:text-xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] ${"text-[var(--accent)]"}`,
          wrapperClass: "pb-3 sm:pb-4",
        });
        pinnedChats.forEach((c: any) => list.push({ kind: "chat", chat: c }));
        list.push({ kind: "divider" });
      }
      list.push({
        kind: "header",
        text: t("chat.sectionConversations"),
        innerClass: `text-xs font-bold uppercase tracking-[0.2em] ${"text-[var(--accent)]"}`,
        wrapperClass: "pb-4",
      });
      regularChats.forEach((c: any) => list.push({ kind: "chat", chat: c }));
    } else if (view === "channels") {
      list.push({
        kind: "header",
        text: t("chat.sectionChannels"),
        innerClass: `text-xs sm:text-xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] ${isDark ? "text-[var(--accent2)]" : "text-purple-600"}`,
        wrapperClass: "pb-3 sm:pb-4",
      });
      filteredChannels.forEach((c: any) => list.push({ kind: "channel", chat: c }));
    }
    return list;
  }, [view, pinnedChats, regularChats, filteredChannels, isDark, t]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 76,
    overscan: 5,
  });

  const measureElement = useCallback((el: HTMLElement | null) => {
    if (el) {
      virtualizer.measureElement(el);
    }
  }, [virtualizer]);

  const renderChatItem = (chat: any, type: "chat" | "channel") => (
    <ChatListItem
      chat={chat}
      theme={theme}
      type={type}
      active={activeChatId === chat.id}
      onClick={() => {
        handleChatOpen(chat);
        onOpenChat?.(chat);
      }}
      onArchive={() => toggleArchive(chat.id)}
      onMute={type === "chat" ? () => handleMenuMute({ id: chat.id }) : undefined}
      onDelete={type === "chat" ? () => handleMenuDelete({ id: chat.id }) : undefined}
      archiveLabel={activeFolder === "archived" ? t("chat.unarchive") : t("chat.archive")}
      onCall={() => onCall(chat.name, chat.color)}
      onVideoCall={() => onVideoCall(chat.name, chat.color)}
      t={t}
      pinned={type === "chat" ? chat.pinned : undefined}
      selectMode={type === "chat" ? selectMode : undefined}
      selected={type === "chat" ? selectedIds.has(chat.id) : undefined}
      onToggleSelect={type === "chat" ? () => handleToggleSelect(chat.id) : undefined}
      onMenuRequest={type === "chat" ? openMenu : undefined}
      draftText={draftTextByChat?.[String(chat.id)]}
      onAvatarClick={
        type === "chat"
          ? () => {
              const profileContact = contacts.find(ct => ct.name === chat.name);
              setGlobalSelectedContact({
                id: profileContact?.id ?? chat.id,
                name: chat.name,
                color: chat.color,
                lastSeen: chat.online ? 0 : Date.now() - 3600000,
                online: chat.online,
                isFavorite: chat.isFavorite,
                localFields: profileContact?.localFields
              });
            }
          : undefined
      }
    />
  );

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

      {view === "chats" && (
        <FolderFilterBar
          isDark={isDark}
          activeFolder={activeFolder}
          setActiveFolder={setActiveFolder}
          advancedFilters={advancedFilters}
          setShowAdvancedFilterModal={setShowAdvancedFilterModal}
          t={t}
        />
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
        {rows.length > 0 && (
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
            {virtualizer.getVirtualItems().map((vi) => {
              const row = rows[vi.index];
              return (
                <div
                  key={vi.key}
                  ref={measureElement}
                  data-index={vi.index}
                  className={
                    row.kind === "header"
                      ? row.wrapperClass
                      : row.kind === "divider"
                        ? "py-4"
                        : vi.index === rows.length - 1
                          ? undefined
                          : "pb-1"
                  }
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${vi.start}px)`,
                  }}
                >
                  {row.kind === "header" ? (
                    <div className={row.innerClass}>{row.text}</div>
                  ) : row.kind === "divider" ? (
                    <div className={`h-px w-full ${isDark ? "bg-white/5" : "bg-black/5"}`} />
                  ) : (
                    renderChatItem(row.chat, row.kind)
                  )}
                </div>
              );
            })}
          </div>
        )}

        {view === "bots" && (
          <ChatListBots bots={bots} onOpenBot={onOpenBot} isDark={isDark} t={t} />
        )}

        {view !== "bots" && filteredChats.length === 0 && filteredChannels.length === 0 && (
          chatSearchQuery.trim() ? (
              <DataState status="empty" isDark={isDark} emptyIcon="search" title={t("chat.noResults")} description={t("chat.noResultsHint", "Try a different keyword or clear your search")} action={{ label: t("search.clear", "Clear"), onClick: () => setChatSearchQuery("") }} />
          ) : activeFolder === "groups" ? (
             <DataState status="empty" isDark={isDark} title={t("chat.noGroups")} description={t("chat.noGroupsHint")} action={setShowCreateGroup ? { label: t("chat.createGroup"), onClick: () => setShowCreateGroup(true) } : undefined} />
          ) : view === "chats" ? (
            <>
              <OnboardingPanel
                isDark={isDark}
                t={t}
                onStartChat={() => setShowAddContactFromChat?.(true)}
                onInvite={() => setShowInviteModal(true)}
              />
              <Suspense fallback={null}>
                <InviteQRModal
                  isOpen={showInviteModal}
                  onClose={() => setShowInviteModal(false)}
                  inviteText={t("onboarding.inviteText")}
                  isDark={isDark}
                  t={t}
                />
              </Suspense>
            </>
          ) : view === "channels" ? (
            <OnboardingPanel
              isDark={isDark}
              variant="channels"
              t={t}
              onStartChat={() => setShowCreateChannel(true)}
            />
          ) : null
        )}
      </div>

      {menu && (
        <ChatContextMenu
          anchor={menu.anchor}
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
        <Suspense fallback={null}>
          <GlobalSearch
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
        </Suspense>
      )}
    </div>
  );
};
