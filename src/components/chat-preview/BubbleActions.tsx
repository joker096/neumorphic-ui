import { Bookmark, Reply } from "lucide-react";
import { useI18n } from "../../lib/i18n";

interface BubbleActionsProps {
  msg: any;
  isMe: boolean;
  isDark: boolean;
  chat: any;
  chatSavedMessages: any[];
  onReply: (msg: any) => void;
  onToggleSavedMessage: (chat: any, msg: any) => void;
}

export function BubbleActions({
  msg, isMe, isDark, chat, chatSavedMessages,
  onReply, onToggleSavedMessage,
}: BubbleActionsProps) {
  const { t } = useI18n();
  return (
    <div className={`absolute top-1 ${isMe ? "left-1" : "right-1"} z-20 flex items-center gap-0.5 rounded-full px-1 py-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 ${isDark ? "bg-black/55" : "bg-white/85"} backdrop-blur-sm`}>
      <button
        type="button"
        aria-label={t('chat.reply')}
        onClick={(e) => { e.stopPropagation(); onReply(msg); }}
        onPointerDown={(e) => e.stopPropagation()}
        className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors pointer-events-none group-hover:pointer-events-auto focus-within:pointer-events-auto ${isDark ? "text-gray-200 hover:bg-white/20" : "text-slate-600 hover:bg-black/10"}`}
      >
        <Reply size={16} />
      </button>
      <button
        type="button"
        aria-label={t('chat.save')}
        onClick={(e) => { e.stopPropagation(); onToggleSavedMessage(chat, msg); }}
        onPointerDown={(e) => e.stopPropagation()}
        className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors pointer-events-none group-hover:pointer-events-auto focus-within:pointer-events-auto ${isDark ? "text-gray-200 hover:bg-white/20" : "text-slate-600 hover:bg-black/10"}`}
      >
        {chatSavedMessages.some((saved: any) => saved.messageId === msg.id) ? (
          <Bookmark size={16} className="fill-current" />
        ) : (
          <Bookmark size={16} />
        )}
      </button>
    </div>
  );
}
