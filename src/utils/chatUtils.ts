import { formatDayMonth, formatLongDate, formatTime } from './dateTime'

export type GroupPosition = 'single' | 'first' | 'middle' | 'last'

/**
 * `HH:MM` for a bubble stamp, from the shared cached `Intl.DateTimeFormat`
 * family in `utils/dateTime.ts`.
 *
 * Every send/receive path stamps a bubble with this string, so the literal
 * `{ hour: '2-digit', minute: '2-digit' }` used to be copy-pasted into 19 call
 * sites, each building its own formatter object on every message; the local
 * copy of that formatter was pinned to the HOST runtime, so a 24-hour UI could
 * show `02:05 PM` next to a call-log row reading `14:05`.
 *
 * @param locale  UI language (`useI18n().lang`); `undefined` = runtime default,
 *                which is what the message-stamping paths keep using — the
 *                value is persisted on the message, not rendered live.
 * @returns Empty string for a sender-asserted junk timestamp: `Intl.format`
 *          throws a `RangeError` where `toLocaleTimeString` used to print
 *          "Invalid Date" into the bubble.
 */
export function formatClockTime(timestamp: number | Date, locale?: string): string {
  return formatTime(timestamp, locale)
}

export function groupMessages(history: any[]): { messages: any[]; groupPositions: GroupPosition[] }[] {
  const groups: { messages: any[]; groupPositions: GroupPosition[] }[] = []
  for (const msg of history) {
    const lastGroup = groups[groups.length - 1]
    const lastMsg = lastGroup?.messages?.at(-1)
    if (lastMsg && lastMsg.sender === msg.sender) {
      lastGroup.messages.push(msg)
    } else {
      groups.push({ messages: [msg], groupPositions: [] })
    }
  }
  for (const group of groups) {
    if (group.messages.length === 1) {
      group.groupPositions = ['single']
    } else {
      group.groupPositions = group.messages.map((_, i) => {
        if (i === 0) return 'first'
        if (i === group.messages.length - 1) return 'last'
        return 'middle'
      })
    }
  }
  return groups
}

export function dayDiffFromNow(ts: number): number {
  const now = new Date()
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  return Math.round((startOfDay(now) - startOfDay(new Date(ts))) / (1000 * 60 * 60 * 24))
}

/**
 * Localization inputs for the chat day labels.
 *
 * The relative words are injected rather than looked up here so this module
 * stays free of the i18n context (call sites pass `t('chat.today', …)` /
 * `t('chat.yesterday', …)`); the English defaults preserve the previous output
 * for any caller without a translator. `lang` is the UI language — the helper
 * used to call `toLocaleDateString(undefined, …)`, which follows the HOST
 * runtime, so a German UI on an en-US machine printed `May 12, 2026`.
 */
export interface DayLabelOptions {
  /** UI language (`useI18n().lang`); `undefined` = runtime default. */
  lang?: string;
  today?: string;
  yesterday?: string;
}

const DEFAULT_TODAY = 'Today';
const DEFAULT_YESTERDAY = 'Yesterday';

/** `Today` / `Yesterday` for the two relative days, `null` for older dates. */
function relativeDayLabel(opts: DayLabelOptions | undefined, diffDays: number): string | null {
  if (diffDays === 0) return opts?.today ?? DEFAULT_TODAY;
  if (diffDays === 1) return opts?.yesterday ?? DEFAULT_YESTERDAY;
  return null;
}

/** Spelled-out month, adding the year only when the date is not from this one. */
function longDayDate(d: Date, lang?: string): string {
  return d.getFullYear() === new Date().getFullYear()
    ? formatDayMonth(d, lang, true)
    : formatLongDate(d, lang);
}

export function formatDateLabel(timeStr: string, ts?: number, opts?: DayLabelOptions): string {
  if (typeof ts === 'number') {
    const relative = relativeDayLabel(opts, dayDiffFromNow(ts));
    if (relative) return relative;
    return longDayDate(new Date(ts), opts?.lang);
  }
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return timeStr;
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(match[1]), parseInt(match[2]));
  const relative = relativeDayLabel(opts, Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
  if (relative) return relative;
  return longDayDate(d, opts?.lang);
}

export function formatShortDate(ts: number, opts?: DayLabelOptions): string {
  const diffDays = dayDiffFromNow(ts);
  // The bubble already prints the clock time, so today's messages carry no
  // date stamp at all.
  if (diffDays === 0) return '';
  return relativeDayLabel(opts, diffDays) ?? formatDayMonth(ts, opts?.lang);
}

export function fuzzTime(timeStr: string, id: number): string {
  const match = timeStr.match(/(\d{1,2}):(\d{2})/)
  if (!match) return timeStr
  let h = parseInt(match[1])
  let m = parseInt(match[2])
  const offset = (id % 11) - 5
  m += offset
  if (m < 0) {
    m += 60
    h = (h - 1 + 24) % 24
  } else if (m >= 60) {
    m -= 60
    h = (h + 1) % 24
  }
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

export function getBubbleCornerClass(gp: GroupPosition, isMe: boolean): string {
  if (isMe) {
    if (gp === 'single') return 'rounded-xl rounded-br-sm'
    if (gp === 'first') return 'rounded-t-xl rounded-bl-xl rounded-br-xl rounded-bl-sm'
    if (gp === 'middle') return 'rounded-l-xl rounded-r-xl rounded-br-xl rounded-bl-xl'
    if (gp === 'last') return 'rounded-tl-xl rounded-tr-xl rounded-br-sm rounded-bl-xl'
    return 'rounded-xl rounded-br-sm'
  } else {
    if (gp === 'single') return 'rounded-xl rounded-bl-sm'
    if (gp === 'first') return 'rounded-t-xl rounded-br-xl rounded-br-sm rounded-bl-xl'
    if (gp === 'middle') return 'rounded-r-xl rounded-l-xl rounded-bl-xl rounded-br-xl'
    if (gp === 'last') return 'rounded-tr-xl rounded-tl-xl rounded-bl-sm rounded-br-xl'
    return 'rounded-xl rounded-bl-sm'
  }
}
