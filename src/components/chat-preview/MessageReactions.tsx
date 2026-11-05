import React from "react";
import { Tooltip } from "../Tooltip";
import { useI18n } from "../../lib/i18n";

interface MessageReactionsProps {
  msg: any;
  onReactionMessage: (msgId: string | number, emoji: string) => void;
}

/**
 * Reaction pills under a bubble.
 *
 * Adding a reaction lives in the hover toolbar (`BubbleActions`) and in the
 * long-press menu, so the footer must not reserve an invisible 44px control
 * under every message — that dead strip was the main source of vertical gaps
 * between bubbles.
 */
export function MessageReactions({ msg, onReactionMessage }: MessageReactionsProps) {
  const { t } = useI18n();
  const mine = (msg.myReactions || {}) as Record<string, boolean>;

  if (!msg.reactions || Object.keys(msg.reactions).length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1 z-10 relative">
      {Object.entries(msg.reactions).map(([emoji, count]) => (
        <React.Fragment key={emoji}>
          <Tooltip content={t('chat.reactionTooltip', { count: Number(count), emoji })} position="top">
            <div
              role="button"
              tabIndex={0}
              aria-pressed={!!mine[emoji]}
              className={`rounded-full px-2 py-0.5 text-xs flex items-center cursor-pointer select-none border transition-all active:scale-95 ${mine[emoji] ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--msg-bg-panel-hover)] hover:text-[var(--text-primary)]"}`}
              onClick={() => onReactionMessage(msg.id, emoji)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onReactionMessage(msg.id, emoji); } }}
            >
              {emoji}
              <span className="ml-1.5 text-[11px] font-bold opacity-60">{String(count)}</span>
            </div>
          </Tooltip>
        </React.Fragment>
      ))}
    </div>
  );
}
