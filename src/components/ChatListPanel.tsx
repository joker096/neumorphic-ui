import { motion } from "motion/react";
import { Plus, Bookmark, Archive, Bot, Search, ListFilter } from "lucide-react";
import { DarkSearchBar } from "./ui/DarkSearchBar";
import { LightSearchBar } from "./ui/LightSearchBar";
import { AvatarRow } from "./ui/AvatarRow";
import { ChatListItem } from "./ui/ChatListItem";
import { useSwipeGesture } from '../lib/gestures/useSwipeGesture';
import { usePullToRefresh } from '../lib/gestures/usePullToRefresh';
import { ActivityIndicator } from './ui/ActivityIndicator';

interface TabDef {
  id: string;
  label: string;
}

interface ChatListPanelProps {
  isDark: boolean;
  theme: 'light' | 'dark';
  view: string;
  setView: (v: string) => void;
  activeChat: any;
  setActiveChat: (c: any) => void;
  chatSearchQuery: string;
  setChatSearchQuery: (q: string) => void;
  filteredChats: any[];
  filteredChannels: any[];
  bots: any[];
  channels: any[];
  setShowCreateChannel: (v: boolean) => void;
  setShowCreateBot: (v: boolean) => void;
  activeFolder: string;
  setActiveFolder: (f: string) => void;
  setShowAdvancedFilterModal: (v: boolean) => void;
  advancedFilters: { hasMedia: boolean; hasAudio: boolean; hasReplies: boolean; fromBots: boolean; priority: boolean };
  toggleArchive: (id: any) => void;
  savedMessages: any[];
  archivedUnreadCount: number;
  chatFolders: Array<{ id: string; name: string; icon?: string; rules?: any[]; chatIds?: any[]; isSystem?: boolean }>;
  setShowFolderManager: (v: boolean) => void;
  setGlobalSelectedContact: (c: any) => void;
  setPreviewChat: (c: any) => void;
  setActiveStory: (s: any) => void;
  t: (key: string, vars?: any) => string;
}

const TABS: TabDef[] = [
  { id: 'stories', label: 'header.stories' },
  { id: 'chats', label: 'hub.chats' },
  { id: 'channels', label: 'hub.channels' },
  { id: 'bots', label: 'hub.bots' },
];

