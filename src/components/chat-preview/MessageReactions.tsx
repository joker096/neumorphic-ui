/**
 * Message reactions rendering component
 * Extracted from ChatPreviewLayer.tsx
 */
import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { Tooltip } from "../Tooltip";

type Reaction = { emoji: string; count: number };

export interface MessageReactionsProps {
  msg: any;
  isMe: boolean;
  activeReactionPicker: string | number | null;
  setActiveReactionPicker: (id: string | number | null) => void;
  handleReaction: (msgId: string | number, emoji: string) => void;
  availableEmojis?: string[];
  onReactionSelect?: (emoji: string) => void;
}

const DEFAULT_EMOJIS = ["👍", "❤️", "😂", "🔥", "😢", "🎉"];

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  msg,
  isMe,
  activeReactionPicker,
  setActiveReactionPicker,
  handleReaction,
  availableEmojis = DEFAULT_EMOJIS,
}) => {
  if (!msg.reactions || Object.keys(msg.reactions).length === 0) {
    return (
      <div
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center shadow-md z-10 shrink-0 border border-[var(--border-color)]/5 bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
        onClick={() => setActiveReactionPicker(activeReactionPicker === msg.id ? null : msg.id)}
        aria-label="Add reaction"
      >
        <Plus size={16} />
      </div>
    );
  }

  return (
    <>
      <div
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center shadow-md z-10 shrink-0 border border-[var(--border-color)]/5 bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
        onClick={() => setActiveReactionPicker(activeReactionPicker === msg.id ? null : msg.id)}
        aria-label="Add reaction"
      >
        <Plus size={16} />
      </div>

      <AnimatePresence>
        {activeReactionPicker === msg.id && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: isMe ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: isMe ? 10 : -10 }}
            className="absolute top-1/2 -translate-y-1/2 z-20 flex bg-black/80 backdrop-blur-md rounded-full shadow-xl px-1 py-1"
          >
            {availableEmojis.map((emoji) => (
              <div
                key={emoji}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer hover:bg-[var(--bg-secondary)]/20 rounded-full transition-colors text-lg"
                onClick={() => handleReaction(msg.id, emoji)}
                role="button"
                aria-label={`React with ${emoji}`}
                tabIndex={0}
              >
                {emoji}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {Object.keys(msg.reactions).length > 0 && (
        <div className="flex gap-1.5 mt-1 z-10 relative">
          {Object.entries(msg.reactions).map(([emoji, count]) => (
            <React.Fragment key={emoji}>
              <Tooltip
                content={`${count === 1 ? "You" : count + " users"} reacted with ${emoji}`}
                position="top"
                // Note: In a real implementation, this should use i18n: t('chat.you'), t('chat.users')
              >
                <div
                  className="rounded-full px-2 py-0.5 text-[12px] shadow-sm flex items-center cursor-help group select-none border bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)]/5 hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-color)]/10 transition-colors min-w-[44px]"
                  onClick={() => handleReaction(msg.id, emoji)}
                  role="button"
                  aria-label={`${emoji} - ${count} reactions`}
                  tabIndex={0}
                >
                  {emoji}
                  <span className="ml-1.5 text-[11px] font-bold opacity-80">{String(count)}</span>
                </div>
              </Tooltip>
            </React.Fragment>
          ))}
        </div>
      )}
    </>
  );
};

