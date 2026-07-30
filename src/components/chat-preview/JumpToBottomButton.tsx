import { motion, AnimatePresence } from "motion/react";

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
          isDark ? 'bg-orange-500 text-[var(--text-primary)] hover:bg-orange-400' : 'bg-orange-500 text-[var(--text-primary)] hover:bg-orange-400'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6"/>
        </svg>
        {unreadSinceScroll > 0 && (
          <span className="text-[11px] font-bold">{unreadSinceScroll}</span>
        )}
      </motion.button>
    )}
  </AnimatePresence>
);

