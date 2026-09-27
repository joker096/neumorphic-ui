import { formatDate as formatDateValue } from '../../utils/dateTime';

export function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/** @param locale UI language (`useI18n().lang`); `undefined` = runtime default. */
export function formatDate(ts: number, locale?: string) {
  return formatDateValue(ts, locale);
}
