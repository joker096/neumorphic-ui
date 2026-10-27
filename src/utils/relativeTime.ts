/**
 * Localized "how long ago" label (`now`, `5 min`, `3 h`, `2 d`).
 *
 * One implementation because both the notification panel and the story viewer
 * show the same Telegram-style stamp, and the `notif.rel*` keys already carry
 * translations in all eight locales.
 *
 * Fail-soft: an unparseable timestamp yields `''` rather than `Invalid Date`
 * (story timestamps arrive from a data layer that may serve stale rows).
 */
export type RelativeTranslate = (key: string, options?: unknown) => string;

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(
  timestamp: string | number | Date | null | undefined,
  t: RelativeTranslate,
): string {
  if (timestamp === null || timestamp === undefined || timestamp === '') return '';
  const ts = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
  if (!Number.isFinite(ts)) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < MINUTE) return t('notif.relNow', 'now');
  if (seconds < HOUR) return t('notif.relMin', { n: Math.floor(seconds / MINUTE) });
  if (seconds < DAY) return t('notif.relHour', { n: Math.floor(seconds / HOUR) });
  return t('notif.relDay', { n: Math.floor(seconds / DAY) });
}
