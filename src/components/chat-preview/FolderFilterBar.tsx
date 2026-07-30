import { ListFilter } from "lucide-react";

interface FolderFilterBarProps {
  isDark: boolean;
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  advancedFilters: Record<string, boolean>;
  setShowAdvancedFilterModal: (show: boolean) => void;
  t: (key: string, options?: any) => string;
}

export const FolderFilterBar = ({ isDark, activeFolder, setActiveFolder, advancedFilters, setShowAdvancedFilterModal, t }: FolderFilterBarProps) => (
  <div className="flex items-center gap-2 mb-4 sm:mb-6 -mx-2 px-2 shrink-0">
    <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-none pb-1" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
      {["all", "personal", "unread", "work", "archived"].map(folder => (
        <div key={folder} onClick={() => setActiveFolder(folder)}
          className={`px-2 sm:px-4 py-1 rounded-sm sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap cursor-pointer transition-colors shrink-0 ${activeFolder === folder ? (isDark ? "bg-orange-500 text-[var(--text-primary)]" : "bg-orange-500 text-[var(--text-primary)] shadow-md") : (isDark ? "bg-[var(--bg-tertiary)] text-gray-400 hover:text-gray-200 border border-[var(--border-color)]" : "bg-white text-slate-500 hover:text-slate-800 border border-[var(--border-color)] shadow-sm")}`}>
          {t("chat.folders." + folder as any)}
        </div>
      ))}
    </div>
    <div onClick={() => setShowAdvancedFilterModal(true)} className={`p-1.5 rounded-full cursor-pointer shrink-0 transition-colors flex items-center justify-center ${advancedFilters.hasMedia || advancedFilters.hasAudio || advancedFilters.hasReplies || advancedFilters.fromBots || advancedFilters.priority ? (isDark ? "bg-orange-500 text-[var(--text-primary)]" : "bg-orange-500 text-[var(--text-primary)] shadow-md") : (isDark ? "bg-[var(--bg-tertiary)] text-gray-400 hover:text-[var(--text-primary)] border border-[var(--border-color)]" : "bg-white text-slate-500 hover:text-slate-800 border border-[var(--border-color)] shadow-sm")}`}>
      <ListFilter size={18} />
    </div>
  </div>
);




