import { ListFilter } from "lucide-react";

interface FolderFilterBarProps {
  isDark: boolean;
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  advancedFilters: Record<string, boolean>;
  setShowAdvancedFilterModal: (show: boolean) => void;
  t: (key: string, options?: any) => string;
}

const FOLDERS = ["all", "personal", "unread", "work", "archived"] as const;

export const FolderFilterBar = ({ isDark, activeFolder, setActiveFolder, advancedFilters, setShowAdvancedFilterModal, t }: FolderFilterBarProps) => (
  <div className="flex items-center gap-2 mb-4 sm:mb-5 shrink-0">
    <div
      className="flex-1 flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1"
      onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}
    >
      {FOLDERS.map((folder) => {
        const isActive = activeFolder === folder;
        return (
          <button
            key={folder}
            type="button"
            aria-pressed={isActive}
            onClick={() => setActiveFolder(folder)}
            className={`min-h-[var(--control-height-sm)] px-3 py-1 rounded-full text-[11px] sm:text-[12px] font-bold whitespace-nowrap cursor-pointer transition-all shrink-0 active:scale-95 ${
              isActive
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                : isDark
                  ? "bg-white/[0.05] text-gray-300 hover:text-white hover:bg-white/10 border border-[var(--border-color)]"
                  : "bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-sm"
            }`}
          >
            {t(`chat.folders.${folder}`)}
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
          ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
          : isDark
            ? "bg-white/[0.05] text-gray-300 hover:text-white hover:bg-white/10 border border-[var(--border-color)]"
            : "bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-sm"
      }`}
    >
      <ListFilter size={16} />
    </button>
  </div>
);
