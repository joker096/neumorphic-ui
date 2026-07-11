/**
 * Message reactions rendering component
 * Extracted from ChatPreviewLayer.tsx
 */
import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { Tooltip } from "../ui/Tooltip";

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
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer w-8 h-8 rounded-full flex items-center justify-center shadow-md z-10 shrink-0 border border-[--border-color]/5 bg-[--bg-secondary] text-[--text-tertiary] hover:text-[--text-primary] hover:bg-[--bg-tertiary]"
        onClick={() => setActiveReactionPicker(activeReactionPicker === msg.id ? null : msg.id)}
      >
        <Plus size={16} />
      </div>
    );
  }

  return (
    <>
      <div
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer w-8 h-8 rounded-full flex items-center justify-center shadow-md z-10 shrink-0 border border-[--border-color]/5 bg-[--bg-secondary] text-[--text-tertiary] hover:text-[--text-primary] hover:bg-[--bg-tertiary]"
        onClick={() => setActiveReactionPicker(activeReactionPicker === msg.id ? null : msg.id)}
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
                className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-[--bg-secondary]/20 rounded-full transition-colors text-lg"
                onClick={() => handleReaction(msg.id, emoji)}
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
              >
                <div
                  className="rounded-full px-2 py-0.5 text-[12px] shadow-sm flex items-center cursor-help group select-none border bg-[--bg-secondary] text-[--text-primary] border-[--border-color]/5 hover:bg-[--bg-tertiary] hover:border-[--border-color]/10 transition-colors"
                  onClick={() => handleReaction(msg.id, emoji)}
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
