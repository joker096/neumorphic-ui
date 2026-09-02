import { useState, useEffect } from "react";
import { useServices } from "../../../services";
import { isServiceNotConfiguredError } from "../../../services/types";
import type { InlineKeyboardButton } from "../../../services/types";
import { useI18n } from "../../../lib/i18n";

export interface InlineKeyboardProps {
  botId: string;
  messageId: string;
  isDark?: boolean;
  /** Прямые ряды кнопок (из сообщения). Если не заданы — догружаются через BotService. */
  rows?: InlineKeyboardButton[][];
}

export function InlineKeyboard({ botId, messageId, isDark, rows }: InlineKeyboardProps) {
  const { bot } = useServices();
  const { t } = useI18n();
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
      try {
        const parsed = new URL(btn.url)
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          window.open(btn.url, "_blank", "noopener,noreferrer");
        }
      } catch {
        // ignore malformed / non-http(s) URLs
      }
      return;
    }
    try {
      await bot.handleInlineButton(botId, messageId, btn);
      setFeedback(t("bot.inlineProcessed", { text: btn.text }));
    } catch (e) {
      if (isServiceNotConfiguredError(e)) {
        setFeedback(t("bot.inlineNotConfigured", "Bot integration not connected"));
      } else {
        setFeedback(t("bot.inlineError", "Button processing error"));
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
      {feedback && <div className="text-xs opacity-60 mt-0.5">{feedback}</div>}
    </div>
  );
}
