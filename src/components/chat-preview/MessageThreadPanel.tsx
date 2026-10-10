import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Send } from "lucide-react";
import { FormattedText } from "./FormattedText";
import { ReplyQuote } from "./ReplyQuote";
import { decodeIfMorse } from "../MorseDecoder";
import { formatClockTime, sendTimeOf } from "../../utils/chatUtils";

interface MessageThreadPanelProps {
  open: boolean;
  isDark: boolean;
  rootMessage: any;
  replies: any[];
  t: (key: string, fallback?: string | Record<string, string | number>) => string;
  onClose: () => void;
  onSend: (text: string) => void;
}

const timeOf = (msg: any): string => {
  if (typeof msg?.time === "string" && msg.time) return msg.time;
  const ts = sendTimeOf(msg);
  return ts ? formatClockTime(ts) : "";
};

const bodyOf = (msg: any, t: MessageThreadPanelProps["t"]): string => {
  if (typeof msg?.text === "string" && msg.text && msg.type !== "sticker") return decodeIfMorse(msg.text);
  if (msg?.type === "audio") return `${t("chat.voiceNote")}${msg.duration || ""}`;
  if (msg?.type === "location") return t("chat.location", "Location");
  if (msg?.type === "article") return msg.title || t("chat.article", "Article");
  if (msg?.attachment || msg?.album) return t("chat.attachment", "Attachment");
  return msg?.text ? String(msg.text) : "";
};

const ThreadBubble = ({
  message,
  isDark,
  t,
}: {
  message: any;
  isDark: boolean;
  t: MessageThreadPanelProps["t"];
}) => {
  const isMe = message?.sender === "me";
  const displayName = String(message?.sender || "");
  const body = bodyOf(message, t);

  return (
    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[85%] p-3 rounded-2xl text-[14px] leading-relaxed break-words msg-bubble message ${isMe ? "outgoing" : ""}`}
      >
        {!isMe && displayName && (
          <div className="mb-1 text-[12px] font-semibold leading-tight text-[var(--accent)]">
            {displayName}
          </div>
        )}
        {message?.replyTo && <ReplyQuote replyTo={message.replyTo} isDark={isDark} />}
        {body && (
          <p className="whitespace-pre-wrap">
            <FormattedText text={body} />
          </p>
        )}
        <span className={`mt-1 block text-right text-[11px] ${isDark ? "text-[var(--text-tertiary)]" : "text-[var(--text-tertiary)]"}`}>
          {timeOf(message)}
        </span>
      </div>
    </div>
  );
};

export function MessageThreadPanel({
  open,
  isDark,
  rootMessage,
  replies,
  t,
  onClose,
  onSend,
}: MessageThreadPanelProps) {
  const [draft, setDraft] = useState("");

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          role="dialog"
          aria-label={t("chat.threadTitle", "Thread")}
          className={`absolute inset-0 z-[55] flex flex-col ${isDark ? "bg-[var(--bg-primary)]" : "bg-[var(--bg-secondary)]"}`}
        >
          <div className={`h-[72px] flex items-center px-4 border-b ${isDark ? "border-[var(--border-color)] bg-[var(--bg-tertiary)]" : "border-[var(--border-color)] bg-white"}`}>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("common.close", "Close")}
              className="w-9 h-9 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors mr-3 text-[var(--text-secondary)] hover:bg-black/10"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h3 className="font-bold text-[16px] text-[var(--text-primary)]">
                {t("chat.threadTitle", "Thread")}
              </h3>
              <p className="text-xs uppercase tracking-wider font-semibold text-[var(--accent)]">
                {t("chat.threadReplies", { count: replies.length })}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {rootMessage && (
              <div className="rounded-2xl ring-1 ring-[var(--accent)]/40 pb-2">
                <ThreadBubble message={rootMessage} isDark={isDark} t={t} />
              </div>
            )}
            {replies.map((reply) => (
              <ThreadBubble key={reply.id} message={reply} isDark={isDark} t={t} />
            ))}
          </div>

          <div className={`p-4 border-t ${isDark ? "border-[var(--border-color)] bg-[color:var(--bg-tertiary)]/90 backdrop-blur-md" : "border-[var(--border-color)] bg-[var(--bg-primary)]/90 backdrop-blur-md"}`}>
            <div className={`flex items-center w-full min-h-12 rounded-full px-4 relative ${isDark ? "bg-[var(--bg-secondary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)]"}`}>
              <input
                aria-label={t("chat.threadPlaceholder", "Reply in thread")}
                type="text"
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
                placeholder={t("chat.threadPlaceholder", "Reply in thread")}
                className="flex-1 bg-transparent border-none outline-none text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim()}
                aria-label={t("chat.threadSend", "Send")}
                className={`min-w-11 min-h-11 flex items-center justify-center rounded-full ml-2 cursor-pointer transition-transform active:scale-95 ${
                  draft.trim()
                    ? "bg-[var(--accent)] text-[var(--ink-on-saturate)]"
                    : "bg-black/5 text-[var(--text-tertiary)]"
                }`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
