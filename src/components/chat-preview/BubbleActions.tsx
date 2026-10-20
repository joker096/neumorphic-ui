import { Bookmark, Reply } from "lucide-react";
import { useI18n } from "../../lib/i18n";

interface BubbleActionsProps {
  msg: any;
  isMe: boolean;
  chat: any;
  chatSavedMessages: any[];
  onReply: (msg: any) => void;
  onToggleSavedMessage: (chat: any, msg: any) => void;
}

export function BubbleActions({
  msg, isMe, chat, chatSavedMessages,
  onReply, onToggleSavedMessage,
}: BubbleActionsProps) {
  const { t } = useI18n();
  const saved = chatSavedMessages.some((savedMsg: any) => savedMsg.messageId === msg.id);
  const chip = "bg-[var(--msg-bg-panel)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)] border shadow-sm backdrop-blur-sm";
  return (
    <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
      <button
        type="button"
        aria-label={t('chat.reply')}
        onClick={(e) => { e.stopPropagation(); onReply(msg); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="min-w-11 min-h-11 flex items-center justify-center rounded-full transition-colors pointer-events-none group-hover:pointer-events-auto focus-within:pointer-events-auto"
      >
        <span className={`w-7 h-7 flex items-center justify-center rounded-full transition-transform hover:scale-110 ${chip}`}>
          <Reply size={14} />
        </span>
      </button>
      <button
        type="button"
        aria-label={t('chat.save')}
        onClick={(e) => { e.stopPropagation(); onToggleSavedMessage(chat, msg); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="min-w-11 min-h-11 flex items-center justify-center rounded-full transition-colors pointer-events-none group-hover:pointer-events-auto focus-within:pointer-events-auto"
      >
        <span className={`w-7 h-7 flex items-center justify-center rounded-full transition-transform hover:scale-110 ${chip}`}>
          <Bookmark size={14} className={saved ? "fill-current" : ""} />
        </span>
      </button>
    </div>
  );
}