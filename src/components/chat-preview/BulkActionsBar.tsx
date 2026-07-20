interface BulkActionsBarProps {
  isDark: boolean;
  selectedIds: Set<string | number>;
  t: (key: string, options?: any) => string;
  onCancel: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMarkRead: () => void;
}

export const BulkActionsBar = ({ isDark, selectedIds, t, onCancel, onArchive, onDelete, onMarkRead }: BulkActionsBarProps) => (
  <div className={`flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 px-1 py-2 rounded-2xl shrink-0 ${isDark ? "bg-white/5" : "bg-black/5"}`}>
    <button onClick={onCancel} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-colors ${isDark ? "bg-[#1a1d24] text-gray-300 hover:text-white border border-white/5" : "bg-white text-slate-600 hover:text-slate-800 border border-black/5 shadow-sm"}`}>
      {t("chat.cancel")}
    </button>
    <span className={`text-xs font-bold px-2 ${isDark ? "text-gray-300" : "text-slate-600"}`}>
      {selectedIds.size} {t("chat.selected")}
    </span>
    <div className="flex-1" />
    <button onClick={onArchive} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-colors ${isDark ? "bg-[#1a1d24] text-gray-300 hover:text-white border border-white/5" : "bg-white text-slate-600 hover:text-slate-800 border border-black/5 shadow-sm"}`}>
      {t("chat.archive")}
    </button>
    <button onClick={onDelete} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-colors ${isDark ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-red-500/10 text-red-600 hover:bg-red-500/20"}`}>
      {t("chat.delete")}
    </button>
    <button onClick={onMarkRead} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-colors ${isDark ? "bg-[#1a1d24] text-gray-300 hover:text-white border border-white/5" : "bg-white text-slate-600 hover:text-slate-800 border border-black/5 shadow-sm"}`}>
      {t("chat.markRead")}
    </button>
  </div>
);
