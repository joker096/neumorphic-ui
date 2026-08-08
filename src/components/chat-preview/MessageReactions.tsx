import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { Tooltip } from "../Tooltip";
import { useI18n } from "../../lib/i18n";

const AVAILABLE_EMOJIS = ["👍", "❤️", "😂", "🔥", "😢", "🎉"];

interface MessageReactionsProps {
  msg: any;
  isMe: boolean;
  isDark: boolean;
  activeReactionPicker: string | number | null;
  onSetActiveReactionPicker: (id: string | number | null) => void;
  onReactionMessage: (msgId: string | number, emoji: string) => void;
}

export function MessageReactions({ msg, isMe, isDark, activeReactionPicker, onSetActiveReactionPicker, onReactionMessage }: MessageReactionsProps) {
  const { t } = useI18n();
  return (
    <>
      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
        <div className="flex gap-1.5 mt-1 z-10 relative">
          {Object.entries(msg.reactions).map(([emoji, count]) => (
            <React.Fragment key={emoji}>
              <Tooltip content={`${count === 1 ? 'You' : count + ' users'} reacted with ${emoji}`} position="top" theme={isDark ? 'dark' : 'light'}>
                <div
                  className={`rounded-full px-2 py-0.5 text-[12px] shadow-sm flex items-center cursor-help group select-none border transition-colors ${isDark ? "bg-[var(--bg-tertiary)] text-gray-300 border-[var(--border-color)] hover:border-[var(--border-color)] hover:bg-[var(--hover-bg-dark)]" : "bg-white text-slate-700 border-[var(--border-color)] hover:bg-slate-50 hover:border-[var(--border-color)]"}`}
                  onClick={() => onReactionMessage(msg.id, emoji)}
                >
                  {emoji}
                  <span className={`ml-1.5 text-[11px] font-bold ${isDark ? "opacity-60" : "opacity-80"}`}>{String(count)}</span>
                </div>
              </Tooltip>
            </React.Fragment>
          ))}
        </div>
      )}
      <div
        className={`opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${isDark ? "bg-[#2a2d36] text-gray-400 hover:text-[var(--text-primary)]" : "bg-white text-slate-400 hover:text-slate-800"} w-10 h-10 rounded-full flex items-center justify-center shadow-md z-10 shrink-0 border border-[var(--border-color)]`}
        onClick={() => onSetActiveReactionPicker(activeReactionPicker === msg.id ? null : msg.id)}
        aria-label={t("chat.reactions")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSetActiveReactionPicker(activeReactionPicker === msg.id ? null : msg.id); }}
      >
        <Plus size={16} />
      </div>
      <AnimatePresence>
        {activeReactionPicker === msg.id && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: isMe ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: isMe ? 10 : -10 }}
            className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "right-[calc(100%+8px)] mr-0" : "left-[calc(100%+8px)] ml-0"} z-20 flex bg-black/80 backdrop-blur-md rounded-full shadow-xl px-1 py-1`}
          >
            {AVAILABLE_EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                className="w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-white/20 rounded-full transition-colors text-lg"
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
