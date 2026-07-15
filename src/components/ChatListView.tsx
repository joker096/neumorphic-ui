import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Archive, Bot, ListFilter, Plus, Search } from "lucide-react";
import { useAppStore } from "../store";
import { ONLINE_CONTACTS } from "./mockData";
import { SearchInput } from "./ui/SearchInput";
import { ChatListItem } from "./chat-preview";

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

const AvatarRow = ({ theme, onStoryClick, t }: any) => {
  const isDark = theme === "dark";
  return (
    <div className="flex flex-col w-full overflow-visible mb-2 pt-2 pb-1 bg-transparent shrink-0">
      <div className={`px-4 mb-2 font-mono text-[9px] uppercase tracking-widest font-bold ${isDark ? "text-gray-400" : "text-slate-400"}`}>{t("header.stories")}</div>
      <div className="flex items-center gap-3 sm:gap-4 px-2 sm:px-3 overflow-x-auto pb-2 scrollbar-none shrink-0" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        <div className="flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer shrink-0">
          <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 active:scale-95 ${isDark ? "bg-[#1f222a] border border-white/5 border-dashed" : "bg-[#f4f7f9] border border-black/10 border-dashed"}`}>
            <Plus size={20} className={isDark ? "text-gray-300 group-hover:text-white" : "text-slate-500 group-hover:text-black"} />
          </div>
          <span className={`text-[9px] sm:text-[10px] font-semibold tracking-wide transition-colors ${isDark ? "text-gray-300 group-hover:text-gray-100" : "text-slate-500 group-hover:text-slate-800"}`}>
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
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 active:scale-95 ${
                isDark
                  ? "bg-[#1a1d24] shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-white/5"
                  : "bg-[#eaeff4] shadow-[4px_4px_8px_rgba(165,175,190,0.3),_-4px_-4px_8px_rgba(255,255,255,0.8),_inset_1.5px_1.5px_2px_rgba(255,255,255,1)] border border-black/5"
              }`}
            >
              <div className="w-[85%] h-[85%] rounded-full overflow-hidden p-[2px]">
                <div
                  className={`w-full h-full rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white font-bold text-lg`}
                >
                  {c.name.charAt(0)}
                </div>
              </div>
            </div>
            <span
              className={`text-[9px] sm:text-[10px] font-semibold tracking-wide transition-colors ${isDark ? "text-gray-300 group-hover:text-gray-100" : "text-slate-500 group-hover:text-slate-800"}`}
            >
              {c.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

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
    <div className={`w-full flex-1 flex flex-col overflow-y-auto px-3 md:px-5 py-3 md:py-5 ${isDark ? "bg-[#11141c]/50" : "bg-[#eaeff4]/50"}`}>
      <div className="mb-4 sm:mb-6 relative z-30 flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex-1">
          <SearchInput
            value={chatSearchQuery}
            onChange={setChatSearchQuery}
            placeholder={view === "channels" ? t("chat.searchChannelsPlaceholder") : view === "bots" ? t("chat.searchBotsPlaceholder") : t("chat.searchPlaceholder")}
            isDark={isDark}
            shape="pill"
          />
        </div>
        {(view === "channels" || view === "bots") ? (
         <div
              onClick={() => view === "channels" ? setShowCreateChannel(true) : setShowCreateBot(true)}
               title={view === "channels" ? t("chat.createChannel") : t("chat.createBot")}
               className={`w-9 h-9 sm:w-[40px] sm:h-[40px] flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 relative ${isDark ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 shadow-sm"}`}
             >
               <Plus size={16} />
          </div>
        ) : (
         <div
              title={t("chat.archived")}
              onClick={() => { setView("chats"); setActiveFolder("archived"); }}
              className={`w-9 h-9 sm:w-[40px] sm:h-[40px] flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 relative ${isDark ? "bg-[#1a1d24] border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white" : "bg-white border border-black/5 hover:bg-black/5 text-slate-500 hover:text-slate-800 shadow-sm"}`}
            >
              <Archive size={16} />
            {archivedUnreadCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md border-[2px] border-[#eaeff4] dark:border-[#11141c] px-1">
                {archivedUnreadCount}
              </div>
            )}
          </div>
        )}
      </div>
      <div className={`flex items-center gap-3 sm:gap-5 mb-4 sm:mb-6 px-1 border-b pb-3 overflow-x-auto scrollbar-none shrink-0 ${isDark ? "border-white/5" : "border-black/5"}`} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        {[{ id: "stories", label: t("chat.tabs.stories") }, { id: "chats", label: t("chat.tabs.chats") }, { id: "channels", label: t("chat.tabs.channels") }, { id: "bots", label: t("chat.tabs.bots") }].map((tab) => (
          <div
             key={tab.id}
             onClick={() => setView(tab.id as any)}
             className={`text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors relative shrink-0 ${view === tab.id ? (isDark ? "text-orange-500" : "text-orange-600") : (isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600")}`}
          >
             {tab.label}
             {view === tab.id && (
                <motion.div layoutId="messengerTab" className={`absolute -bottom-[13px] left-0 right-0 h-[2px] rounded-full ${isDark ? "bg-orange-500" : "bg-orange-600"}`} />
             )}
          </div>
       ))}
      </div>

      {view === "stories" && <AvatarRow theme={theme} onStoryClick={setActiveStory} t={t} />}

       {view === "chats" && (
         <div className="flex items-center gap-2 mb-4 sm:mb-6 -mx-2 px-2 shrink-0">
           <div
             className="flex-1 flex gap-2 overflow-x-auto scrollbar-none pb-1"
             onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}
           >
            {["all", "personal", "unread", "work", "archived"].map(folder => (
              <div
                key={folder}
           onClick={() => setActiveFolder(folder)}
                 className={`px-2 sm:px-4 py-1 rounded-sm sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap cursor-pointer transition-colors shrink-0 ${activeFolder === folder ? (isDark ? "bg-orange-500 text-white" : "bg-orange-500 text-white shadow-md") : (isDark ? "bg-[#1a1d24] text-gray-400 hover:text-gray-200 border border-white/5" : "bg-white text-slate-500 hover:text-slate-800 border border-black/5 shadow-sm")}`}
              >
                 {t("chat.folders." + folder as any)}
               </div>
            ))}
          </div>
          <div onClick={() => setShowAdvancedFilterModal(true)} className={`p-1.5 rounded-full cursor-pointer shrink-0 transition-colors flex items-center justify-center ${advancedFilters.hasMedia || advancedFilters.hasAudio || advancedFilters.hasReplies || advancedFilters.fromBots || advancedFilters.priority ? (isDark ? "bg-orange-500 text-white" : "bg-orange-500 text-white shadow-md") : (isDark ? "bg-[#1a1d24] text-gray-400 hover:text-white border border-white/5" : "bg-white text-slate-500 hover:text-slate-800 border border-black/5 shadow-sm")}`}>
             <ListFilter size={18} />
          </div>
        </div>
   )}

      {view === "chats" && filteredChats.length > 0 && (
       <>
         {selectMode && (
            <div className={`flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 px-1 py-2 rounded-2xl shrink-0 ${isDark ? "bg-white/5" : "bg-black/5"}`}>
              <button
                onClick={handleCancelSelect}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-colors ${isDark ? "bg-[#1a1d24] text-gray-300 hover:text-white border border-white/5" : "bg-white text-slate-600 hover:text-slate-800 border border-black/5 shadow-sm"}`}
              >
                {t("chat.cancel")}
               </button>
              <span className={`text-xs font-bold px-2 ${isDark ? "text-gray-300" : "text-slate-600"}`}>
                {selectedIds.size} {t("chat.selected")}
              </span>
             <div className="flex-1" />
          <button
                onClick={handleBulkArchive}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-colors ${isDark ? "bg-[#1a1d24] text-gray-300 hover:text-white border border-white/5" : "bg-white text-slate-600 hover:text-slate-800 border border-black/5 shadow-sm"}`}
              >
                {t("chat.archive")}
              </button>
              <button
                onClick={handleBulkDelete}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-colors ${isDark ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-red-500/10 text-red-600 hover:bg-red-500/20"}`}
              >
                {t("chat.delete")}
              </button>
              <button
                onClick={handleBulkMarkRead}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-colors ${isDark ? "bg-[#1a1d24] text-gray-300 hover:text-white border border-white/5" : "bg-white text-slate-600 hover:text-slate-800 border border-black/5 shadow-sm"}`}
              >
                {t("chat.markRead")}
              </button>
           </div>
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
             <div key={b.id} className={`w-full p-4 rounded-xl mb-4 flex flex-col gap-2 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white border border-black/5 shadow-sm"}`}>
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
         <div className={`flex flex-col items-center justify-center py-10 opacity-60 ${isDark ? "text-white" : "text-black"}`}>
           <Bot size={32} className={`mb-4 opacity-50 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
           <span className="text-[13px] text-center px-4">{t("chat.noBots")}</span>
         </div>
       )
     )}

     {view !== "bots" && filteredChats.length === 0 && filteredChannels.length === 0 && (
       <div className={`flex flex-col items-center justify-center py-10 opacity-60 ${isDark ? "text-white" : "text-black"}`}>
         <Search size={24} className="mb-2" />
         <span className="text-[13px]">{t("chat.noResults")}</span>
       </div>
     )}
    </div>
  );
};