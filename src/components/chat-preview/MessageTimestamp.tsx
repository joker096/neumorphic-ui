import { AnimatePresence, motion } from "motion/react";
import { BellOff, Check, CheckCheck, Clock } from "lucide-react";
import { fuzzTime } from "../../utils/chatUtils";

interface MessageTimestampProps {
  msg: any;
  isMe: boolean;
  isDark: boolean;
  stealthMode: boolean;
  deliveryReceipts: boolean;
  readReceipts: boolean;
}

export function MessageTimestamp({
  msg, isMe, isDark, stealthMode, deliveryReceipts, readReceipts,
}: MessageTimestampProps) {
  return (
    <div className={`flex items-center justify-end gap-1 mt-1 text-xs font-bold tracking-wide opacity-70 ${isMe && !isDark ? "text-orange-100" : ""} ${msg.type ? "px-2" : ""}`}>
      {msg.silent && <BellOff size={12} className="mr-0.5 opacity-60" />}
      {stealthMode ? fuzzTime(msg.time, msg.id) : msg.time}
      {isMe && (
        <span className="inline-flex items-center">
          <AnimatePresence mode="wait">
            {msg.status === 'queued' && (
              <motion.span key="queued" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                <Clock size={12} strokeWidth={2.5} />
              </motion.span>
            )}
            {msg.status !== 'queued' && (!deliveryReceipts || msg.status === 'sent') && (
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
