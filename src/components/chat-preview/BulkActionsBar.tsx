import { Archive, Bell, CheckCheck, Trash2, X } from "lucide-react";

interface BulkActionsBarProps {
  isDark: boolean;
  selectedIds: Set<string | number>;
  t: (key: string, options?: any) => string;
  onCancel: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMarkRead: () => void;
  onToggleMute: () => void;
}

export const BulkActionsBar = ({ isDark, selectedIds, t, onCancel, onArchive, onDelete, onMarkRead, onToggleMute }: BulkActionsBarProps) => (
  <div className={`flex items-center gap-1.5 sm:gap-2 mb-2.5 sm:mb-3 px-1 py-2 rounded-2xl shrink-0 ${isDark ? "bg-white/5" : "bg-black/5"}`}>
    <button onClick={onCancel} aria-label={t("chat.cancel")} title={t("chat.cancel")} className={`min-h-11 px-2 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-colors ${isDark ? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]" : "bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] shadow-sm"}`}>
      <X size={16} />
      <span>{t("chat.cancel")}</span>
    </button>
    <span className="text-xs font-bold px-2 shrink-0 text-[var(--text-secondary)]">
      {selectedIds.size} {t("chat.selected")}
    </span>
    <div className="flex-1" />
    <button onClick={onArchive} aria-label={t("chat.archive")} title={t("chat.archive")} className={`min-h-11 px-2 flex-1 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-colors ${isDark ? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]" : "bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] shadow-sm"}`}>
      <Archive size={16} />
      <span>{t("chat.archive")}</span>
    </button>
    <button onClick={onDelete} aria-label={t("chat.delete")} title={t("chat.delete")} className={`min-h-11 px-2 flex-1 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-colors ${isDark ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-red-500/10 text-red-600 hover:bg-red-500/20"}`}>
      <Trash2 size={16} />
      <span>{t("chat.delete")}</span>
    </button>
    <button onClick={onMarkRead} aria-label={t("chat.markRead")} title={t("chat.markRead")} className={`min-h-11 px-2 flex-1 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-colors ${isDark ? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]" : "bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] shadow-sm"}`}>
      <CheckCheck size={16} />
      <span>{t("chat.markRead")}</span>
    </button>
    <button onClick={onToggleMute} aria-label={t("chat.mute")} title={t("chat.mute")} className={`min-h-11 px-2 flex-1 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-colors ${isDark ? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]" : "bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] shadow-sm"}`}>
      <Bell size={16} />
      <span>{t("chat.mute")}</span>
    </button>
  </div>
);




