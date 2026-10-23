import { ArrowDownAZ, CheckCheck } from "lucide-react";

type Translate = (key: string, options?: any) => string;

interface ChatListSortControlsProps {
  chatSortBy: "recent" | "alpha";
  setChatSortBy: (sort: "recent" | "alpha") => void;
  hasFilteredUnread: boolean;
  onMarkAllRead: () => void;
  t: Translate;
  isDark?: boolean;
}

export const ChatListSortControls = ({
  chatSortBy,
  setChatSortBy,
  hasFilteredUnread,
  onMarkAllRead,
  t,
  isDark = false,
}: ChatListSortControlsProps) => {
  if (!hasFilteredUnread && !setChatSortBy) return null;

  return (
    <div className="flex justify-end gap-1 pb-2 -mt-1">
      {hasFilteredUnread && (
        <button
          type="button"
          onClick={onMarkAllRead}
          aria-label={t("chat.markAllRead", "Mark all as read")}
          title={t("chat.markAllRead", "Mark all as read")}
          className="group min-h-11 min-w-11 p-1 flex items-center justify-center rounded-full active:scale-95"
        >
          <span className="px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors bg-black/5 dark:bg-white/5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <CheckCheck size={12} aria-hidden="true" />
            {t("chat.markAllRead", "Mark all as read")}
          </span>
        </button>
      )}
      {setChatSortBy && (
        <button
          type="button"
          onClick={() => setChatSortBy(chatSortBy === "alpha" ? "recent" : "alpha")}
          aria-pressed={chatSortBy === "alpha"}
          aria-label={chatSortBy === "alpha" ? t("chat.sortByRecent", "Sort by date") : t("chat.sortByName", "Sort by name")}
          title={chatSortBy === "alpha" ? t("chat.sortByRecent", "Sort by date") : t("chat.sortByName", "Sort by name")}
          className="group min-h-11 min-w-11 p-1 flex items-center justify-center rounded-full active:scale-95"
        >
          <span className={`px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${
            chatSortBy === "alpha"
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : isDark
                ? "bg-black/5 dark:bg-white/5 text-[var(--text-tertiary)]"
                : "bg-black/5 text-[var(--text-tertiary)]"
          }`}>
            <ArrowDownAZ size={12} aria-hidden="true" />
            {chatSortBy === "alpha" ? t("chat.sortByName", "By name") : t("chat.sortByRecent", "By date")}
          </span>
        </button>
      )}
    </div>
  );
};