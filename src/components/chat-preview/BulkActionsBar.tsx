import { Archive, Bell, CheckCheck, Trash2, X } from "lucide-react";

/** Pill button of the bulk action bar. */
const CHIP_BTN_CLASS = 'min-h-11 px-2 flex-1 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-colors bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]';

interface BulkActionsBarProps {
  selectedIds: Set<string | number>;
  t: (key: string, options?: any) => string;
  onCancel: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMarkRead: () => void;
  onToggleMute: () => void;
}

export const BulkActionsBar = ({ selectedIds, t, onCancel, onArchive, onDelete, onMarkRead, onToggleMute }: BulkActionsBarProps) => (
  <div className={`flex items-center gap-1.5 sm:gap-2 mb-2.5 sm:mb-3 px-1 py-2 rounded-2xl shrink-0 bg-[var(--msg-bg-panel)]`}>
    <button onClick={onCancel} aria-label={t("chat.cancel")} title={t("chat.cancel")} className={`min-h-11 px-2 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-colors bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]`}>
      <X size={16} />
      <span>{t("chat.cancel")}</span>
    </button>
    <span className="text-xs font-bold px-2 shrink-0 text-[var(--text-secondary)]">
      {selectedIds.size} {t("chat.selected")}
    </span>
    <div className="flex-1" />
    <button onClick={onArchive} aria-label={t("chat.archive")} title={t("chat.archive")} className={CHIP_BTN_CLASS}>
      <Archive size={16} />
      <span>{t("chat.archive")}</span>
    </button>
    <button onClick={onDelete} aria-label={t("chat.delete")} title={t("chat.delete")} className={`min-h-11 px-2 flex-1 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-colors bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-[var(--danger)]/20`}>
      <Trash2 size={16} />
      <span>{t("chat.delete")}</span>
    </button>
    <button onClick={onMarkRead} aria-label={t("chat.markRead")} title={t("chat.markRead")} className={CHIP_BTN_CLASS}>
      <CheckCheck size={16} />
      <span>{t("chat.markRead")}</span>
    </button>
    <button onClick={onToggleMute} aria-label={t("chat.mute")} title={t("chat.mute")} className={CHIP_BTN_CLASS}>
      <Bell size={16} />
      <span>{t("chat.mute")}</span>
    </button>
  </div>
);




