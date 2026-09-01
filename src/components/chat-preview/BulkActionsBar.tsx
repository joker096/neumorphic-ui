import { Archive, CheckCheck, Trash2, X } from "lucide-react";

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
    <button onClick={onCancel} aria-label={t("chat.cancel")} title={t("chat.cancel")} className={`w-9 h-9 min-w-11 min-h-11 flex items-center justify-center rounded-full text-xs sm:text-xs font-bold transition-colors ${isDark ? "bg-[var(--bg-tertiary)] text-gray-300 hover:text-[var(--text-primary)] border border-[var(--border-color)]" : "bg-white text-slate-600 hover:text-slate-800 border border-[var(--border-color)] shadow-sm"}`}>
      <X size={16} />
      <span className="sr-only">{t("chat.cancel")}</span>
    </button>
    <span className={`text-xs font-bold px-2 ${isDark ? "text-gray-300" : "text-slate-600"}`}>
      {selectedIds.size} {t("chat.selected")}
    </span>
    <div className="flex-1" />
    <button onClick={onArchive} aria-label={t("chat.archive")} title={t("chat.archive")} className={`w-9 h-9 min-w-11 min-h-11 flex items-center justify-center rounded-full text-xs sm:text-xs font-bold transition-colors ${isDark ? "bg-[var(--bg-tertiary)] text-gray-300 hover:text-[var(--text-primary)] border border-[var(--border-color)]" : "bg-white text-slate-600 hover:text-slate-800 border border-[var(--border-color)] shadow-sm"}`}>
      <Archive size={16} />
      <span className="sr-only">{t("chat.archive")}</span>
    </button>
    <button onClick={onDelete} aria-label={t("chat.delete")} title={t("chat.delete")} className={`w-9 h-9 min-w-11 min-h-11 flex items-center justify-center rounded-full text-xs sm:text-xs font-bold transition-colors ${isDark ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-red-500/10 text-red-600 hover:bg-red-500/20"}`}>
      <Trash2 size={16} />
      <span className="sr-only">{t("chat.delete")}</span>
    </button>
    <button onClick={onMarkRead} aria-label={t("chat.markRead")} title={t("chat.markRead")} className={`w-9 h-9 min-w-11 min-h-11 flex items-center justify-center rounded-full text-xs sm:text-xs font-bold transition-colors ${isDark ? "bg-[var(--bg-tertiary)] text-gray-300 hover:text-[var(--text-primary)] border border-[var(--border-color)]" : "bg-white text-slate-600 hover:text-slate-800 border border-[var(--border-color)] shadow-sm"}`}>
      <CheckCheck size={16} />
      <span className="sr-only">{t("chat.markRead")}</span>
    </button>
  </div>
);




