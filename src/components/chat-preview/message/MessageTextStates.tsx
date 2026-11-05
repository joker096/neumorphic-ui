import { Clock, Forward, MessageSquare } from "lucide-react";

/** Horizontal rule inside a separator row. */
const SEPARATOR_LINE_CLASS = 'flex-1 h-px bg-[var(--border-color)]';

type Translate = (key: string, options?: any) => string;

/** Sticky day divider between message groups. */
export function MessageDateSeparator({ label }: { label?: string }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 py-2">
      <div className={SEPARATOR_LINE_CLASS} />
      <span className="text-xs font-bold uppercase tracking-widest shrink-0 text-[var(--text-tertiary)]">
        {label}
      </span>
      <div className={SEPARATOR_LINE_CLASS} />
    </div>
  );
}

/** Placeholder rendered in place of a self-destructed message. */
export function ExpiredMessage({ isMe, t }: { isMe: boolean; t: Translate }) {
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
      <div className={`flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-3 py-2 text-xs italic bg-[var(--bg-tertiary)] text-[var(--text-secondary)]`}>
        <Clock size={14} />
        <span>{t("chat.messageExpired", "Message expired")}</span>
      </div>
    </div>
  );
}

/** "Forwarded from …" caption painted at the top of a bubble. */
export function ForwardedLabel({ forwardedFrom, t }: { forwardedFrom?: string; t: Translate }) {
  return (
    <div className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
      <Forward size={12} aria-hidden="true" />
      <span className="truncate max-w-[200px]">
        {forwardedFrom
          ? t("chat.forwardedFrom", { name: forwardedFrom })
          : t("chat.forwarded", "Forwarded")}
      </span>
    </div>
  );
}

interface ThreadRepliesChipProps {
  isMe: boolean;
  count: number;
  t: Translate;
  onOpen: () => void;
}

/** Chip under a bubble that opens the reply thread rooted at it. */
export function ThreadRepliesChip({ isMe, count, t, onOpen }: ThreadRepliesChipProps) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onOpen(); }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      aria-label={t("chat.threadOpen", "Open thread")}
      className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${isMe ? "text-[var(--text-primary)] hover:bg-black/10" : "text-[var(--accent)] hover:bg-black/10"}`}
    >
      <MessageSquare size={12} aria-hidden="true" />
      {t("chat.threadReplies", { count })}
    </button>
  );
}

interface MorseToggleProps {
  decoded: boolean;
  t: Translate;
  onToggle: () => void;
}

/** Inline switch that decodes Morse text back and forth. */
export function MorseToggle({ decoded, t, onToggle }: MorseToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={decoded ? t("chat.morseEncode", "Show Morse code") : t("chat.morseDecode", "Show text")}
      title={decoded ? t("chat.morseEncode", "Show Morse code") : t("chat.morseDecode", "Show text")}
      className={`mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono tracking-wider transition-colors min-h-11 cursor-pointer bg-[var(--amber)]/20 text-[var(--amber)] hover:bg-[var(--amber)]/30 border border-[var(--amber)]/30`}
    >
      {decoded ? "\u2022\u2022\u2022 / \u2212\u2212\u2212" : t("chat.morseSample", "A\u0411\u0412")}
    </button>
  );
}
