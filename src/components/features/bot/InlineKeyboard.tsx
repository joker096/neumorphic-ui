import { useState, useEffect } from "react";
import { useServices } from "../../../services";
import { isServiceNotConfiguredError } from "../../../services/types";
import type { InlineKeyboardButton } from "../../../services/types";
import { BOT_LABELS } from "../../../constants/botConstants";

export interface InlineKeyboardProps {
  botId: string;
  messageId: string;
  isDark?: boolean;
  /** Прямые ряды кнопок (из сообщения). Если не заданы — догружаются через BotService. */
  rows?: InlineKeyboardButton[][];
}

export function InlineKeyboard({ botId, messageId, isDark, rows }: InlineKeyboardProps) {
  const { bot } = useServices();
  const [fetched, setFetched] = useState<InlineKeyboardButton[][] | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (rows) return;
    let alive = true;
    bot
      .getInlineKeyboard(botId, messageId)
      .then((r) => alive && setFetched(r))
      .catch(() => alive && setFetched(null));
    return () => {
      alive = false;
    };
  }, [rows, botId, messageId]);

  const data = rows ?? fetched;
  if (!rows && fetched === null) {
    return <div className="h-8" />;
  }
  if (!data || data.length === 0) {
    return null;
  }

  const handle = async (btn: { text: string; data?: string; url?: string }) => {
    if (btn.url) {
      window.open(btn.url, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      await bot.handleInlineButton(botId, messageId, btn);
      setFeedback(BOT_LABELS.inlineProcessed(btn.text));
    } catch (e) {
      if (isServiceNotConfiguredError(e)) {
        setFeedback(BOT_LABELS.inlineNotConfigured);
      } else {
        setFeedback(BOT_LABELS.inlineError);
      }
    }
  };

  return (
    <div className="flex flex-col gap-1.5 mt-2 w-full">
      {data.map((row, i) => (
        <div key={i} className="flex flex-wrap gap-1.5">
          {row.map((btn) => (
            <button
              key={btn.text}
              onClick={() => handle(btn)}
              className={`flex items-center justify-center min-h-11 px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--accent)]/40 text-[var(--accent)] ${
                isDark ? "bg-[var(--accent)]/10" : "bg-[var(--accent)]/5"
              }`}
            >
              {btn.text}
            </button>
          ))}
        </div>
      ))}
      {feedback && <div className="text-[11px] opacity-60 mt-0.5">{feedback}</div>}
    </div>
  );
}
