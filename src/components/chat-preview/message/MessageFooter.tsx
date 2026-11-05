import { InlineKeyboard } from "../../features/bot/InlineKeyboard";
import { MessageReactions } from "../MessageReactions";

/** Italic note under a message footer row. */
const ITALIC_NOTE_CLASS = 'mt-1 text-xs italic text-[var(--text-secondary)]';

type Translate = (key: string, options?: any) => string;

interface MessageFooterProps {
  msg: any;
  chat: any;
  isMe: boolean;
  isChannel: boolean;
  translation: string | null;
  translating: boolean;
  t: Translate;
  onReactionMessage: (msgId: string | number, emoji: string) => void;
  onAction?: (action: string) => void;
}

/**
 * Everything stacked *under* the bubble (reactions, translation, bot keyboard).
 * Hover actions live inside the bubble itself (`BubbleActions`) so they can float
 * beside it without reserving a column of the message row.
 */
export function MessageFooter({
  msg, chat, isMe, isChannel,
  translation, translating, t,
  onReactionMessage, onAction,
}: MessageFooterProps) {
  return (
    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-full`}>
      <MessageReactions
        msg={msg}
        onReactionMessage={onReactionMessage}
      />
      {translating && (
        <div className={ITALIC_NOTE_CLASS}>
          {t("chat.translating", "Перевод…")}
        </div>
      )}
      {translation && !translating && (
        <div className={ITALIC_NOTE_CLASS}>
          {translation}
        </div>
      )}
      {Array.isArray(msg.inlineKeyboard) && msg.inlineKeyboard.length > 0 && (
        <InlineKeyboard
          botId={chat.botId ?? String(chat.id)}
          messageId={String(msg.id)}
          rows={msg.inlineKeyboard}
        />
      )}
    </div>
  );
}
