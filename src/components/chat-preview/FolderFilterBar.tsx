import { ListFilter } from "lucide-react";
import { CHAT_FOLDER_KEYS } from "../../constants/chatConstants";

interface FolderFilterBarProps {
  isDark: boolean;
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  advancedFilters: Record<string, boolean>;
  setShowAdvancedFilterModal: (show: boolean) => void;
  t: (key: string, options?: any) => string;
  /** CRM sales-segment folders rendered before `archived`. */
  segments?: readonly string[];
}

export const FolderFilterBar = ({ isDark, activeFolder, setActiveFolder, advancedFilters, setShowAdvancedFilterModal, t, segments = [] }: FolderFilterBarProps) => {
  const folders: readonly string[] = segments.length
    ? [...CHAT_FOLDER_KEYS.filter((f) => f !== "archived"), ...segments, "archived"]
    : CHAT_FOLDER_KEYS;
  return (
    <div className="flex items-center gap-2 mb-3 sm:mb-4 shrink-0">
    <div
      className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1"
      onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}
    >
      {folders.map((folder) => {
        const isActive = activeFolder === folder;
        return (
          <button
            key={folder}
            type="button"
            aria-pressed={isActive}
            onClick={() => setActiveFolder(folder)}
            className="group min-h-11 min-w-11 p-1 flex items-center justify-center cursor-pointer transition-all shrink-0 active:scale-95"
          >
            <span
              className={`min-h-[22px] min-w-[34px] px-2 py-0 rounded-full text-[12px] font-bold whitespace-nowrap ${
                isActive
                  ? "bg-[var(--accent)] text-[var(--ink-on-saturate)] shadow-md"
                  : isDark
                    ? "bg-white/[0.05] text-gray-300 group-hover:text-white group-hover:bg-white/10 border border-[var(--border-color)]"
                    : "bg-white text-slate-500 group-hover:text-slate-800 group-hover:bg-slate-50 border border-slate-200 shadow-sm"
              }`}
            >
              {t(`chat.folders.${folder}`)}
            </span>
          </button>
        );
      })}
    </div>
    <button
      type="button"
      aria-label={t('chat.advancedFilters', 'Filters')}
      onClick={() => setShowAdvancedFilterModal(true)}
      className={`min-w-[var(--control-height-md)] min-h-[var(--control-height-md)] p-2 rounded-full cursor-pointer shrink-0 transition-all active:scale-95 flex items-center justify-center ${
        advancedFilters.hasMedia || advancedFilters.hasAudio || advancedFilters.hasReplies || advancedFilters.fromBots || advancedFilters.priority
          ? "bg-[var(--accent)] text-[var(--ink-on-saturate)] shadow-md"
          : isDark
            ? "bg-white/[0.05] text-gray-300 hover:text-white hover:bg-white/10 border border-[var(--border-color)]"
            : "bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-sm"
      }`}
    >
      <ListFilter size={16} />
    </button>
    </div>
  );
};
