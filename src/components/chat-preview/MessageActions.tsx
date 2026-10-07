import React from "react";
import { Bookmark, CornerUpLeft } from "lucide-react";

interface MessageActionsProps {
  isMe: boolean;
  isDark?: boolean;
  isSaved: boolean;
  onReply?: () => void;
  onToggleSaved?: () => void;
  t: (key: string) => string;
}

export const MessageActions = ({ isMe, isDark = false, isSaved, onReply, onToggleSaved, t }: MessageActionsProps) => {
  if (isMe && !onReply && !onToggleSaved) return null;

  return (
    <div className={`mt-2 flex items-center gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
      {onReply && (
        <button
          onClick={onReply}
          aria-label={t('chat.reply')}
          title={t('chat.reply')}
          className={`w-9 h-9 min-w-11 min-h-11 flex items-center justify-center text-xs font-bold uppercase tracking-widest rounded-full transition-colors ${
            isDark
? "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-black/5"
          }`}
        >
          <CornerUpLeft size={14} />
          <span className="sr-only">{t('chat.reply')}</span>
        </button>
      )}
      {onToggleSaved && (
        <button
          onClick={onToggleSaved}
          aria-label={isSaved ? t('chat.saved') : t('chat.save')}
          title={isSaved ? t('chat.saved') : t('chat.save')}
          className={`w-9 h-9 min-w-11 min-h-11 flex items-center justify-center text-xs font-bold uppercase tracking-widest rounded-full transition-colors ${
            isDark
? "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-black/5"
          }`}
        >
          <Bookmark size={12} />
          <span className="sr-only">{isSaved ? t('chat.saved') : t('chat.save')}</span>
        </button>
      )}
    </div>
  );
};

