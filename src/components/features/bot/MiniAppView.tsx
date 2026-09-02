import { ChevronLeft, Terminal } from "lucide-react";
import { useServices, useServiceData, NotConfiguredState } from "../../../services";
import { DataState } from "../../ui/DataState";
import { useI18n } from "../../../lib/i18n";

export interface MiniAppProps {
  botId: string;
  isDark?: boolean;
  onClose?: () => void;
}

export function MiniApp({ botId, isDark, onClose }: MiniAppProps) {
  const { bot } = useServices();
  const { t } = useI18n();
  const state = useServiceData(() => bot.getMiniApp(botId), [botId]);

  if (state.status === "loading") {
    return <DataState status="loading" isDark={isDark} />;
  }
  if (state.status === "notConfigured") {
    return (
      <div className="flex-1 flex flex-col">
        {onClose && (
          <div className="flex items-center gap-3 p-4 border-b border-[var(--border-color)]">
            <button
              onClick={onClose}
              aria-label={t("bot.back", "Back")}
              className="flex items-center justify-center min-w-11 min-h-11 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-bold">{t("bot.miniAppTitle", "Mini-app")}</h2>
          </div>
        )}
        <NotConfiguredState
          isDark={isDark}
          feature="bot"
          hint={t("bot.notConfiguredMiniAppHint", "Mini-app requires BotService.getMiniApp (app url + WebApp bridge).")}
        />
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <DataState
        status="error"
        isDark={isDark}
        title={t("bot.miniAppUnavailable", "Mini-app unavailable")}
        description={state.error}
        retryAction={() => undefined}
      />
    );
  }

  const app = state.data;
  if (!app) {
    return (
      <DataState
        status="empty"
        isDark={isDark}
        title={t("bot.miniAppEmptyTitle", "No app")}
        description={t("bot.miniAppEmptyDesc", "This bot has no mini-app.")}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-3 p-3 border-b border-[var(--border-color)]">
        <button
          onClick={onClose}
          aria-label={t("bot.back", "Back")}
          className="flex items-center justify-center min-w-11 min-h-11 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ChevronLeft size={20} />
        </button>
        <Terminal size={18} className="text-[var(--accent)]" />
        <h2 className="font-bold">{app.name}</h2>
      </div>
      <iframe
        title={app.name}
        src={app.url}
        sandbox="allow-scripts allow-forms allow-same-origin"
        className="flex-1 w-full border-0"
      />
    </div>
  );
}
