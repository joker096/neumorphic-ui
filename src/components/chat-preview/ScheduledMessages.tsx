/**
 * Scheduled messages display component
 * Extracted from ChatPreviewLayer.tsx
 */
import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Clock, X, Send, CalendarClock } from "lucide-react";
import { FormattedText } from "./FormattedText";
import { useI18n } from "../../lib/i18n";
import { formatClockTime } from "../../utils/chatUtils";

export interface ScheduledMessage {
  id: string | number;
  chatId: string | number;
  text: string;
  type?: string;
  originalText?: string;
  scheduledAt: number;
}

export interface ScheduledMessagesProps {
  messages: any[];
  chatScheduledMessages: ScheduledMessage[];
  scheduledQueue: {
    removeMessage: (id: any) => void;
    rescheduleMessage?: (id: any, at: number) => void;
  };
}

/** Formats an epoch timestamp as a local `datetime-local` input value. */
function toDateTimeLocal(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const ScheduledMessages: React.FC<ScheduledMessagesProps> = ({
  messages,
  chatScheduledMessages,
  scheduledQueue,
}) => {
  const { t, lang } = useI18n();
  const [editing, setEditing] = useState<string | number | null>(null);
  const reschedule = scheduledQueue.rescheduleMessage;
  if (chatScheduledMessages.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 pb-3 sm:pb-4">
      <AnimatePresence>
        {chatScheduledMessages.map((msg: any) => (
          <motion.div
            layout
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 0.7, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex w-full justify-end"
          >
            <div
              className="max-w-[80%] sm:max-w-[70%] p-3 rounded-md sm:rounded-[16px] text-sm sm:text-sm shadow-sm border border-dashed relative leading-relaxed overflow-hidden break-words neu-card-inset"
            >
              <FormattedText text={msg.type === "morse" && msg.originalText ? msg.originalText : msg.text} searchTerm="" />
              <div className="flex items-center justify-end gap-1 mt-1 text-xs font-bold tracking-wide opacity-50">
                <Clock size={12} className="inline mr-1" />
                {formatClockTime(msg.scheduledAt, lang)}
                {reschedule && (
                  <button
                    onClick={() => reschedule(msg.id, Date.now())}
                    aria-label={t("chat.sendNow")}
                    title={t("chat.sendNow")}
                    className="cursor-pointer ml-1 hover:text-[var(--accent)] flex items-center justify-center w-9 h-9 min-w-11 min-h-11"
                  >
                    <Send size={12} />
                  </button>
                )}
                {reschedule && (
                  <button
                    onClick={() => setEditing(editing === msg.id ? null : msg.id)}
                    aria-label={t("chat.reschedule")}
                    title={t("chat.reschedule")}
                    className="cursor-pointer hover:text-[var(--accent)] flex items-center justify-center w-9 h-9 min-w-11 min-h-11"
                  >
                    <CalendarClock size={12} />
                  </button>
                )}
                <button onClick={() => scheduledQueue.removeMessage(msg.id)} className="cursor-pointer ml-2 hover:text-red-500 flex items-center justify-center w-9 h-9 min-w-11 min-h-11" aria-label={t("chat.removeScheduledMessage")} title={t("chat.removeScheduled")}>
                  <X size={12} />
                  <span className="sr-only">{t("chat.removeScheduled")}</span>
                </button>
              </div>
              {editing === msg.id && (
                <input
                  type="datetime-local"
                  aria-label={t("chat.reschedule")}
                  defaultValue={toDateTimeLocal(msg.scheduledAt)}
                  onChange={(e) => {
                    if (!e.target.value || !reschedule) return;
                    const ts = new Date(e.target.value).getTime();
                    if (Number.isFinite(ts)) reschedule(msg.id, ts);
                    setEditing(null);
                  }}
                  className="mt-2 w-full outline-none text-xs p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                />
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
