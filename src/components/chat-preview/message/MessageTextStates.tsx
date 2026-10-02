import { Clock } from "lucide-react";

type Translate = (key: string, options?: any) => string;

/** Sticky day divider between message groups. */
export function MessageDateSeparator({ isDark, label }: { isDark: boolean; label?: string }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 py-2">
      <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
      <span className="text-xs font-bold uppercase tracking-widest shrink-0 text-[var(--text-tertiary)]">
        {label}
      </span>
      <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
    </div>
  );
}

/** Placeholder rendered in place of a self-destructed message. */
export function ExpiredMessage({ isMe, isDark, t }: { isMe: boolean; isDark: boolean; t: Translate }) {
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
      <div className={`flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-3 py-2 text-xs italic ${isDark ? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]" : "bg-slate-100 text-slate-500"}`}>
        <Clock size={14} />
        <span>{t("chat.messageExpired", "Message expired")}</span>
      </div>
    </div>
  );
}

interface MorseToggleProps {
  decoded: boolean;
  isDark: boolean;
  t: Translate;
  onToggle: () => void;
}

/** Inline switch that decodes Morse text back and forth. */
export function MorseToggle({ decoded, isDark, t, onToggle }: MorseToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={decoded ? t("chat.morseEncode", "Show Morse code") : t("chat.morseDecode", "Show text")}
      title={decoded ? t("chat.morseEncode", "Show Morse code") : t("chat.morseDecode", "Show text")}
      className={`mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono tracking-wider transition-colors min-h-11 cursor-pointer ${isDark ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30" : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/30"}`}
    >
      {decoded ? "\u2022\u2022\u2022 / \u2212\u2212\u2212" : t("chat.morseSample", "A\u0411\u0412")}
    </button>
  );
}
