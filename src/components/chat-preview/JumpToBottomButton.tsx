import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

interface JumpToBottomButtonProps {
  isNearBottom: boolean;
  unreadSinceScroll: number;
  isDark: boolean;
  onScrollToBottom: () => void;
}

export const JumpToBottomButton = ({ isNearBottom, unreadSinceScroll, isDark, onScrollToBottom }: JumpToBottomButtonProps) => (
  <AnimatePresence>
    {!isNearBottom && (
      <motion.button
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        onClick={onScrollToBottom}
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg cursor-pointer ${
          isDark ? 'bg-[var(--accent)] text-[var(--text-primary)] hover:brightness-110' : 'bg-[var(--accent)] text-[var(--text-primary)] hover:brightness-110'
        }`}
      >
        <ChevronDown size={16} strokeWidth={2.5} />
        {unreadSinceScroll > 0 && (
          <span className="text-xs font-bold">{unreadSinceScroll}</span>
        )}
      </motion.button>
    )}
  </AnimatePresence>
);

