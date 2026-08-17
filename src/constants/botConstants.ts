/**
 * Constants for the Bots section.
 * Centralises bot-related UI copy, fallback styling and shared defaults so that
 * bot components stay free of hardcoded strings, gradients and magic values.
 */

/** Fallback avatar gradient used when a bot profile does not provide avatarColor. */
export const BOT_AVATAR_FALLBACK_GRADIENT = "linear-gradient(135deg,#3b82f6,#06b6d4)";

/** Generate-button gradient classes for CreateBotModal (per theme). */
export const CREATE_BOT_BUTTON_GRADIENT = {
  dark: "bg-gradient-to-tr from-orange-500 to-orange-400 text-[var(--text-primary)] shadow-[0_0_20px_rgba(249,115,22,0.3)]",
  light: "bg-gradient-to-tr from-orange-400 to-orange-300 text-orange-950 shadow-lg",
} as const;

/** Static interface copy for bot-related views. */
export const BOT_LABELS = {
  profileTitle: "Профиль бота",
  back: "Назад",
  commandsHeading: "Команды",
  start: "Начать",
  openApp: "Открыть приложение",
  miniAppTitle: "Mini-app",
  notConfiguredProfileHint:
    "Профиль бота требует бэкенд-адаптера BotService.getBotProfile.",
  notConfiguredMiniAppHint:
    "Mini-app требует BotService.getMiniApp (url приложения + WebApp bridge).",
  profileLoadError: "Не удалось загрузить профиль",
  miniAppUnavailable: "Mini-app недоступен",
  miniAppEmptyTitle: "Нет приложения",
  miniAppEmptyDesc: "У этого бота нет mini-app.",
  inlineProcessed: (text: string) => `«${text}» — обработано`,
  inlineNotConfigured: "Интеграция бота не подключена",
  inlineError: "Ошибка обработки кнопки",
} as const;

/** Default owner id used when creating a bot locally. */
export const BOT_DEFAULT_OWNER_ID = "me";

/** Prefix used for locally generated bot identifiers. */
export const BOT_ID_PREFIX = "bot_";
