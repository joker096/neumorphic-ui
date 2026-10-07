import React from "react";
import { X, ChevronRight } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { decodeIfMorse } from "../MorseDecoder";

interface ChatInputReplyBarProps {
  replyTarget: any;
  setReplyTarget: (v: any) => void;
  isDark: boolean;
  t: (key: string, opts?: any) => string;
}

export function ChatInputReplyBar({ replyTarget, setReplyTarget, isDark, t }: ChatInputReplyBarProps) {
  const { t: translate } = useI18n();
  if (!replyTarget) return null;
  return (
    <div className={`mx-2 sm:mx-3 mb-1 px-2 sm:px-3 py-2 rounded-xl border-l-2 flex items-start justify-between gap-1.5 sm:gap-2 ${
      isDark ? "bg-[var(--bg-tertiary)]/80 border-[var(--accent)]/60 text-[var(--text-secondary)]" : "bg-white/80 border-[var(--accent)] text-[var(--text-secondary)]"
    }`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold opacity-70">
          <ChevronRight size={12} className="rotate-180" />
          {t("chat.replyingTo")} {replyTarget.sender === "me" ? t("chat.yourMessage") : replyTarget.sender}
        </div>
        <div className="text-[12px] truncate mt-0.5">
          {replyTarget.text
            ? decodeIfMorse(replyTarget.text)
            : replyTarget.type === "audio"
              ? `${t("chat.voiceNote")}${replyTarget.duration || ""}`
              : replyTarget.type === "image"
                ? t("chat.photoAttachment")
                : t("chat.attachment")}
        </div>
      </div>
       <button
         type="button"
         onClick={() => setReplyTarget(null)}
         aria-label={t("common.close")}
         title={t("common.close")}
        className={`mt-0.5 min-w-11 min-h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
          isDark ? "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-black/10"
        }`}
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}