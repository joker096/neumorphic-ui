import { useI18n } from "../../lib/i18n";
import { decodeIfMorse } from "../MorseDecoder";

interface ReplyQuoteProps {
  replyTo: any;
  isDark: boolean;
}

export function ReplyQuote({ replyTo, isDark }: ReplyQuoteProps) {
  const { t } = useI18n();
  return (
    <div className={`mb-2 px-3 py-2 rounded-xl border-l-2 text-[12px] ${isDark ? "bg-white/5 border-orange-400 text-gray-300" : "bg-black/5 border-orange-500 text-slate-600"}`}>
      <div className="font-bold text-xs uppercase tracking-widest opacity-70 mb-1">
        {t('chat.replyingTo')} {replyTo.sender === "me" ? t('chat.yourMessage') : replyTo.sender}
      </div>
      <div className="line-clamp-2">
        {replyTo.text ? (
          decodeIfMorse(replyTo.text)
        ) : replyTo.type === "audio" ? (
          `${t('chat.voiceNote')}${replyTo.duration || ""}`
        ) : (
          t('chat.attachment')
        )}
      </div>
    </div>
  );
}
