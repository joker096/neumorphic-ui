import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, BellOff, Check, CheckCheck, Clock } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { formatShortDate, fuzzTime } from "../../utils/chatUtils";

interface MessageTimestampProps {
  msg: any;
  isMe: boolean;
  isDark: boolean;
  stealthMode: boolean;
  deliveryReceipts: boolean;
  readReceipts: boolean;
  onRetry?: () => void;
}

export function MessageTimestamp({
  msg, isMe, isDark, stealthMode, deliveryReceipts, readReceipts, onRetry,
}: MessageTimestampProps) {
  const { t } = useI18n();
  const shortDate = typeof msg.ts === "number" ? formatShortDate(msg.ts) : "";
  const timeLabel = stealthMode ? fuzzTime(msg.time, msg.id) : msg.time;
  return (
    <div className={`message-meta flex items-center justify-end gap-1 mt-1 text-xs font-bold tracking-wide ${msg.type ? "px-2" : ""}`}>
      {shortDate && <span className="opacity-70">{shortDate === 'Yesterday' ? t('chat.yesterday', 'Yesterday') : shortDate}</span>}
      {msg.silent && <BellOff size={12} className="mr-0.5 opacity-60" />}
      {timeLabel}
      {isMe && (
        <span className="inline-flex items-center">
          <AnimatePresence mode="wait">
            {msg.status === "failed" && (
              onRetry ? (
                <motion.button
                  key="failed"
                  type="button"
                  onClick={onRetry}
                  aria-label={t("chat.retry", "Retry")}
                  title={t("chat.retry", "Retry")}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex items-center justify-center min-w-8 min-h-8 rounded-full text-[var(--danger)]"
                >
                  <AlertTriangle size={12} strokeWidth={2.5} />
                </motion.button>
              ) : (
                <motion.span
                  key="failed"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                  className="text-[var(--danger)]"
                >
                  <AlertTriangle size={12} strokeWidth={2.5} />
                </motion.span>
              )
            )}
            {msg.status === 'queued' && (
              <motion.span key="queued" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                <Clock size={12} strokeWidth={2.5} />
              </motion.span>
            )}
            {msg.status !== 'queued' && msg.status !== 'failed' && (!deliveryReceipts || msg.status === 'sent') && (
              <motion.span key="sent" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                <Check size={12} strokeWidth={2.5} />
              </motion.span>
            )}
            {deliveryReceipts && msg.status === 'delivered' && (
              <motion.span key="delivered" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                <CheckCheck size={12} strokeWidth={2.5} />
              </motion.span>
            )}
            {deliveryReceipts && readReceipts && msg.status === 'read' && (
              <motion.span key="read" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <CheckCheck size={12} strokeWidth={2.5} className="text-[var(--accent)]" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      )}
    </div>
  );
}
