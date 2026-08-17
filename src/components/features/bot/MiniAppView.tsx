import { ChevronLeft, Terminal } from "lucide-react";
import { useServices, useServiceData, NotConfiguredState } from "../../../services";
import { DataState } from "../../ui/DataState";
import { BOT_LABELS } from "../../../constants/botConstants";

export interface MiniAppProps {
  botId: string;
  isDark?: boolean;
  onClose?: () => void;
}

export function MiniApp({ botId, isDark, onClose }: MiniAppProps) {
  const { bot } = useServices();
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
              aria-label={BOT_LABELS.back}
              className="flex items-center justify-center min-w-11 min-h-11 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-bold">{BOT_LABELS.miniAppTitle}</h2>
          </div>
        )}
        <NotConfiguredState
          isDark={isDark}
          feature="bot"
          hint={BOT_LABELS.notConfiguredMiniAppHint}
        />
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <DataState
        status="error"
        isDark={isDark}
        title={BOT_LABELS.miniAppUnavailable}
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
        title={BOT_LABELS.miniAppEmptyTitle}
        description={BOT_LABELS.miniAppEmptyDesc}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-3 p-3 border-b border-[var(--border-color)]">
        <button
          onClick={onClose}
          aria-label={BOT_LABELS.back}
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
