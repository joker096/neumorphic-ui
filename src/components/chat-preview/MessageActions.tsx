import React from "react";
import { Bookmark } from "lucide-react";

interface MessageActionsProps {
  isMe: boolean;
  isDark: boolean;
  isSaved: boolean;
  onReply?: () => void;
  onToggleSaved?: () => void;
  t: (key: string) => string;
}

export const MessageActions = ({ isMe, isDark, isSaved, onReply, onToggleSaved, t }: MessageActionsProps) => {
  if (isMe && !onReply && !onToggleSaved) return null;

  return (
    <div className={`mt-2 flex items-center gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
      {onReply && (
        <button
          onClick={onReply}
          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full transition-colors ${
            isDark
              ? "text-gray-400 hover:text-white hover:bg-white/5"
              : "text-slate-500 hover:text-slate-800 hover:bg-black/5"
          }`}
        >
          {t('chat.reply')}
        </button>
      )}
      {onToggleSaved && (
        <button
          onClick={onToggleSaved}
          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full transition-colors flex items-center gap-1 ${
            isDark
              ? "text-gray-400 hover:text-white hover:bg-white/5"
              : "text-slate-500 hover:text-slate-800 hover:bg-black/5"
          }`}
        >
          <Bookmark size={10} />
          {isSaved ? t('chat.saved') : t('chat.save')}
        </button>
      )}
    </div>
  );
};
