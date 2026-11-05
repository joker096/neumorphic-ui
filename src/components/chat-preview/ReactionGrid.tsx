import { useI18n } from "../../lib/i18n";

interface ReactionGridProps {
  emojis: string[];
  mine?: Record<string, boolean>;
  onPick: (emoji: string) => void;
  className?: string;
}

/**
 * Compact emoji grid (6 columns, 36px cells) shared by the bubble picker and
 * the hover add-reaction panel. Small visible cells keep the popover narrow;
 * the 44px hit area lives on the surrounding control where needed.
 */
export function ReactionGrid({ emojis, mine = {}, onPick, className = "" }: ReactionGridProps) {
  const { t } = useI18n();
  return (
    <div
      role="menu"
      aria-label={t("chat.reactions")}
      className={`grid grid-cols-6 gap-0.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] shadow-xl p-1 ${className}`}
    >
      {emojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="menuitem"
          aria-label={emoji}
          aria-pressed={!!mine[emoji]}
          onClick={() => onPick(emoji)}
          className={`w-9 h-9 flex items-center justify-center cursor-pointer rounded-lg text-base transition-colors hover:bg-[var(--msg-bg-panel-hover)] active:scale-95 ${
            mine[emoji] ? "bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]" : ""
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
