import { InlineKeyboard } from "../../features/bot/InlineKeyboard";
import { BubbleActions } from "../BubbleActions";
import { MessageReactions } from "../MessageReactions";

type Translate = (key: string, options?: any) => string;

interface MessageFooterProps {
  msg: any;
  chat: any;
  isMe: boolean;
  isDark: boolean;
  isChannel: boolean;
  chatSavedMessages: any[];
  activeReactionPicker: string | number | null;
  translation: string | null;
  translating: boolean;
  t: Translate;
  onReply: (msg: any) => void;
  onToggleSavedMessage: (chat: any, msg: any) => void;
  onSetActiveReactionPicker: (id: string | number | null) => void;
  onReactionMessage: (msgId: string | number, emoji: string) => void;
  onAction?: (action: string) => void;
}

/** Everything rendered beside/below the bubble: hover actions, reactions, translation note and bot keyboard. */
export function MessageFooter({
  msg, chat, isMe, isDark, isChannel, chatSavedMessages, activeReactionPicker,
  translation, translating, t, onReply, onToggleSavedMessage,
  onSetActiveReactionPicker, onReactionMessage, onAction,
}: MessageFooterProps) {
  return (
    <>
      {!isChannel && (
        <BubbleActions
          msg={msg}
          isMe={isMe}
          isDark={isDark}
          chat={chat}
          chatSavedMessages={chatSavedMessages}
          onReply={onReply}
          onToggleSavedMessage={onToggleSavedMessage}
        />
      )}
      <MessageReactions
        msg={msg}
        isMe={isMe}
        isDark={isDark}
        activeReactionPicker={activeReactionPicker}
        onSetActiveReactionPicker={onSetActiveReactionPicker}
        onReactionMessage={onReactionMessage}
      />
      {translating && (
        <div className={`mt-1 text-xs italic ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          {t("chat.translating", "\u041f\u0435\u0440\u0435\u0432\u043e\u0434\u2026")}
        </div>
      )}
      {translation && !translating && (
        <div className={`mt-1 text-xs italic ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          {translation}
        </div>
      )}
      {Array.isArray(msg.inlineKeyboard) && msg.inlineKeyboard.length > 0 && (
        <InlineKeyboard
          botId={chat.botId ?? String(chat.id)}
          messageId={String(msg.id)}
          isDark={isDark}
          rows={msg.inlineKeyboard}
        />
      )}
    </>
  );
}
