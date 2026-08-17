import { Archive, Plus, Globe } from "lucide-react";
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
  onOpenGlobalSearch?: () => void;
}

export const ChatListSearchHeader = ({
  isDark, view, chatSearchQuery, setChatSearchQuery, archivedUnreadCount,
  t, setView, setActiveFolder, setShowCreateChannel, setShowCreateBot, onOpenGlobalSearch,
}: ChatListSearchHeaderProps) => (
  <div className="mb-4 sm:mb-6 relative z-30 flex items-center gap-2 sm:gap-3 shrink-0">
    <div className="flex-1 min-w-0">
      <SearchInput
        value={chatSearchQuery}
        onChange={setChatSearchQuery}
        placeholder={view === "channels" ? t("chat.searchChannelsPlaceholder") : view === "bots" ? t("chat.searchBotsPlaceholder") : t("chat.searchPlaceholder")}
        isDark={isDark}
        shape="pill"
      />
    </div>
    {(view === "channels" || view === "bots") ? (
      <button
        type="button"
        aria-label={view === "channels" ? t("chat.createChannel") : t("chat.createBot")}
        onClick={() => view === "channels" ? setShowCreateChannel(true) : setShowCreateBot(true)}
        title={view === "channels" ? t("chat.createChannel") : t("chat.createBot")}
        className={`min-w-[var(--control-height-md)] min-h-[var(--control-height-md)] rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 relative ${isDark ? "bg-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/30" : "bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 shadow-sm"}`}
      >
        <Plus size={16} />
      </button>
    ) : (
      <button
        type="button"
        aria-label={t("chat.archived")}
        title={t("chat.archived")}
        onClick={() => { setView("chats"); setActiveFolder("archived"); }}
        className={`min-w-[var(--control-height-md)] min-h-[var(--control-height-md)] rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 relative ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-white/5 text-gray-400 hover:text-[var(--text-primary)]" : "bg-white border border-[var(--border-color)] hover:bg-black/5 text-slate-500 hover:text-slate-800 shadow-sm"}`}
      >
        <Archive size={16} />
        {archivedUnreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md border-[2px] border-[var(--bg-secondary)] dark:border-[var(--bg-primary)] px-1">
            {archivedUnreadCount}
          </div>
        )}
      </button>
    )}
    {onOpenGlobalSearch && (
      <button
        type="button"
        aria-label={t("search.title", "Search")}
        title={t("search.title", "Search")}
        onClick={onOpenGlobalSearch}
        className={`min-w-[var(--control-height-md)] min-h-[var(--control-height-md)] rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-white/5 text-[var(--text-secondary)]" : "bg-white border border-[var(--border-color)] hover:bg-black/5 text-slate-600 shadow-sm"}`}
      >
        <Globe size={16} />
      </button>
    )}
  </div>
);




