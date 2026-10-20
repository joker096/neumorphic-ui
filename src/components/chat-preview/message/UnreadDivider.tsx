import React from "react";

/**
 * Telegram-style boundary between read and unread history: a hairline in the
 * accent color with a small uppercase label, visually lighter than the sticky
 * day separator so the two never compete.
 */
export function UnreadDivider({ label }: { label: string }) {
  return (
    <div
      role="separator"
      aria-label={label}
      data-unread-divider="true"
      className="flex items-center gap-3 px-1 py-2"
    >
      <span className="h-px flex-1 bg-[var(--accent)] opacity-50" aria-hidden="true" />
      <span className="shrink-0 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
        {label}
      </span>
      <span className="h-px flex-1 bg-[var(--accent)] opacity-50" aria-hidden="true" />
    </div>
  );
}
