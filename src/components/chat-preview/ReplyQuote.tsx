import { useI18n } from "../../lib/i18n";
import { EXPIRED_QUOTE_TYPE } from "../../lib/selfDestruct";
import { decodeIfMorse } from "../MorseDecoder";

interface ReplyQuoteProps {
  replyTo: any;
  isDark: boolean;
  /** When provided, the quote is tappable and scrolls to the original message. */
  onJump?: () => void;
}

export function ReplyQuote({ replyTo, isDark, onJump }: ReplyQuoteProps) {
  const { t } = useI18n();
  const base = `mb-2 px-3 py-2 rounded-xl border-l-2 text-[12px] ${isDark ? "bg-white/5 border-orange-400 text-[var(--text-secondary)]" : "bg-black/5 border-orange-500 text-[var(--text-secondary)]"}`;
  const body = (
    <>
      <div className="font-bold text-xs uppercase tracking-widest opacity-70 mb-1">
        {t('chat.replyingTo')} {replyTo.sender === "me" ? t('chat.yourMessage') : replyTo.sender}
      </div>
      <div className="line-clamp-2">
        {replyTo.type === EXPIRED_QUOTE_TYPE ? (
          t("chat.messageExpired", "Message expired")
        ) : replyTo.text ? (
          decodeIfMorse(replyTo.text)
        ) : replyTo.type === "audio" ? (
          `${t('chat.voiceNote')}${replyTo.duration || ""}`
        ) : (
          t('chat.attachment')
        )}
      </div>
    </>
  );
  if (onJump) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onJump(); }}
        aria-label={t("chat.jumpToMessage", "Go to message")}
        className={`${base} block w-full text-left cursor-pointer transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-black/10"}`}
      >
        {body}
      </button>
    );
  }
  return <div className={base}>{body}</div>;
}
