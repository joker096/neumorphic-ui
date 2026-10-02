import { AlertTriangle, MapPin, Paperclip } from "lucide-react";
import { FormattedText } from "../FormattedText";

type Translate = (key: string, options?: any) => string;

interface ChatListItemSummaryProps {
  chat: any;
  active: boolean;
  type: "chat" | "channel";
  fuzzedTime?: string;
  draftText?: string;
  typingIndicators: unknown;
  remoteTyping: boolean;
  t: Translate;
}

/** Title row (pinned marker, name, stealth-fuzzed time) and preview row (typing/draft/last message + badges). */
export function ChatListItemSummary({ chat, active, type, fuzzedTime, draftText, typingIndicators, remoteTyping, t }: ChatListItemSummaryProps) {
  const lastMsg = (chat.history || []).at(-1);
  const lastHasAttach = lastMsg && (lastMsg.type === "image" || lastMsg.type === "video" || lastMsg.type === "audio" || lastMsg.type === "file");
  const lastMustFail = lastMsg && lastMsg.sender === "me" && lastMsg.status === "failed";

  return (
    <div className="flex-1 min-w-0 flex flex-col justify-center pr-2">
      <div className="flex justify-between items-center mb-[2px]">
        <span className={`chat-item-title truncate pr-2 flex items-center gap-1`}>
          {chat.pinned && <MapPin size={12} className="shrink-0 opacity-60 rotate-45" />}
          {chat.name}
        </span>
        <span className={`chat-item-time shrink-0`}>{fuzzedTime}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className={`chat-item-subtitle truncate pr-4 flex items-center gap-1 ${active ? "text-[var(--accent)]" : ""} ${chat.unread ? "font-medium" : ""}`}>
          <span className="flex items-center gap-1 min-w-0">
            {lastHasAttach && <Paperclip size={12} className="shrink-0 opacity-70" />}
            {lastMustFail && <AlertTriangle size={12} className="shrink-0 text-red-500" />}
          </span>
          {typingIndicators && (chat.isTyping || remoteTyping) && type === "chat" ? (
            <span className="font-bold tracking-wide italic text-[var(--accent)]">{t("chat.typing")}</span>
          ) : draftText ? (
            <span className="italic text-[var(--text-secondary)]">
              {t("chat.draft", "Draft")}: <FormattedText text={draftText} />
            </span>
          ) : (
            <FormattedText text={chat.message} />
          )}
        </span>
        {chat.unread > 0 && (
          <div className={`badge unread shrink-0`}>
            <span className="text-xs font-bold pb-[0.5px] leading-none">{chat.unread}</span>
          </div>
        )}
        {chat.hasMentions && (
          <div className={`shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center shadow-sm bg-[var(--chat-mention-bg)] text-[var(--chat-mention-text)]`}>
            <span className="text-xs font-bold pb-[0.5px] leading-none">@</span>
          </div>
        )}
      </div>
    </div>
  );
}
