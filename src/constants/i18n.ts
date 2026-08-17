/**
 * Supported application languages.
 *
 * Centralises the language registry so the async i18n loader and any
 * synchronous fallbacks (e.g. the error boundary) stay in sync.
 */

export const SUPPORTED_LANGUAGES = ["en", "ru", "de", "es", "fr", "zh", "ja", "ko"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}