export const ChatListPanel = ({
  isDark, theme, view, setView, activeChat, setActiveChat,
  chatSearchQuery, setChatSearchQuery,
  filteredChats, filteredChannels, bots, channels,
  setShowCreateChannel, setShowCreateBot,
  activeFolder, setActiveFolder,
  setShowAdvancedFilterModal, advancedFilters,
  toggleArchive, savedMessages, archivedUnreadCount,
  chatFolders, setShowFolderManager,
  setGlobalSelectedContact, setPreviewChat, setActiveStory,
  t,
}: ChatListPanelProps) => {
  const pullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      await new Promise(r => setTimeout(r, 1000));
    },
  });

  const getSearchPlaceholder = () => {
    if (view === 'channels') return t('chat.searchChannels');
    if (view === 'bots') return t('chat.searchBots');
    return t('chat.searchChats');
  };

  const SearchBarComponent = isDark ? DarkSearchBar : LightSearchBar;

  return (
    <div
      style={pullToRefresh.refreshStyle}
      {...pullToRefresh.pullToRefreshHandlers}
      className={`w-full max-w-[400px] flex-1 flex flex-col overflow-y-auto rounded-[32px] p-6 mb-8 ${isDark ? "bg-[#11141c]/50 border border-white/5 scrollbar-ios" : "bg-[#eaeff4]/50 border border-black/5 shadow-inner scrollbar-ios"}`}>
      {pullToRefresh.isRefreshing && (
        <div className="flex justify-center py-4 -mt-2">
          <ActivityIndicator size={24} />
        </div>
      )}
      <div className="mb-6 relative z-30 flex items-center gap-3 shrink-0">
        <div className="flex-1">
          <SearchBarComponent searchQuery={chatSearchQuery} onSearchChange={setChatSearchQuery} placeholder={getSearchPlaceholder()} />
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
          <>
            <div
              title={t('chat.savedMessages')}
              onClick={() => setView('saved')}
              className={`w-[48px] h-[48px] rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 relative ${isDark ? "bg-[#1a1d24] border border-white/5 hover:bg-white/5 text-gray-400 hover:text-orange-400" : "bg-white border border-black/5 hover:bg-black/5 text-slate-500 hover:text-orange-600 shadow-sm"}`}
            >
              <Bookmark size={20} />
              {savedMessages.length > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-orange-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-md border-[2px] border-[#eaeff4] dark:border-[#11141c] px-1">
                  {savedMessages.length > 99 ? '99+' : savedMessages.length}
                </div>
              )}
            </div>
            <div
              title="Архив (Архив зашифрован)"
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
          </>
        )}
      </div>

      <div className={`flex items-center gap-5 mb-6 px-1 border-b pb-3 overflow-x-auto scrollbar-none shrink-0 ${isDark ? "border-white/5" : "border-black/5"}`} onWheel={(e) => { (e.currentTarget as HTMLElement).scrollLeft += e.deltaY; }}>
        {TABS.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setView(tab.id as any)}
            className={`text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors relative shrink-0 ${view === tab.id ? (isDark ? "text-orange-500" : "text-orange-600") : (isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600")}`}
          >
            {t(tab.label)}
            {view === tab.id && (
              <motion.div layoutId="messengerTab" className={`absolute -bottom-[13px] left-0 right-0 h-[2px] rounded-full ${isDark ? "bg-orange-500" : "bg-orange-600"}`} />
            )}
          </div>
        ))}
      </div>

      {view === 'stories' && <AvatarRow theme={theme} onStoryClick={setActiveStory} />}

      {view === 'chats' && (
        <div className="flex items-center gap-2 mb-6 -mx-2 px-2 shrink-0">
          <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-none pb-1" onWheel={(e) => { (e.currentTarget as HTMLElement).scrollLeft += e.deltaY; }}>
            {chatFolders.map(folder => (
              <div
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
                  activeFolder === folder.id
                    ? (isDark ? "bg-orange-500 text-white" : "bg-orange-500 text-white shadow-md")
                    : (isDark ? "bg-[#1a1d24] text-gray-400 hover:text-gray-200 border border-white/5" : "bg-white text-slate-500 hover:text-slate-800 border border-black/5 shadow-sm")
                }`}
              >
                {folder.name}
              </div>
            ))}
            <div
              onClick={() => setShowFolderManager(true)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors shrink-0 ${isDark ? "bg-[#1a1d24] text-orange-400 hover:bg-orange-500/20 border border-orange-500/30" : "bg-white text-orange-600 hover:bg-orange-50 border border-orange-300"}`}
            >
              {t('chat.addFolder')}
            </div>
          </div>
          <div onClick={() => setShowAdvancedFilterModal(true)} className={`p-1.5 rounded-full cursor-pointer shrink-0 transition-colors flex items-center justify-center ${advancedFilters.hasMedia || advancedFilters.hasAudio || advancedFilters.hasReplies || advancedFilters.fromBots || advancedFilters.priority ? (isDark ? "bg-orange-500 text-white" : "bg-orange-500 text-white shadow-md") : (isDark ? "bg-[#1a1d24] text-gray-400 hover:text-white border border-white/5" : "bg-white text-slate-500 hover:text-slate-800 border border-black/5 shadow-sm")}`}>
            <ListFilter size={18} />
          </div>
        </div>
      )}

      {view === 'chats' && filteredChats.length > 0 && (
        <>
          <div className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 shrink-0 ${isDark ? "text-orange-500" : "text-orange-600"}`}>{t('chat.conversations')}</div>
          {filteredChats.map((c: any) => {
            const swipeHandlers = useSwipeGesture({
              onSwipeLeft: () => toggleArchive(c.id),
            });

            return (
              <div key={c.id} className="mb-4" {...swipeHandlers} onContextMenu={(e) => { e.preventDefault(); setPreviewChat(c); }}>
                <ChatListItem
                  chat={c}
                  theme={theme}
                  type="chat"
                  active={false}
                  onClick={() => setActiveChat(c)}
                  onArchive={() => toggleArchive(c.id)}
                  onAvatarClick={() => setGlobalSelectedContact({
                    id: `hash_${c.id}`,
                    name: c.name,
                    color: c.color,
                    lastSeen: c.online ? 0 : Date.now() - 3600000,
                    online: c.online
                  })}
                />
              </div>
            );
          })}
        </>
      )}

      {view === 'channels' && filteredChannels.length > 0 && (
        <>
          <div className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 shrink-0 ${isDark ? "text-purple-500" : "text-purple-600"}`}>{t('chat.channels')}</div>
          {filteredChannels.map((c: any) => (
            <div key={c.id} className="mb-4">
              <ChatListItem
                chat={c}
                theme={theme}
                type="channel"
                active={false}
                onClick={() => setActiveChat(c)}
                onArchive={() => toggleArchive(c.id)}
                onAvatarClick={() => setGlobalSelectedContact({
                  id: `hash_${c.id}`,
                  name: c.name,
                  color: c.color,
                  lastSeen: Date.now() - 86400000,
                  online: false
                })}
              />
            </div>
          ))}
        </>
      )}

      {view === 'bots' && (
        bots.length > 0 ? (
          <>
            <div className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 shrink-0 ${isDark ? "text-blue-500" : "text-blue-600"}`}>{t('chat.myBots')}</div>
            {bots.map((b: any) => (
              <div key={b.id} className={`w-full p-4 rounded-3xl mb-4 flex flex-col gap-2 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white border border-black/5 shadow-sm"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
                    <Bot size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm tracking-wide">{b.name}</h4>
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('chat.tokenDisplay', { token: b.token.substring(0, 15) + '...' })}</p>
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
