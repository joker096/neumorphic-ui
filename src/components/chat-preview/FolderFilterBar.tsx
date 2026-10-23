import { ListFilter, Pencil } from "lucide-react";
import { useMemo } from "react";
import { CHAT_FOLDER_KEYS } from "../../constants/chatConstants";
import type { ChatFolder } from "../../lib/chat/customFolders";

interface FolderFilterBarProps {
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  advancedFilters: Record<string, boolean>;
  setShowAdvancedFilterModal: (show: boolean) => void;
  t: (key: string, options?: any) => string;
  /** CRM sales-segment folders rendered before `archived`. */
  segments?: readonly string[];
  /** Unread totals per folder key; a non-zero value renders a counter on the pill. */
  folderUnread?: Record<string, number>;
  /** User-created folders rendered after the built-in set. */
  customFolders?: ChatFolder[];
  /** Opens the folder manager. */
  onEditFolders?: () => void;
}

export const FolderFilterBar = ({ activeFolder, setActiveFolder, advancedFilters, setShowAdvancedFilterModal, t, segments = [], folderUnread = {}, customFolders = [], onEditFolders }: FolderFilterBarProps) => {
  const folders: readonly string[] = segments.length
    ? [...CHAT_FOLDER_KEYS.filter((f) => f !== "archived"), ...segments, "archived"]
    : CHAT_FOLDER_KEYS;
  const customIds = customFolders.map((f) => f.id);
  const allFolders: readonly string[] = [...folders, ...customIds];
  const customFolderById = useMemo(
    () => new Map<string, ChatFolder>(customFolders.map((f) => [f.id, f])),
    [customFolders],
  );
  return (
    <div className="flex items-center gap-2 mb-3 sm:mb-4 shrink-0">
    <div
      className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1"
      onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}
    >
      {allFolders.map((folder) => {
        const isActive = activeFolder === folder;
        const custom = customFolderById.get(folder);
        const label = custom ? custom.name : t(`chat.folders.${folder}`);
        const unread = Number(folderUnread[folder]) || 0;
        return (
          <button
            key={folder}
            type="button"
            aria-pressed={isActive}
            aria-label={unread > 0 ? `${label} (${unread})` : undefined}
            onClick={() => setActiveFolder(folder)}
            className="group min-h-11 min-w-11 p-1 flex items-center justify-center cursor-pointer transition-all shrink-0 active:scale-95"
          >
            <span
              className={`min-h-[22px] min-w-[34px] px-2 py-0 rounded-full text-xs font-bold whitespace-nowrap ${
                isActive
                  ? "bg-[var(--accent)] text-[var(--ink-on-saturate)] shadow-md"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] group-hover:bg-[var(--msg-bg-panel-hover)] border border-[var(--border-color)]"
              }`}
            >
              {label}
              {unread > 0 && (
                <span className="ml-1 tabular-nums opacity-80">{unread > 99 ? '99+' : unread}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
    {onEditFolders && (
      <button
        type="button"
        aria-label={t("chat.folders.editFolder", "Папки")}
        onClick={onEditFolders}
        className="min-w-[var(--control-height-md)] min-h-[var(--control-height-md)] p-2 rounded-full cursor-pointer shrink-0 transition-all active:scale-95 flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--msg-bg-panel-hover)] border border-[var(--border-color)]"
      >
        <Pencil size={16} />
      </button>
    )}
    <button
      type="button"
      aria-label={t('chat.advancedFilters', 'Filters')}
      onClick={() => setShowAdvancedFilterModal(true)}
      className={`min-w-[var(--control-height-md)] min-h-[var(--control-height-md)] p-2 rounded-full cursor-pointer shrink-0 transition-all active:scale-95 flex items-center justify-center ${
        advancedFilters.hasMedia || advancedFilters.hasAudio || advancedFilters.hasReplies || advancedFilters.fromBots || advancedFilters.priority
          ? "bg-[var(--accent)] text-[var(--ink-on-saturate)] shadow-md"
          : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--msg-bg-panel-hover)] border border-[var(--border-color)]"
      }`}
    >
      <ListFilter size={16} />
    </button>
    </div>
  );
};
