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
  count,
  onCancel,
  onSelectAll,
  onForward,
  onCopy,
  onSave,
  onDelete,
}) => {
  const { t } = useI18n();
  const empty = count === 0;

  const actionClass =
    "flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-bold text-[var(--text-secondary)] transition-colors cursor-pointer hover:bg-[var(--msg-bg-panel-hover)] hover:text-[var(--text-primary)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent";

  return (
    <div className="mb-2 flex shrink-0 items-center gap-1 rounded-2xl bg-[var(--bg-tertiary)] px-1.5 py-1 sm:gap-1.5">
      <button
        type="button"
        onClick={onCancel}
        aria-label={t("chat.cancel", "Cancel")}
        title={t("chat.cancel", "Cancel")}
        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors cursor-pointer hover:bg-[var(--msg-bg-panel-hover)] hover:text-[var(--text-primary)] active:scale-95"
      >
        <X size={18} />
      </button>

      <span className="shrink-0 px-0.5 text-xs font-bold text-[var(--text-secondary)]">
        {count} {t("chat.selected", "selected")}
      </span>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onSelectAll}
        aria-label={t("chat.selectAll", "Select all")}
        title={t("chat.selectAll", "Select all")}
        className={actionClass}
      >
        <CheckCheck size={18} />
        <span className="hidden sm:inline">{t("chat.selectAll", "Select all")}</span>
      </button>

      <button
        type="button"
        onClick={onForward}
        disabled={empty}
        aria-label={t("chat.forward", "Forward")}
        title={t("chat.forward", "Forward")}
        className={actionClass}
      >
        <Forward size={18} />
        <span className="hidden sm:inline">{t("chat.forward", "Forward")}</span>
      </button>

      <button
        type="button"
        onClick={onCopy}
        disabled={empty}
        aria-label={t("chat.copy", "Copy")}
        title={t("chat.copy", "Copy")}
        className={actionClass}
      >
        <Copy size={18} />
        <span className="hidden sm:inline">{t("chat.copy", "Copy")}</span>
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={empty}
        aria-label={t("chat.save", "Save")}
        title={t("chat.save", "Save")}
        className={actionClass}
      >
        <Bookmark size={18} />
        <span className="hidden sm:inline">{t("chat.save", "Save")}</span>
      </button>

      <button
        type="button"
        onClick={onDelete}
        disabled={empty}
        aria-label={t("chat.delete", "Delete")}
        title={t("chat.delete", "Delete")}
        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-bold text-[var(--danger)] transition-colors cursor-pointer hover:bg-[var(--danger-soft)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <Trash2 size={18} />
        <span className="hidden sm:inline">{t("chat.delete", "Delete")}</span>
      </button>
    </div>
  );
};
