import { UserPlus, X } from "lucide-react";

interface CrmLeadSuggestionBarProps {
  /** Already-localised hint, e.g. "Add +7… as a CRM lead". */
  hint: string;
  actionLabel: string;
  dismissLabel: string;
  onAdd: () => void;
  onDismiss: () => void;
}

/**
 * Slim in-chat suggestion to turn an incoming, not-yet-tracked contact into a
 * CRM lead. Purely presentational — the caller resolves what to show.
 */
export function CrmLeadSuggestionBar({ hint, actionLabel, dismissLabel, onAdd, onDismiss }: CrmLeadSuggestionBarProps) {
  return (
    <div
      role="status"
      data-testid="crm-lead-suggestion"
      className="mx-3 sm:mx-4 mb-1 flex items-center gap-2 rounded-xl border border-[var(--border-color)]/60 bg-[var(--bg-tertiary)]/70 px-3 py-1.5"
    >
      <UserPlus size={16} className="shrink-0 text-[var(--accent)]" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--text-secondary)]">{hint}</span>
      <button
        type="button"
        onClick={onAdd}
        className="shrink-0 min-h-11 rounded-lg bg-[var(--accent)] px-3 text-[12px] font-semibold text-[var(--ink-on-saturate)] transition-transform active:scale-95"
      >
        {actionLabel}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={dismissLabel}
        className="shrink-0 flex min-w-11 min-h-11 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--msg-bg-panel-hover)]"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
