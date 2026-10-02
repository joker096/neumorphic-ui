import { MINUTE_MS, HOUR_MS, DAY_MS, ACTIVE_NOW_THRESHOLD_MS } from '../../constants/time';
import { CONTACT_MAX_DAYS } from '../../constants/contactConstants';

type Translate = (key: string, options?: any) => string;

/** Presence line: active now, then minutes, hours, days, years. Returns "—" for junk/absent timestamps. */
export function formatLastSeen(t: Translate, online?: boolean, lastSeen?: number): string {
  if (online) return t('contacts.activeNow');
  if (!lastSeen) return '—';
  const delta = Date.now() - lastSeen;
  if (delta < 0 || isNaN(delta)) return '—';
  if (delta < ACTIVE_NOW_THRESHOLD_MS) return t('contacts.activeNow');
  if (delta < HOUR_MS) return t('chat.minutesAgo', { count: Math.floor(delta / MINUTE_MS) });
  if (delta < DAY_MS) return t('chat.hoursAgo', { count: Math.floor(delta / HOUR_MS) });
  const days = Math.floor(delta / DAY_MS);
  if (days > CONTACT_MAX_DAYS) return t('chat.yearsAgo', { count: Math.floor(days / 365) });
  return t('chat.daysAgo', { count: days });
}
