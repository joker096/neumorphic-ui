import type { BotCommand } from "../../../services/types";
import { BOT_LABELS } from "../../../constants/botConstants";

export interface BotCommandListProps {
  commands: BotCommand[];
  isDark?: boolean;
}

/** Renders the command list of a bot profile. No-op when empty. */
export function BotCommandList({ commands, isDark }: BotCommandListProps) {
  if (!commands || commands.length === 0) return null;

  return (
    <div className="w-full max-w-md mt-2">
      <div className="text-xs font-bold uppercase tracking-widest mb-2 opacity-60">
        {BOT_LABELS.commandsHeading}
      </div>
      <div className="flex flex-col gap-1">
        {commands.map((c) => (
          <div
            key={c.command}
            className={`flex items-baseline gap-2 px-3 py-2 rounded-lg ${
              isDark ? "bg-[var(--bg-tertiary)]" : "bg-white border border-[var(--border-color)]"
            }`}
          >
            <code className="text-[var(--accent)] text-sm font-semibold">/{c.command}</code>
            <span className="text-xs opacity-70">{c.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
