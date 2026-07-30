import React, { useState, useMemo } from "react";
import { Bot, Search } from "lucide-react";
import { useAppStore } from "../store";
import { SearchInput } from "./ui/SearchInput";
import { OnboardingPanel } from "./ui/OnboardingPanel";
import { ChatListItem, AvatarRow, BulkActionsBar, FolderFilterBar, ViewTabs, ChatListSearchHeader } from "./chat-preview";

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
  setView: (view: string) => void;
  setActiveStory: (story: any) => void;
  setShowCreateChannel: (show: boolean) => void;
  setShowCreateBot: (show: boolean) => void;
  setShowAdvancedFilterModal: (show: boolean) => void;
  advancedFilters: Record<string, boolean>;
  t: Translate;
  isDark?: boolean;
  onCall: (name: string, color?: string) => void;
  onVideoCall: (name: string, color?: string) => void;
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
  setView,
  setActiveStory,
  setShowCreateChannel,
  setShowCreateBot,
  setShowAdvancedFilterModal,
  advancedFilters,
  t,
  isDark = false,
  onCall,
  onVideoCall,
}: ChatListViewProps) => {
  const { pinChat, setChats } = useAppStore();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const pinnedChats = useMemo(() => filteredChats.filter((c: any) => c.pinned), [filteredChats]);
  const regularChats = useMemo(() => filteredChats.filter((c: any) => !c.pinned), [filteredChats]);

  const handleToggleSelect = (chatId: string | number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(chatId)) next.delete(chatId);
      else next.add(chatId);
      return next;
    });
  };

  const handleLongPress = (chatId: string | number) => {
    setSelectMode(true);
    setSelectedIds(new Set([chatId]));
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

  return (
    <div className={`w-full flex-1 flex flex-col overflow-y-auto px-3 md:px-5 py-3 md:py-5 ${isDark ? "bg-[var(--bg-primary)]/50" : "bg-[var(--bg-secondary)]/50"}`}>
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
      />
      <ViewTabs view={view} isDark={isDark} onSelect={(id) => setView(id as any)} t={t} />
 
      {view === "stories" && <AvatarRow theme={theme} onStoryClick={setActiveStory} t={t} />}

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
             <div className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 shrink-0 ${isDark ? "text-orange-500" : "text-orange-600"}`}>{t("chat.sectionPinned")}</div>
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
                 onLongPress={() => handleLongPress(c.id)}
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
         <div className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 shrink-0 ${isDark ? "text-orange-500" : "text-orange-600"}`}>{t("chat.sectionConversations")}</div>
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
               onLongPress={() => handleLongPress(c.id)}
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
          <div className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 shrink-0 ${isDark ? "text-purple-500" : "text-purple-600"}`}>{t("chat.sectionChannels")}</div>
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
       bots.length > 0 ? (
         <>
            <div className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 shrink-0 ${isDark ? "text-blue-500" : "text-blue-600"}`}>{t("chat.sectionBots")}</div>
           {bots.map(b => (
             <div key={b.id} className={`w-full p-4 rounded-xl mb-4 flex flex-col gap-2 ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)] shadow-sm"}`}>
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
                     <Bot size={20} />
                   </div>
                   <div className="flex-1">
                      <h4 className="font-bold text-sm tracking-wide">{b.name}</h4>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>Token: {b.token.substring(0, 15)}...</p>
                   </div>
                </div>
             </div>
           ))}
         </>
       ) : (
         <div className={`flex flex-col items-center justify-center py-10 opacity-60 ${isDark ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
           <Bot size={32} className={`mb-4 opacity-50 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
           <span className="text-[13px] text-center px-4">{t("chat.noBots")}</span>
         </div>
       )
     )}

     {view !== "bots" && filteredChats.length === 0 && filteredChannels.length === 0 && (
       chatSearchQuery.trim() ? (
         <div className={`flex flex-col items-center justify-center py-10 opacity-60 ${isDark ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
           <Search size={24} className="mb-2" />
           <span className="text-[13px]">{t("chat.noResults")}</span>
         </div>
       ) : view === "chats" ? (
         <OnboardingPanel
           isDark={isDark}
           t={t}
           onStartChat={() => setView("contacts")}
           onInvite={() => {}}
         />
       ) : view === "channels" ? (
         <OnboardingPanel
           isDark={isDark}
           t={t}
           onStartChat={() => setShowCreateChannel(true)}
         />
       ) : null
      )}
    </div>
  );
};



