import React from "react";
import { motion } from "motion/react";
import { Archive, Bot, ListFilter, Plus, Search } from "lucide-react";
import { FormattedText } from "./FormattedText";
import { useAppStore } from "../store";
import { ONLINE_CONTACTS } from "./mockData";
import { DarkSearchBar, LightSearchBar } from "./Dialpad";

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
  isDark: boolean;
}

const AvatarRow = ({ theme, onStoryClick, t }: any) => {
  const isDark = theme === "dark";
  return (
    <div className="flex flex-col w-full overflow-visible mb-2 pt-2 pb-1 bg-transparent shrink-0">
      <div className={`px-4 mb-2 font-mono text-[9px] uppercase tracking-widest font-bold ${isDark ? "text-gray-500" : "text-slate-400"}`}>{t('header.stories')}</div>
      <div className="flex items-center gap-4 px-3 overflow-x-auto pb-2 scrollbar-none shrink-0" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        
        {/* Add Story Button */}
        <div className="flex flex-col items-center gap-2 group cursor-pointer shrink-0">
          <div className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 active:scale-95 ${
            isDark ? "bg-[#1f222a] border border-white/5 border-dashed" : "bg-[#f4f7f9] border border-black/10 border-dashed"
          }`}>
             <Plus size={24} className={isDark ? "text-gray-400 group-hover:text-white" : "text-slate-500 group-hover:text-black"} />
          </div>
          <span className={`text-[10px] font-semibold tracking-wide transition-colors ${isDark ? "text-gray-400 group-hover:text-gray-200" : "text-slate-500 group-hover:text-slate-800"}`}>
            {t('header.myStory')}
          </span>
        </div>

        {ONLINE_CONTACTS.map((c) => (
          <div
            key={c.id}
            onClick={() => onStoryClick && onStoryClick(c)}
            className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
          >
            <div
              className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 active:scale-95 ${
                isDark
                  ? "bg-[#13151b] shadow-[0_6px_12px_rgba(0,0,0,0.3),_inset_0_1.5px_2px_rgba(255,255,255,0.05),_inset_0_-2px_4px_rgba(0,0,0,0.6)] border-[2px] border-orange-500/50"
                  : "bg-[#eaeff4] shadow-[4px_4px_8px_rgba(165,175,190,0.3),_-4px_-4px_8px_rgba(255,255,255,0.8),_inset_1.5px_1.5px_2px_rgba(255,255,255,1)] border-[2px] border-orange-400"
              }`}
            >
              <div className="w-[85%] h-[85%] rounded-full shadow-inner overflow-hidden p-[2px]">
                <div
                  className={`w-full h-full rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white font-bold text-lg`}
                >
                  {c.name.charAt(0)}
                </div>
              </div>
            </div>
            <span
              className={`text-[10px] font-semibold tracking-wide transition-colors ${isDark ? "text-gray-400 group-hover:text-gray-200" : "text-slate-500 group-hover:text-slate-800"}`}
            >
              {c.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
const ChatListItem = ({ chat, theme, type = "chat", active, onClick, onArchive, onAvatarClick, archiveLabel, t }: any) => {
  const isDark = theme === "dark";
  const { stealthMode, typingIndicators } = useAppStore();

  const roundedClass = type === "channel" ? "rounded-2xl" : "rounded-full";
  const isMockTyping = typingIndicators && chat.id === 1 && type === "chat";

  const fuzzedTime = React.useMemo(() => {
    if (!stealthMode || !chat.time) return chat.time;
    const match = chat.time.match(/(\d{1,2}):(\d{2})/);
    if (!match) return chat.time;
    let h = parseInt(match[1]);
    let m = parseInt(match[2]);
    const offset = (chat.id % 11) - 5;
    m += offset;
    if (m < 0) { m += 60; h = (h - 1 + 24) % 24; }
    else if (m >= 60) { m -= 60; h = (h + 1) % 24; }
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }, [chat.time, chat.id, stealthMode]);

  return (
    <div className="relative mb-4 last:mb-0">
      <div className={`absolute inset-0 flex items-center justify-end px-6 rounded-3xl ${isDark ? "bg-red-500/20" : "bg-red-500"} text-white overflow-hidden`}>
        <Archive size={20} className={isDark ? "text-red-500" : "text-white"} />
        <span className={`ml-2 text-sm font-bold ${isDark ? "text-red-500" : "text-white"}`}>{archiveLabel}</span>
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.5, right: 0 }}
        onDragEnd={(e, info) => {
          if (info.offset.x < -100 && onArchive) {
            onArchive(chat.id);
          }
        }}
        onClick={onClick}
        className={`relative w-full p-3 flex items-center gap-4 cursor-pointer transition-all duration-300 select-none group rounded-3xl ${
          isDark
            ? active
              ? "bg-[#101216] shadow-[inset_0_12px_24px_rgba(0,0,0,0.9),_inset_0_3px_6px_rgba(0,0,0,0.9)] border border-orange-500/20"
              : "bg-[#13151b] shadow-[0_8px_16px_rgba(0,0,0,0.3),_inset_0_1.5px_2px_rgba(255,255,255,0.05),_inset_0_-2px_4px_rgba(0,0,0,0.6)] border border-white/[0.02] hover:scale-[1.02]"
            : active
              ? "bg-[#e2e8f0] shadow-[inset_4px_4px_10px_rgba(165,175,190,0.4),_inset_-2px_-2px_6px_rgba(255,255,255,1)] border border-black/5"
              : "bg-[#eaeff4] shadow-[-6px_-6px_12px_rgba(255,255,255,0.8),_8px_8px_16px_rgba(165,175,190,0.4),_inset_1.5px_1.5px_3px_rgba(255,255,255,1)] border border-white/80 hover:scale-[1.02]"
        }`}
      >
      {/* Avatar */}
      <div
        onClick={(e) => {
           if (onAvatarClick && type !== "channel") {
              e.stopPropagation();
              onAvatarClick(chat);
           }
        }}
        className={`relative shrink-0 w-[52px] h-[52px] ${roundedClass} shadow-inner p-[2px] transition-transform duration-300 ${active ? "scale-95" : ""}`}
      >
        <div
          className={`w-full h-full ${roundedClass} bg-gradient-to-br ${chat.color} flex items-center justify-center text-white font-bold text-xl shadow-sm`}
        >
          {chat.name.charAt(0)}
        </div>
        {chat.online && (
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full border-[2.5px] z-10 ${isDark ? "bg-green-400 border-[#13151b]" : "bg-emerald-500 border-[#eaeff4]"}`}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center pr-2">
        <div className="flex justify-between items-center mb-[2px]">
          <span
            className={`font-bold text-[14.5px] truncate pr-2 ${isDark ? "text-[#e8ecf2]" : "text-slate-800"}`}
          >
            {chat.name}
          </span>
          <span
            className={`text-[10.5px] font-semibold tracking-wide shrink-0 ${isDark ? "text-gray-500" : "text-slate-400"}`}
          >
            {fuzzedTime}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span
            className={`text-[12.5px] truncate pr-4 ${isDark ? (active ? "text-orange-300" : "text-[#7a8190]") : active ? "text-orange-600" : "text-slate-500"} ${chat.unread ? "font-medium" : ""}`}
          >
            {isMockTyping ? (
                <span className={`font-bold tracking-wide italic ${isDark ? "text-orange-500" : "text-orange-600"}`}>
                   {t('chat.typing')}
                </span>
            ) : (
               <FormattedText text={chat.message} />
            )}
          </span>
          {chat.unread > 0 && (
             <div
               className={`shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm ${
                 isDark
                   ? "bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                   : "bg-gradient-to-tr from-orange-400 to-orange-300 text-orange-950 shadow-[0_2px_4px_rgba(249,115,22,0.5)]"
               }`}
             >
               <span className="text-[10px] font-bold pb-[0.5px] leading-none">
                 {chat.unread}
               </span>
             </div>
           )}
           {(chat as any).hasMentions && (
             <div
               className={`shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm ${
                 isDark
                   ? "bg-blue-500/90 text-white shadow-[0_0_8px_rgba(59,130,250,0.5)]"
                   : "bg-blue-500 text-white shadow-[0_2px_4px_rgba(29,78,183,0.5)]"
               }`}
             >
               <span className="text-[10px] font-bold pb-[0.5px] leading-none">@</span>
             </div>
           )}
        </div>
      </div>
      </motion.div>
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
  isDark,
}: ChatListViewProps) => {
  return (
    <div className={`w-full max-w-[400px] flex-1 flex flex-col overflow-y-auto rounded-[32px] p-6 mb-8 pb-28 sm:pb-8 ${isDark ? "bg-[#11141c]/50 border border-white/5 scrollbar-dark" : "bg-[#eaeff4]/50 border border-black/5 shadow-inner scrollbar-light"}`}>
      <div className="mb-6 relative z-30 flex items-center gap-3 shrink-0">
        <div className="flex-1">
          {isDark ? (
            <DarkSearchBar searchQuery={chatSearchQuery} onSearchChange={setChatSearchQuery} placeholder={view === 'channels' ? t('chat.searchChannelsPlaceholder') : view === 'bots' ? t('chat.searchBotsPlaceholder') : t('chat.searchPlaceholder')} />
          ) : (
            <LightSearchBar searchQuery={chatSearchQuery} onSearchChange={setChatSearchQuery} placeholder={view === 'channels' ? t('chat.searchChannelsPlaceholder') : view === 'bots' ? t('chat.searchBotsPlaceholder') : t('chat.searchPlaceholder')} />
          )}
        </div>
        {(view === 'channels' || view === 'bots') ? (
          <div
            onClick={() => view === 'channels' ? setShowCreateChannel(true) : setShowCreateBot(true)}
            title={view === 'channels' ? t('chat.createChannel') : t('chat.createBot')}
            className={`w-[48px] h-[48px] rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 relative ${isDark ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 shadow-sm"}`}
          >
            <Plus size={24} />
          </div>
        ) : (
          <div
            title={t('chat.archived')}
            onClick={() => { setView('chats'); setActiveFolder('archived'); }}
            className={`w-[48px] h-[48px] rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 relative ${isDark ? "bg-[#1a1d24] border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white" : "bg-white border border-black/5 hover:bg-black/5 text-slate-500 hover:text-slate-800 shadow-sm"}`}
          >
            <Archive size={20} />
            {archivedUnreadCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md border-[2px] border-[#eaeff4] dark:border-[#11141c] px-1">
                {archivedUnreadCount}
              </div>
            )}
          </div>
        )}
      </div>
      {/* TOP-LEVEL TAB BAR */}
                    <div className={`flex items-center gap-5 mb-6 px-1 border-b pb-3 overflow-x-auto scrollbar-none shrink-0 ${isDark ? "border-white/5" : "border-black/5"}`} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
                        {[
                          { id: 'stories', label: t('chat.tabs.stories') },
                          { id: 'chats', label: t('chat.tabs.chats') },
                          { id: 'channels', label: t('chat.tabs.channels') },
                          { id: 'bots', label: t('chat.tabs.bots') }
                        ].map((tab) => (
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

                    {view === 'stories' && <AvatarRow theme={theme} onStoryClick={setActiveStory} t={t} />}

                     {view === 'chats' && (
                        <div className="flex items-center gap-2 mb-6 -mx-2 px-2 shrink-0">
                          <div
                            className="flex-1 flex gap-2 overflow-x-auto scrollbar-none pb-1"
                            onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}
                          >
                             {['all', 'personal', 'unread', 'work', 'archived'].map(folder => (
                              <div 
                                key={folder}
                                onClick={() => setActiveFolder(folder)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
                                   activeFolder === folder 
                                    ? (isDark ? "bg-orange-500 text-white" : "bg-orange-500 text-white shadow-md")
                                    : (isDark ? "bg-[#1a1d24] text-gray-400 hover:text-gray-200 border border-white/5" : "bg-white text-slate-500 hover:text-slate-800 border border-black/5 shadow-sm")
                                }`}
                              >
                                 {t('chat.folders.' + folder as any)}
                               </div>
                           ))}
                         </div>
                         <div onClick={() => setShowAdvancedFilterModal(true)} className={`p-1.5 rounded-full cursor-pointer shrink-0 transition-colors flex items-center justify-center ${advancedFilters.hasMedia || advancedFilters.hasAudio || advancedFilters.hasReplies || advancedFilters.fromBots || advancedFilters.priority ? (isDark ? "bg-orange-500 text-white" : "bg-orange-500 text-white shadow-md") : (isDark ? "bg-[#1a1d24] text-gray-400 hover:text-white border border-white/5" : "bg-white text-slate-500 hover:text-slate-800 border border-black/5 shadow-sm")}`}>
                            <ListFilter size={18} />
                         </div>
                       </div>
                    )}
                    
                    {/* Render Chats if view is chats */}
                    {view === 'chats' && filteredChats.length > 0 && (
                      <>
                         <div className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 shrink-0 ${isDark ? "text-orange-500" : "text-orange-600"}`}>{t('chat.sectionConversations')}</div>
                        {filteredChats.map(c => (
                          <ChatListItem 
                             key={c.id} 
                             chat={c} 
                             theme={theme} 
                             type="chat" 
                             active={false} 
                             onClick={() => setActiveChat(c)} 
                             onArchive={() => toggleArchive(c.id)}
                              archiveLabel={t('chat.archive')}
                             t={t}
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
                    
                    {/* Render Channels if view is channels */}
                    {view === 'channels' && filteredChannels.length > 0 && (
                      <>
                         <div className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 shrink-0 ${isDark ? "text-purple-500" : "text-purple-600"}`}>{t('chat.sectionChannels')}</div>
                        {filteredChannels.map(c => (
                          <ChatListItem 
                             key={c.id} 
                             chat={c} 
                             theme={theme} 
                             type="channel" 
                             active={false} 
                             onClick={() => setActiveChat(c)} 
                             onArchive={() => toggleArchive(c.id)}
                              archiveLabel={t('chat.archive')}
                             t={t}
                          />
                        ))}
                      </>
                    )}

                    {view === 'bots' && (
                      bots.length > 0 ? (
                        <>
                           <div className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 shrink-0 ${isDark ? "text-blue-500" : "text-blue-600"}`}>{t('chat.sectionBots')}</div>
                          {bots.map(b => (
                            <div key={b.id} className={`w-full p-4 rounded-3xl mb-4 flex flex-col gap-2 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white border border-black/5 shadow-sm"}`}>
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
                          <span className="text-[13px] text-center px-4">{t('chat.noBots')}</span>
                        </div>
                      )
                    )}
                    
                    {view !== 'bots' && filteredChats.length === 0 && filteredChannels.length === 0 && (
                      <div className={`flex flex-col items-center justify-center py-10 opacity-60 ${isDark ? "text-white" : "text-black"}`}>
                        <Search size={24} className="mb-2" />
                        <span className="text-[13px]">{t('chat.noResults')}</span>
                      </div>
                    )}
    </div>
  );
};
