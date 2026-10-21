import { AlertTriangle, BellOff, Check, CheckCheck, Clock, MapPin, Paperclip } from "lucide-react";
import { FormattedText } from "../FormattedText";
import { useAppStore } from "../../../store";
import { useMessageThreads } from "../../../hooks/useMessageThreads";

/** Tight caps label under the chat-list summary. */
const LABEL_TIGHT_CLASS = 'text-xs font-bold pb-[0.5px] leading-none';

type Translate = (key: string, options?: any) => string;

/**
 * Newest-bubble preview: the bubble's own text when it has any, else a
 * localized label for the media type; falls back to the stamped `chat.message`
 * for empty/legacy histories. Deriving here keeps the row fresh even though the
 * inbound append path never touches `chat.message`.
 */
function previewOf(lastMsg: any, fallback: string, t: Translate): string {
  if (!lastMsg) return fallback;
  if (typeof lastMsg.text === "string" && lastMsg.text) return lastMsg.text;
  switch (lastMsg.type) {
    case "image": return t("chat.photo");
    case "video": return t("chat.video");
    case "audio": return typeof lastMsg.duration === "string" && lastMsg.duration
      ? `${t("chat.voiceNote")}${lastMsg.duration}`
      : t("chat.voiceNote");
    case "file": return t("chat.attachment");
    case "location": return t("chat.location");
    case "article": return t("chat.article");
    default: return fallback;
  }
}

/** Outgoing-status glyph, mirroring the bubble footer: clock = queued, double check = delivered, accent double check = read. */
function statusTick(status: string | undefined, deliveryReceipts: boolean, readReceipts: boolean) {
  if (status === "queued") return <Clock size={14} strokeWidth={2.5} />;
  if (deliveryReceipts && readReceipts && status === "read") {
    return <CheckCheck size={14} strokeWidth={2.5} className="text-[var(--accent)]" />;
  }
  if (deliveryReceipts && status === "delivered") return <CheckCheck size={14} strokeWidth={2.5} />;
  return <Check size={14} strokeWidth={2.5} />;
}

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
  const deliveryReceipts = useAppStore((s: any) => s.deliveryReceipts ?? true);
  const readReceipts = useAppStore((s: any) => s.readReceipts ?? true);
  const lastMsg = (chat.history || []).at(-1);
  const lastHasAttach = lastMsg && (lastMsg.type === "image" || lastMsg.type === "video" || lastMsg.type === "audio" || lastMsg.type === "file");
  const lastMustFail = lastMsg && lastMsg.sender === "me" && lastMsg.status === "failed";
  const typing = !!typingIndicators && (chat.isTyping || remoteTyping) && type === "chat";
  // Telegram-style delivery ticks on the preview line — only for the viewer's own
  // last bubble and only when the preview actually shows that bubble (not a draft
  // or a live typing indicator).
  const showTicks = !!lastMsg && lastMsg.sender === "me" && lastMsg.status !== "failed" && !typing && !draftText;
  // Telegram prefixes group previews with the author («Alice: hi»), but not for the
  // viewer's own bubble nor when the line already shows typing/draft instead of the
  // last message.
  const isGroup = chat?.type === "group" || Array.isArray(chat?.members);
  const senderPrefix =
    isGroup && lastMsg && lastMsg.sender && lastMsg.sender !== "me" && !typing && !draftText
      ? `${String(lastMsg.sender)}: `
      : "";
  // Telegram tells you a chat is alive even when the last bubble is a thread root:
  // the reply counter rides next to the preview so the row reads «N replies» without
  // opening the chat. Hidden while the line shows typing/draft instead of the message.
  const threads = useMessageThreads(chat.history);
  // Anchor on the thread root, not on the last bubble: the newest message in a
  // threaded chat is usually a reply, and its own descendant count is zero.
  // `rootOf` returns the root message itself, so the count is read by its id.
  const replyCount =
    lastMsg && !typing && !draftText
      ? threads.countOf(threads.rootOf(lastMsg.id)?.id)
      : 0;

  return (
    <div className="flex-1 min-w-0 flex flex-col justify-center pr-2">
      <div className="flex justify-between items-center mb-[2px]">
        <span className={`chat-item-title truncate pr-2 flex items-center gap-1`}>
          {chat.name}
        </span>
        <span className={`chat-item-time shrink-0 flex items-center gap-1`}>
          {chat.pinned && (
            <MapPin
              size={12}
              className="shrink-0 rotate-45 text-[var(--text-secondary)]"
              role="img"
              aria-label={t("chat.pinned", "Pinned")}
            />
          )}
          {chat.isMuted && (
            <BellOff size={12} className="shrink-0 opacity-60" role="img" aria-label={t("chat.muted", "Muted")} />
          )}
          {fuzzedTime}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className={`chat-item-subtitle truncate pr-4 flex items-center gap-1 ${active ? "text-[var(--accent)]" : ""} ${chat.unread ? "font-medium" : ""}`}>
          <span className="flex items-center gap-1 min-w-0">
            {showTicks && (
              <span className="shrink-0 inline-flex items-center" aria-hidden="true">
                {statusTick(lastMsg?.status, deliveryReceipts, readReceipts)}
              </span>
            )}
            {lastHasAttach && <Paperclip size={12} className="shrink-0 opacity-70" />}
            {lastMustFail && <AlertTriangle size={12} className="shrink-0 text-red-500" />}
          </span>
          {typing ? (
            <span className="font-bold tracking-wide italic text-[var(--accent)]">{t("chat.typing")}</span>
          ) : draftText ? (
            <span className="italic text-[var(--text-secondary)]">
              {t("chat.draft", "Draft")}: <FormattedText text={draftText} />
            </span>
          ) : (
            <>
              {senderPrefix && (
                <span className="shrink-0 text-[var(--text-secondary)]">{senderPrefix}</span>
              )}
              <FormattedText text={previewOf(lastMsg, chat.message, t)} />
              {replyCount > 0 && (
                <span className="shrink-0 font-semibold text-[var(--accent)]">
                  {t("chat.threadReplies", { count: replyCount })}
                </span>
              )}
            </>
          )}
        </span>
        {chat.unread > 0 && !chat.hasMentions && (
          <div className={`badge unread shrink-0${chat.isMuted ? " badge-muted" : ""}`}>
            <span className={LABEL_TIGHT_CLASS}>{chat.unread}</span>
          </div>
        )}
        {chat.hasMentions && (
          <div className={`shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center shadow-sm bg-[var(--chat-mention-bg)] text-[var(--chat-mention-text)]`}>
            <span className={LABEL_TIGHT_CLASS}>@</span>
          </div>
        )}
      </div>
    </div>
  );
}
