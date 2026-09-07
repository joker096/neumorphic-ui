/**
 * Constants for the Bots section.
 * Centralises shared bot styling and defaults. UI copy lives in the i18n
 * locales under the `bot.*` keys (see src/locales/*.json), so components stay
 * free of hardcoded strings, gradients and magic values.
 */

/** Fallback avatar gradient used when a bot profile does not provide avatarColor. */
export const BOT_AVATAR_FALLBACK_GRADIENT = "linear-gradient(135deg,#3b82f6,#06b6d4)";

/** Default owner id used when creating a bot locally. */
export const BOT_DEFAULT_OWNER_ID = "me";

/** Prefix used for locally generated bot identifiers. */
export const BOT_ID_PREFIX = "bot_";
