import { Plus, Globe, Users } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";

interface ChatListSearchHeaderProps {
  isDark?: boolean;
  view: string;
  t: (key: string, options?: any) => string;
  setView: (v: string) => void;
  setActiveFolder: (f: string) => void;
  setShowCreateChannel: (s: boolean) => void;
  setShowCreateBot: (s: boolean) => void;
  setShowCreateGroup?: (s: boolean) => void;
  onOpenGlobalSearch?: () => void;
}

export const ChatListSearchHeader = ({
  view,
  t, setView, setActiveFolder, setShowCreateChannel, setShowCreateBot, setShowCreateGroup, onOpenGlobalSearch,
}: ChatListSearchHeaderProps) => {
  return (
    <div className="mb-4 sm:mb-6 relative z-30 flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
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
      <NotificationCenter t={t} />
    </div>
  );
};
