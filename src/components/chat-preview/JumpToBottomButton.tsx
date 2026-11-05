import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

interface JumpToBottomButtonProps {
  isNearBottom: boolean;
  unreadSinceScroll: number;
  onScrollToBottom: () => void;
  onScrollToUnread?: () => void;
  /** Localized accessible name — jumps to the first unread when there are any. */
  label?: string;
}

/**
 * Floating "down" FAB, Telegram-style: a single tap jumps to the newest message,
 * or to the first unread bubble when unread messages accumulated while scrolled up.
 */
export const JumpToBottomButton = ({
  isNearBottom,
  unreadSinceScroll,
  onScrollToBottom,
  onScrollToUnread,
  label,
}: JumpToBottomButtonProps) => {
  const hasUnread = unreadSinceScroll > 0 && Boolean(onScrollToUnread);
  return (
    <AnimatePresence>
      {!isNearBottom && (
        <motion.button
          type="button"
          aria-label={label}
          title={label}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          onClick={() => {
            if (hasUnread) onScrollToUnread?.();
            else onScrollToBottom();
          }}
          className="absolute bottom-6 left-1/2 z-30 flex min-h-11 min-w-11 -translate-x-1/2 items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] px-3 text-[var(--ink-on-saturate)] shadow-[var(--msg-shadow-accent)] transition-transform active:scale-95 cursor-pointer"
        >
          <ChevronDown size={18} strokeWidth={2.5} />
          {unreadSinceScroll > 0 && (
            <span className="text-xs font-bold tabular-nums">{unreadSinceScroll}</span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
};
