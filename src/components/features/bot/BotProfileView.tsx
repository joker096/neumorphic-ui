import { Bot, ExternalLink, ChevronLeft } from "lucide-react";
import { useServices, useServiceData, NotConfiguredState } from "../../../services";
import { DataState } from "../../ui/DataState";
import { BotCommandList } from "./BotCommandList";
import { BOT_LABELS, BOT_AVATAR_FALLBACK_GRADIENT } from "../../../constants/botConstants";

export interface BotProfileViewProps {
  botId: string;
  isDark?: boolean;
  onBack?: () => void;
  onOpenMiniApp?: (botId: string) => void;
}

export function BotProfileView({ botId, isDark, onBack, onOpenMiniApp }: BotProfileViewProps) {
  const { bot } = useServices();
  const state = useServiceData(() => bot.getBotProfile(botId), [botId]);

  if (state.status === "loading") {
    return <DataState status="loading" isDark={isDark} />;
  }
  if (state.status === "notConfigured") {
    return (
      <NotConfiguredState
        isDark={isDark}
        feature="bot"
        hint={BOT_LABELS.notConfiguredProfileHint}
      />
    );
  }
  if (state.status === "error") {
    return (
      <DataState
        status="error"
        isDark={isDark}
        title={BOT_LABELS.profileLoadError}
        description={state.error}
        retryAction={() => undefined}
      />
    );
  }

  const profile = state.data;
  const verifiedMark = profile.verified ? (
    <span className="text-[var(--accent)] text-sm">✓</span>
  ) : null;

  return (
    <div className={`flex-1 flex flex-col h-full min-h-0 ${isDark ? "text-gray-100" : "text-slate-800"}`}>
      <div className="flex items-center gap-3 p-4 border-b border-[var(--border-color)]">
        <button
          onClick={onBack}
          aria-label={BOT_LABELS.back}
          className="flex items-center justify-center min-w-11 min-h-11 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-bold text-lg">{BOT_LABELS.profileTitle}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center gap-4">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-white shadow-lg"
          style={{ background: profile.avatarColor ?? BOT_AVATAR_FALLBACK_GRADIENT }}
        >
          <Bot size={44} />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold flex items-center justify-center gap-1">
            {profile.name}
            {verifiedMark}
          </h3>
          {profile.username && (
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>
              @{profile.username}
            </p>
          )}
        </div>
        {profile.description && (
          <p className={`text-center max-w-md text-sm ${isDark ? "text-gray-300" : "text-slate-600"}`}>
            {profile.description}
          </p>
        )}

        <BotCommandList commands={profile.commands} isDark={isDark} />

        <div className="flex gap-3 mt-4">
          <button className="flex items-center justify-center min-h-11 px-5 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm">
            {BOT_LABELS.start}
          </button>
          {profile.canOpenMiniApp && (
            <button
              onClick={() => onOpenMiniApp?.(botId)}
              className={`flex items-center justify-center gap-2 min-h-11 px-5 rounded-xl font-semibold text-sm border border-[var(--border-color)] ${
                isDark ? "bg-[var(--bg-tertiary)]" : "bg-white"
              }`}
            >
              <ExternalLink size={16} /> {BOT_LABELS.openApp}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
