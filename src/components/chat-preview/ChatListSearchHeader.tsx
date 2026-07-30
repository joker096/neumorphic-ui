import { Archive, Plus } from "lucide-react";
import { SearchInput } from "../ui/SearchInput";

interface ChatListSearchHeaderProps {
  isDark: boolean;
  view: string;
  chatSearchQuery: string;
  setChatSearchQuery: (q: string) => void;
  archivedUnreadCount: number;
  t: (key: string, options?: any) => string;
  setView: (v: string) => void;
  setActiveFolder: (f: string) => void;
  setShowCreateChannel: (s: boolean) => void;
  setShowCreateBot: (s: boolean) => void;
}

export const ChatListSearchHeader = ({
  isDark, view, chatSearchQuery, setChatSearchQuery, archivedUnreadCount,
  t, setView, setActiveFolder, setShowCreateChannel, setShowCreateBot,
}: ChatListSearchHeaderProps) => (
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
        className={`min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 relative ${isDark ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 shadow-sm"}`}
      >
        <Plus size={16} />
      </div>
    ) : (
      <div
        title={t("chat.archived")}
        onClick={() => { setView("chats"); setActiveFolder("archived"); }}
        className={`min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 relative ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-white/5 text-gray-400 hover:text-[var(--text-primary)]" : "bg-white border border-[var(--border-color)] hover:bg-black/5 text-slate-500 hover:text-slate-800 shadow-sm"}`}
      >
        <Archive size={16} />
        {archivedUnreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)] shadow-md border-[2px] border-[var(--bg-secondary)] dark:border-[var(--bg-primary)] px-1">
            {archivedUnreadCount}
          </div>
        )}
      </div>
    )}
  </div>
);




