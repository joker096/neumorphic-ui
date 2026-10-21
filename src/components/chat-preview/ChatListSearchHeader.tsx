import { Archive, Plus, Globe, Users } from "lucide-react";
import { SearchInput } from "../ui/SearchInput";
import { NotificationCenter } from "./NotificationCenter";
import { UNREAD_BADGE_CLASS } from "./chatPreviewClasses";

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
  setShowCreateGroup?: (s: boolean) => void;
  onOpenGlobalSearch?: () => void;
}

export const ChatListSearchHeader = ({
  isDark, view, chatSearchQuery, setChatSearchQuery, archivedUnreadCount,
  t, setView, setActiveFolder, setShowCreateChannel, setShowCreateBot, setShowCreateGroup, onOpenGlobalSearch,
}: ChatListSearchHeaderProps) => (
  <div className="mb-4 sm:mb-6 relative z-30 flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
    <div className="flex-1 min-w-[120px]">
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
        className={`min-w-[var(--control-height-md)] min-h-[var(--control-height-md)] rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 relative bg-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/30`}
      >
        <Plus size={16} />
      </button>
    ) : (
      <>
      {setShowCreateGroup && (
        <button
          type="button"
          aria-label={t("chat.createGroup")}
          title={t("chat.createGroup")}
          onClick={() => setShowCreateGroup(true)}
          className={`min-w-[var(--control-height-md)] min-h-[var(--control-height-md)] rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 relative bg-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/30`}
        >
          <Users size={16} />
        </button>
      )}
      <button
        type="button"
        aria-label={t("chat.archived")}
        title={t("chat.archived")}
        onClick={() => { setView("chats"); setActiveFolder("archived"); }}
        className={`min-w-[var(--control-height-md)] min-h-[var(--control-height-md)] rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 relative bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--msg-bg-panel-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]`}
      >
        <Archive size={16} />
        {archivedUnreadCount > 0 && (
          <div className={UNREAD_BADGE_CLASS}>
            {archivedUnreadCount}
          </div>
        )}
      </button>
      </>
    )}
    {onOpenGlobalSearch && (
      <button
        type="button"
        aria-label={t("search.title", "Search")}
        title={t("search.title", "Search")}
        onClick={onOpenGlobalSearch}
        className={`min-w-[var(--control-height-md)] min-h-[var(--control-height-md)] rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--msg-bg-panel-hover)] text-[var(--text-secondary)]`}
      >
        <Globe size={16} />
      </button>
    )}
    <NotificationCenter isDark={isDark} t={t} />
  </div>
);




