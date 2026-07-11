import React, { useState, useMemo, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Archive, Bot, ListFilter, Plus, Search, Loader2, RefreshCw } from "lucide-react";
import { useAppStore } from "../../store";
import { ONLINE_CONTACTS } from "../../constants/mockData";
import { SearchInput } from "../ui/SearchInput";
import { ChatListItem } from "../chat-preview";

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
  onCall: (name: string, color?: string) => void;
  onVideoCall: (name: string, color?: string) => void;
}

const AvatarRowInner = ({ theme, onStoryClick, t }: any) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const pullProgress = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('[data-skip-pull]')) return;
    const container = e.currentTarget;
    if (container.scrollTop !== 0) return;
    isPullingRef.current = true;
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) {
      pullProgress.current = Math.min(dy * 0.08, 120);
      if (pullProgress.current > 36) {
        setIsRefreshing(true);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;
    if (pullProgress.current >= 120 && !refreshing) {
      setRefreshing(true);
      setTimeout(() => {
        setRefreshing(false);
        setIsRefreshing(false);
        pullProgress.current = 0;
      }, 1000);
    } else {
      setIsRefreshing(false);
      pullProgress.current = 0;
    }
  };

  return (
    <div 
      className="flex flex-col w-full overflow-visible mb-2 pt-2 pb-1 bg-transparent shrink-0"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      {refreshing && (
        <div className="flex justify-center mb-2" data-skip-pull>
          <Loader2 size={20} className="animate-spin text-orange-500" />
        </div>
      )}
      <div className="px-4 mb-2 font-mono text-[9px] uppercase tracking-widest font-bold text-[var(--text-tertiary)]">{t("header.stories")}</div>
      <div className="flex items-center gap-3 md:gap-4 px-2 md:px-3 overflow-x-auto pb-2 scrollbar-none shrink-0" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
          <div className="flex flex-col items-center gap-1.5 md:gap-2 group cursor-pointer shrink-0">
          <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 active:scale-95">
            <Plus size={20} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
          </div>
          <span className="text-[9px] md:text-[10px] font-semibold tracking-wide transition-colors text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
            {t("header.myStory")}
          </span>
        </div>
        {ONLINE_CONTACTS.map((c) => (
          <div
            key={c.id}
            onClick={() => onStoryClick && onStoryClick(c)}
            className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
          >
            <div
              className="relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 active:scale-95 bg-[var(--bg-primary)] shadow-[var(--shadow-neu-raised)] border-[var(--border-color)]"
            >
              <div className="w-[85%] h-[85%] rounded-full overflow-hidden p-[2px]">
                <div
                  className={`w-full h-full rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white font-bold text-lg`}
                >
                  {(c.name || 'U').charAt(0)}
                </div>
              </div>
            </div>
            <span
              className="text-[9px] md:text-[10px] font-semibold tracking-wide transition-colors text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
            >
              {c.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AvatarRow = React.memo(AvatarRowInner);

export const ChatListView = React.memo(({
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
  onCall,
  onVideoCall,
}: ChatListViewProps) => {
  const { pinChat, setChats } = useAppStore();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const pullProgress = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('[data-skip-pull]')) return;
    const container = e.currentTarget;
    if ((container as HTMLElement).scrollTop !== 0) return;
    isPullingRef.current = true;
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) {
      pullProgress.current = Math.min(dy * 0.08, 120);
      if (pullProgress.current > 36) {
        setIsRefreshing(true);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;
    if (pullProgress.current >= 120 && !refreshing) {
      setRefreshing(true);
      setTimeout(() => {
        setRefreshing(false);
        setIsRefreshing(false);
        pullProgress.current = 0;
      }, 1000);
    } else {
      setIsRefreshing(false);
      pullProgress.current = 0;
    }
  };

  const pinnedChats = useMemo(() => filteredChats.filter((c: any) => c.pinned), [filteredChats]);
  const regularChats = useMemo(() => filteredChats.filter((c: any) => !c.pinned), [filteredChats]);

  const handleToggleSelect = useCallback((chatId: string | number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(chatId)) next.delete(chatId);
      else next.add(chatId);
      return next;
    });
  }, [setSelectedIds]);

  const handleLongPress = useCallback((chatId: string | number) => {
    setSelectMode(true);
    setSelectedIds(new Set([chatId]));
  }, [setSelectMode, setSelectedIds]);

  const handleCancelSelect = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, [setSelectMode, setSelectedIds]);

  const handleBulkArchive = useCallback(() => {
    selectedIds.forEach(id => toggleArchive(id));
    handleCancelSelect();
  }, [selectedIds, toggleArchive, handleCancelSelect]);

  const handleBulkDelete = useCallback(() => {
    setChats(prev => prev.filter((c: any) => !selectedIds.has(c.id)));
    handleCancelSelect();
  }, [selectedIds, setChats, handleCancelSelect]);

  const handleBulkMarkRead = useCallback(() => {
    setChats(prev => prev.map((c: any) => selectedIds.has(c.id) ? { ...c, unread: 0 } : c));
    handleCancelSelect();
  }, [selectedIds, setChats, handleCancelSelect]);

  return (
    <div 
      className="w-full flex-1 flex flex-col overflow-y-auto p-4 md:p-5"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      {refreshing && (
        <div className="flex justify-center mb-2" data-skip-pull>
          <Loader2 size={20} className="animate-spin text-orange-500" />
        </div>
      )}
      <div className="mb-4 md:mb-5 relative z-30 flex items-center gap-2 md:gap-3 shrink-0">
       <SearchInput
          value={chatSearchQuery}
          onChange={setChatSearchQuery}
          placeholder={view === "channels" ? t("chat.searchChannelsPlaceholder") : view === "bots" ? t("chat.searchBotsPlaceholder") : t("chat.searchPlaceholder")}
        />
        {(view === "channels" || view === "bots") ? (
         <div
              onClick={() => view === "channels" ? setShowCreateChannel(true) : setShowCreateBot(true)}
               title={view === "channels" ? t("chat.createChannel") : t("chat.createBot")}
               className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 relative bg-[var(--accent-soft)] text-[var(--accent)]"
            >
               <Plus size={16} />
         </div>
        ) : (
        <div
               title={t("chat.archived")}
               onClick={() => { setView("chats"); setActiveFolder("archived"); }}
               className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 relative bg-[var(--bg-elevated)] border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm"
            >
              <Archive size={16} />
            {archivedUnreadCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md border-[2px] border-[var(--bg-primary)]  px-1">
                {archivedUnreadCount}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 md:gap-5 mb-4 md:mb-5 px-1 border-b pb-3 overflow-x-auto scrollbar-none shrink-0 border-[var(--border-color)]" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        {[{ id: "stories", label: t("chat.tabs.stories") }, { id: "chats", label: t("chat.tabs.chats") }, { id: "channels", label: t("chat.tabs.channels") }, { id: "bots", label: t("chat.tabs.bots") }].map((tab) => (
          <div
             key={tab.id}
             onClick={() => setView(tab.id as any)}
             className={`text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors relative shrink-0 ${view === tab.id ? "text-[var(--accent)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"}`}
          >
             {tab.label}
             {view === tab.id && (
                <motion.div layoutId="messengerTab" className="absolute -bottom-[13px] left-0 right-0 h-[2px] rounded-full bg-orange-600" />
             )}
          </div>
       ))}
      </div>

      {view === "stories" && <AvatarRow theme={theme} onStoryClick={setActiveStory} t={t} />}

       {view === "chats" && (
        <div className="flex items-center gap-2 mb-4 md:mb-5 -mx-2 px-2 shrink-0">
          <div
            className="flex-1 flex gap-2 overflow-x-auto scrollbar-none pb-1"
            onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}
          >
           {["all", "personal", "unread", "work", "archived"].map(folder => (
             <div
               key={folder}
              onClick={() => setActiveFolder(folder)}
                   className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold whitespace-nowrap cursor-pointer transition-colors shrink-0 ${activeFolder === folder ? "bg-orange-500 text-white shadow-md" : "bg-[--bg-secondary] text-slate-500 hover:text-slate-800 border border-black/5 shadow-sm"}`}
             >
               {t("chat.folders." + folder as any)}
             </div>
           ))}
         </div>
         <div onClick={() => setShowAdvancedFilterModal(true)} className="p-1.5 rounded-full cursor-pointer shrink-0 transition-colors flex items-center justify-center bg-[--bg-secondary] text-[--text-secondary] hover:bg-white/5 border border-black/5">
            <ListFilter size={18} />
         </div>
   </div>
 )}

       {view === "chats" && filteredChats.length > 0 && (
        <>
         {selectMode && (
            <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4 px-1 py-2 rounded-md shrink-0 bg-white/5">
              <button
                onClick={handleCancelSelect}
                className="px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-colors bg-[--bg-secondary] text-slate-600 hover:text-slate-800 border border-black/5 shadow-sm"
              >
                {t("chat.cancel")}
              </button>
              <span className="text-xs font-bold px-2 text-[--text-primary]">
                {selectedIds.size} {t("chat.selected")}
              </span>
             <div className="flex-1" />
          <button
                onClick={handleBulkArchive}
                className="px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-colors bg-[--bg-secondary] text-slate-600 hover:text-slate-800 border border-black/5 shadow-sm"
              >
                {t("chat.archive")}
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-colors bg-red-500/10 text-red-600 hover:bg-red-500/20"
              >
                {t("chat.delete")}
              </button>
              <button
                onClick={handleBulkMarkRead}
                className="px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-colors bg-[--bg-secondary] text-slate-600 hover:text-slate-800 border border-black/5 shadow-sm"
              >
                {t("chat.markRead")}
              </button>
           </div>
         )}
         {pinnedChats.length > 0 && (
           <>
              <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] mb-3 md:mb-4 shrink-0 text-orange-600">{t("chat.sectionPinned")}</div>
              {pinnedChats.map((c, i) => (
                <ChatListItem
                  key={c.id ?? `pinned-${i}`}
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
             <div className="h-px my-4 bg-black/5" />
           </>
         )}
          <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] mb-3 md:mb-4 shrink-0 text-orange-600">{t("chat.sectionConversations")}</div>
          {regularChats.map((c, i) => (
             <ChatListItem
                key={c.id ?? `chat-${i}`}
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
           <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] mb-3 md:mb-4 shrink-0 text-purple-600">{t("chat.sectionChannels")}</div>
          {filteredChannels.map((c, i) => (
             <ChatListItem
                key={c.id ?? `channel-${i}`}
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
             <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] mb-3 md:mb-4 shrink-0 text-blue-600">{t("chat.sectionBots")}</div>
            {bots.map((b, i) => (
              <div key={b.id ?? `bot-${i}`} className="w-full p-4 rounded-md mb-4 flex flex-col gap-2 neu-card-inset">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
                     <Bot size={20} />
                   </div>
                   <div className="flex-1">
                      <h4 className="font-bold text-sm tracking-wide">{b.name}</h4>
                      <p className="text-xs text-[--text-secondary]">Token: {b.token.substring(0, 15)}...</p>
                   </div>
                </div>
             </div>
           ))}
         </>
       ) : (
         <div className="flex flex-col items-center justify-center py-10 opacity-60">
           <Bot size={32} className="mb-4 opacity-50 text-blue-600" />
           <span className="text-[13px] text-center px-4 text-[--text-primary]">{t("chat.noBots")}</span>
         </div>
       )
     )}

     {view !== "bots" && filteredChats.length === 0 && filteredChannels.length === 0 && (
       <div className="flex flex-col items-center justify-center py-10 opacity-60 text-[--text-primary]">
         <Search size={24} className="mb-2" />
         <span className="text-[13px]">{t("chat.noResults")}</span>
       </div>
     )}
    </div>
);
});

