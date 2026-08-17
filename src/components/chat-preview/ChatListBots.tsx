import { Bot } from "lucide-react";
import { DataState } from "../ui/DataState";

interface ChatListBotsProps {
  bots: any[];
  onOpenBot?: (botId: string) => void;
  isDark: boolean;
  t: (key: string, options?: any) => string;
}

export function ChatListBots({ bots, onOpenBot, isDark, t }: ChatListBotsProps) {
  if (bots.length === 0) {
    return (
      <DataState
        status="empty"
        isDark={isDark}
        title={t("chat.noBots")}
        description={t("chat.noBotsHint", "Создайте бота для автоматизации")}
      />
    );
  }

  return (
    <>
      <div className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 shrink-0 ${isDark ? "text-[var(--cyan)]" : "text-blue-600"}`}>
        {t("chat.sectionBots")}
      </div>
      {bots.map(b => (
        <div
          key={b.id}
          role="button"
          tabIndex={0}
          onClick={() => onOpenBot?.(b.id)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpenBot?.(b.id); }}
          className={`w-full p-4 rounded-xl mb-4 flex flex-col gap-2 cursor-pointer transition-colors ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--bg-elevated)]" : "bg-white border border-[var(--border-color)] shadow-sm hover:bg-slate-50"}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <Bot size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm tracking-wide">{b.name}</h4>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('chat.botTokenMask')}</p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
