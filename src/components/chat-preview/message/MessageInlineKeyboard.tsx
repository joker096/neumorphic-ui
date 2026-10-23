import React from "react";

/** Row/button shape the wire protocol carries on a message. */
interface KeyboardButton {
  text: string;
  action?: string;
}

interface MessageInlineKeyboardProps {
  /** Rows are rendered as-is: the sender decides the layout. */
  rows: KeyboardButton[][];
  onAction?: (action: string) => void;
}

/**
 * Inline buttons attached to a message. Presentation only — a tap forwards
 * `action` (falling back to the label) to the chat handler, which decides what
 * the button means. Bot-service buttons are a different component
 * (`features/bot/InlineKeyboard`), because those call the backend themselves.
 */
export function MessageInlineKeyboard({ rows, onAction }: MessageInlineKeyboardProps) {
  return (
    <div className="flex flex-col gap-1.5 mt-3 mb-1 w-full shrink-0">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-1.5 w-full">
          {row.map((btn, j) => (
            <button
              key={j}
              onClick={() => {
                if (onAction) onAction(btn.action || btn.text);
              }}
              className="flex-1 min-h-11 flex items-center justify-center rounded-lg text-xs font-bold transition-all active:scale-95 bg-[var(--bg-primary)] hover:bg-black/10 text-[var(--text-secondary)] border border-[var(--border-color)] dark:bg-[var(--bg-tertiary)] dark:hover:bg-[var(--hover-bg-dark)] dark:text-[var(--text-primary)]"
            >
              {btn.text}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
