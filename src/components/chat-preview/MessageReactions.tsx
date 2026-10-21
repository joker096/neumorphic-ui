import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { Tooltip } from "../Tooltip";
import { useI18n } from "../../lib/i18n";
import { useAppStore } from "../../store";
import { getAvailableReactionEmojis } from "../../config/reactions";

interface MessageReactionsProps {
  msg: any;
  isMe: boolean;
  activeReactionPicker: string | number | null;
  onSetActiveReactionPicker: (id: string | number | null) => void;
  onReactionMessage: (msgId: string | number, emoji: string) => void;
}

/** Reaction pills under a bubble, the hover-revealed add button and the emoji popover. */
export function MessageReactions({ msg, isMe, activeReactionPicker, onSetActiveReactionPicker, onReactionMessage }: MessageReactionsProps) {
  const { t } = useI18n();
  const premium = useAppStore(s => s.premiumEntitlement.premium);
  const availableEmojis = getAvailableReactionEmojis(premium);
  const mine = (msg.myReactions || {}) as Record<string, boolean>;
  const pickerOpen = activeReactionPicker === msg.id;
  return (
    <>
      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
        <div className="flex gap-1.5 mt-1 z-10 relative">
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
                  <span className="ml-1.5 text-xs font-bold opacity-60">{String(count)}</span>
                </div>
              </Tooltip>
            </React.Fragment>
          ))}
        </div>
      )}
      <button
        type="button"
        aria-label={t("chat.reactions")}
        aria-expanded={pickerOpen}
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer min-w-11 min-h-11 flex items-center justify-center rounded-full pointer-events-none group-hover:pointer-events-auto focus-visible:pointer-events-auto"
        onClick={() => onSetActiveReactionPicker(pickerOpen ? null : msg.id)}
      >
        <span className={`w-7 h-7 flex items-center justify-center rounded-full border shadow-sm backdrop-blur-sm transition-transform hover:scale-110 ${pickerOpen ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]" : "bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
          <Plus size={14} />
        </span>
      </button>
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: isMe ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: isMe ? 10 : -10 }}
            className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "right-[calc(100%+8px)]" : "left-[calc(100%+8px)]"} z-20 flex rounded-full border border-[var(--border-color)] bg-[var(--bg-tertiary)] shadow-xl px-1 py-1`}
          >
            {availableEmojis.map(emoji => (
              <button
                key={emoji}
                type="button"
                className="min-w-11 min-h-11 flex items-center justify-center cursor-pointer hover:bg-[var(--msg-bg-panel-hover)] rounded-full transition-colors text-lg"
                onClick={() => onReactionMessage(msg.id, emoji)}
                aria-label={emoji}
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
