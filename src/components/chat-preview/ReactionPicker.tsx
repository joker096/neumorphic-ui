import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";

interface ReactionPickerProps {
  visible: boolean;
  isDark: boolean;
  isMe: boolean;
  messageId: number | string;
  emojis: string[];
  onSelect: (emoji: string) => void;
}

export const ReactionPicker = ({ visible, isDark, isMe, messageId, emojis, onSelect }: ReactionPickerProps) => {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: isMe ? 10 : -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: isMe ? 10 : -10 }}
      className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "right-[calc(100%+8px)] mr-0" : "left-[calc(100%+8px)] ml-0"} z-20 flex bg-black/80 backdrop-blur-md rounded-full shadow-xl px-1 py-1`}
    >
      {emojis.map(emoji => (
        <div
          key={emoji}
          className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-white/20 rounded-full transition-colors text-lg"
          onClick={() => onSelect(emoji)}
        >
          {emoji}
        </div>
      ))}
    </motion.div>
  );
};
