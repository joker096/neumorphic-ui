import React from "react";
import { Bookmark, CheckCheck, Copy, Forward, Trash2, X } from "lucide-react";
import { useI18n } from "../../lib/i18n";

interface MessageSelectionBarProps {
  isDark?: boolean;
  count: number;
  onCancel: () => void;
  onSelectAll: () => void;
  onForward: () => void;
  onCopy: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export const MessageSelectionBar: React.FC<MessageSelectionBarProps> = ({
  isDark = false,
  count,
  onCancel,
  onSelectAll,
  onForward,
  onCopy,
  onSave,
  onDelete,
}) => {
  const { t } = useI18n();
  const barBtn = (extra: string) =>
    `min-h-11 px-2 flex-1 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${extra}`;

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 px-2 py-2 rounded-2xl shrink-0 mb-2 ${isDark ? "bg-white/5" : "bg-black/5"}`}>
      <button onClick={onCancel} className={`min-h-11 px-2 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${isDark ? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]" : "bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] shadow-sm"}`} aria-label={t("chat.cancel", "Cancel")}>
        <X size={16} />
        <span>{t("chat.cancel", "Cancel")}</span>
      </button>
      <span className="text-xs font-bold px-1 shrink-0 text-[var(--text-secondary)]">
        {count} {t("chat.selected", "selected")}
      </span>
      <div className="flex-1" />
      <button onClick={onSelectAll} aria-label={t("chat.selectAll", "Select all")} title={t("chat.selectAll", "Select all")} className={barBtn(isDark ? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]" : "bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] shadow-sm")}>
        <CheckCheck size={16} />
        <span>{t("chat.selectAll", "Select all")}</span>
      </button>
      <button onClick={onForward} disabled={count === 0} aria-label={t("chat.forward", "Forward")} title={t("chat.forward", "Forward")} className={barBtn(isDark ? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] disabled:opacity-40" : "bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] shadow-sm disabled:opacity-40")}>
        <Forward size={16} />
        <span>{t("chat.forward", "Forward")}</span>
      </button>
      <button onClick={onCopy} disabled={count === 0} aria-label={t("chat.copy", "Copy")} title={t("chat.copy", "Copy")} className={barBtn(isDark ? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] disabled:opacity-40" : "bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] shadow-sm disabled:opacity-40")}>
        <Copy size={16} />
        <span>{t("chat.copy", "Copy")}</span>
      </button>
      <button onClick={onSave} disabled={count === 0} aria-label={t("chat.save", "Save")} title={t("chat.save", "Save")} className={barBtn(isDark ? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] disabled:opacity-40" : "bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] shadow-sm disabled:opacity-40")}>
        <Bookmark size={16} />
        <span>{t("chat.save", "Save")}</span>
      </button>
      <button onClick={onDelete} disabled={count === 0} aria-label={t("chat.delete", "Delete")} title={t("chat.delete", "Delete")} className={barBtn(isDark ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-40" : "bg-red-500/10 text-red-600 hover:bg-red-500/20 disabled:opacity-40")}>
        <Trash2 size={16} />
        <span>{t("chat.delete", "Delete")}</span>
      </button>
    </div>
  );
};
