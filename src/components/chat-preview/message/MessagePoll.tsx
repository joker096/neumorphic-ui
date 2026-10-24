import { Check } from "lucide-react";
import { useI18n } from "../../../lib/i18n";
import { hasVoted, totalVotes, type PollPayload } from "../../../lib/polls";

interface MessagePollProps {
  poll: PollPayload;
  /** Votes for one option; absent when the bubble is read-only (channel post). */
  onVote?: (optionId: string) => void;
}

/**
 * Poll body inside a message bubble.
 *
 * Every option is one row: text, voter count and a share bar once somebody has
 * voted. The row is a real button, so the same control works with mouse,
 * keyboard and screen reader (`aria-pressed` carries the local vote).
 */
export const MessagePoll = ({ poll, onVote }: MessagePollProps) => {
  const { t } = useI18n();
  const total = totalVotes(poll);
  const closed = Boolean(poll.closed);

  return (
    <div className="mt-1 flex flex-col gap-1.5 min-w-[200px]">
      {poll.question && (
        <p className="text-sm font-semibold break-words text-[var(--text-primary)]">{poll.question}</p>
      )}
      {poll.options.map((option) => {
        const mine = hasVoted(poll, option.id);
        const share = total > 0 ? Math.round((option.voters.length / total) * 100) : 0;
        const interactive = Boolean(onVote) && !closed;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={mine}
            disabled={!interactive}
            onClick={() => onVote?.(option.id)}
            className={`relative w-full min-h-11 px-3 py-2 rounded-xl border text-left overflow-hidden transition-all ${
              mine
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--border-color)] bg-[var(--bg-tertiary)]"
            } ${interactive ? "cursor-pointer hover:border-[var(--accent)] active:scale-[0.99]" : "cursor-default"}`}
          >
            {total > 0 && (
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 bg-[var(--accent)]/15"
                style={{ width: `${share}%` }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <span className="flex-1 min-w-0 text-sm text-[var(--text-primary)] break-words">{option.text}</span>
              {mine && <Check size={14} className="shrink-0 text-[var(--accent)]" />}
              <span aria-live="polite" className="shrink-0 text-xs tabular-nums text-[var(--text-secondary)]">{option.voters.length}</span>
            </span>
          </button>
        );
      })}
      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <span>{t("chat.pollVotes", { count: total })}</span>
        {poll.multiple && <span>· {t("chat.pollMultiple")}</span>}
        {closed && <span>· {t("chat.pollClosed")}</span>}
      </div>
    </div>
  );
};

export type { PollPayload };
