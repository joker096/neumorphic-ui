import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { SearchInput } from "./ui/SearchInput";
import { OnboardingPanel } from "./ui/OnboardingPanel";
import { InviteQRModal } from "./ui/InviteQRModal";
import { ChatListItem, AvatarRow, BulkActionsBar, FolderFilterBar, ViewTabs, ChatListSearchHeader, ChatListBots } from "./chat-preview";
import { ChatContextMenu } from "./chat-preview/ChatContextMenu";
import { GlobalSearch } from "./GlobalSearch";
import { DataState } from "./ui/DataState";
import { useChatListActions } from "../hooks/useChatListActions";

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
  activeChatId?: string | number | null;
  setView: (view: string) => void;
  setActiveStory: (story: any) => void;
  onComposeStory?: () => void;
  setShowCreateChannel: (show: boolean) => void;
  setShowCreateBot: (show: boolean) => void;
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
}

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
  activeChatId,
  setView,
  setActiveStory,
  onComposeStory,
  setShowCreateChannel,
  setShowCreateBot,
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
}: ChatListViewProps) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  const {
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
  } = useChatListActions({ t, activeFolder, toggleArchive, setActiveChat, activeChatId });

  const pinnedChats = useMemo(() => filteredChats.filter((c: any) => c.pinned), [filteredChats]);
  const regularChats = useMemo(() => filteredChats.filter((c: any) => !c.pinned), [filteredChats]);

  return (
    <div className={`w-full flex-1 flex flex-col overflow-y-auto overflow-x-hidden px-3 md:px-5 py-3 md:py-5 ${isDark ? "bg-[var(--bg-primary)]/50" : "bg-[var(--bg-secondary)]/50"}`}>
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
          onOpenGlobalSearch={() => setGlobalSearchOpen(true)}
        />
      <ViewTabs view={view} isDark={isDark} onSelect={setView} t={t} />
 
      {view === "stories" && <AvatarRow theme={theme} onStoryClick={setActiveStory} onComposeStory={onComposeStory} t={t} />}

      {view === "chats" && <AvatarRow theme={theme} onStoryClick={setActiveStory} onComposeStory={onComposeStory} t={t} />}

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

      {view === "chats" && filteredChats.length > 0 && (
       <>
         {selectMode && (
           <BulkActionsBar
             isDark={isDark}
             selectedIds={selectedIds}
             t={t}
             onCancel={handleCancelSelect}
             onArchive={handleBulkArchive}
             onDelete={handleBulkDelete}
             onMarkRead={handleBulkMarkRead}
           />
         )}
         {pinnedChats.length > 0 && (
           <>
              <div className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 shrink-0 ${isDark ? "text-[var(--accent)]" : "text-[var(--accent)]"}`}>{t("chat.sectionPinned")}</div>
             {pinnedChats.map(c => (
               <ChatListItem
                 key={c.id}
                 chat={c}
                 theme={theme}
                 type="chat"
                 active={false}
                 onClick={() => setActiveChat(c)}
                 onArchive={() => toggleArchive(c.id)}
                 archiveLabel={activeFolder === "archived" ? t("chat.unarchive") : t("chat.archive")}
                 onCall={() => onCall(c.name, c.color)}
                 onVideoCall={() => onVideoCall(c.name, c.color)}
                 t={t}
                 pinned={c.pinned}
                 selectMode={selectMode}
                 selected={selectedIds.has(c.id)}
                 onToggleSelect={() => handleToggleSelect(c.id)}
                 onMenuRequest={openMenu}
                 onAvatarClick={() => {
                   const profileContact = contacts.find(ct => ct.name === c.name);
                   setGlobalSelectedContact({
                     id: `hash_${c.id}`,
                     name: c.name,
                     color: c.color,
                     lastSeen: c.online ? 0 : Date.now() - 3600000,
                     online: c.online,
                     isFavorite: c.isFavorite,
                     localFields: profileContact?.localFields
                   });
                 }}
               />
             ))}
             <div className={`h-px my-4 ${isDark ? "bg-white/5" : "bg-black/5"}`} />
           </>
         )}
          <div className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 shrink-0 ${isDark ? "text-[var(--accent)]" : "text-[var(--accent)]"}`}>{t("chat.sectionConversations")}</div>
         {regularChats.map(c => (
            <ChatListItem
               key={c.id}
               chat={c}
               theme={theme}
               type="chat"
               active={false}
               onClick={() => setActiveChat(c)}
               onArchive={() => toggleArchive(c.id)}
               archiveLabel={activeFolder === "archived" ? t("chat.unarchive") : t("chat.archive")}
               onCall={() => onCall(c.name, c.color)}
               onVideoCall={() => onVideoCall(c.name, c.color)}
               t={t}
               pinned={c.pinned}
               selectMode={selectMode}
               selected={selectedIds.has(c.id)}
                onToggleSelect={() => handleToggleSelect(c.id)}
                onAvatarClick={() => {
                const profileContact = contacts.find(ct => ct.name === c.name);
                setGlobalSelectedContact({
                  id: `hash_${c.id}`,
                  name: c.name,
                  color: c.color,
                  lastSeen: c.online ? 0 : Date.now() - 3600000,
                  online: c.online,
                  isFavorite: c.isFavorite,
                  localFields: profileContact?.localFields
                });
              }}
            />
         ))}
       </>
     )}

     {view === "channels" && filteredChannels.length > 0 && (
       <>
           <div className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 shrink-0 ${isDark ? "text-[var(--accent2)]" : "text-purple-600"}`}>{t("chat.sectionChannels")}</div>
         {filteredChannels.map(c => (
            <ChatListItem
               key={c.id}
               chat={c}
               theme={theme}
               type="channel"
               active={false}
               onClick={() => setActiveChat(c)}
               onArchive={() => toggleArchive(c.id)}
               archiveLabel={activeFolder === "archived" ? t("chat.unarchive") : t("chat.archive")}
               onCall={() => onCall(c.name, c.color)}
               onVideoCall={() => onVideoCall(c.name, c.color)}
               t={t}
            />
         ))}
       </>
     )}

      {view === "bots" && (
        <ChatListBots bots={bots} onOpenBot={onOpenBot} isDark={isDark} t={t} />
      )}

     {view !== "bots" && filteredChats.length === 0 && filteredChannels.length === 0 && (
       chatSearchQuery.trim() ? (
          <DataState status="empty" isDark={isDark} title={t("chat.noResults")} description={t("chat.noResultsHint", "Попробуйте изменить запрос")} />
        ) : view === "chats" ? (
          <>
            <OnboardingPanel
              isDark={isDark}
              t={t}
              onStartChat={() => setShowAddContactFromChat?.(true)}
              onInvite={() => setShowInviteModal(true)}
            />
            <InviteQRModal
              isOpen={showInviteModal}
              onClose={() => setShowInviteModal(false)}
              inviteText={t("onboarding.inviteText")}
              isDark={isDark}
              t={t}
            />
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

      {menu && (
        <ChatContextMenu
          anchor={menu.anchor}
          items={menuItems}
          onClose={closeMenu}
        />
      )}

      {globalSearchOpen && (
        <GlobalSearch
          isDark={isDark}
          chats={filteredChats}
          channels={filteredChannels}
          contacts={contacts}
          onClose={() => setGlobalSearchOpen(false)}
          onOpenChat={(c) => { setActiveChat(c); setView("chats"); }}
          onOpenContact={(c) => setGlobalSelectedContact(c)}
          t={t}
        />
      )}
    </div>
  );
};



