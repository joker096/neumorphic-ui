import { type LucideIcon } from "lucide-react";
import { useI18n } from "../../../lib/i18n";

interface AttachmentUnavailableProps {
  icon: LucideIcon;
  isDark: boolean;
  /** Circle for round video notes, plain rectangle elsewhere. */
  radiusClass?: string;
  /** Provided only while auto-load is blocked — renders the manual Load button. */
  onReveal?: () => void;
}

/** Placeholder row for media that is unavailable or withheld by auto-load settings. */
export function AttachmentUnavailable({ icon: Icon, isDark, radiusClass = "rounded-xl", onReveal }: AttachmentUnavailableProps) {
  const { t } = useI18n();
  return (
    <div className={`flex items-center justify-center gap-2 ${radiusClass} border border-[var(--border-color)] mb-1 py-6 text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>
      <Icon size={18} />
      <span>{t("chat.attachmentUnavailable", "Attachment unavailable")}</span>
      {onReveal && (
        <button
          type="button"
          onClick={onReveal}
          className="min-h-11 px-3 rounded-lg bg-[var(--accent)] text-[var(--ink-on-saturate)] text-xs font-semibold"
        >
          {t("chat.loadAttachment", "Load")}
        </button>
      )}
    </div>
  );
}
