/**
 * Locale-aware date/time formatting.
 *
 * House rule: dates are rendered through ONE cached `Intl.DateTimeFormat` per
 * `locale | preset` pair. The construction is the expensive part, and the
 * call sites here are list rows (CRM task due dates, wallet transactions,
 * recordings, website contacts) that re-render on every store write.
 *
 * Why not `Date.prototype.toLocale*String()` directly: without an explicit
 * locale those calls follow the HOST runtime, not the language the user picked
 * in Settings. A German UI on an en-US machine printed `5/12/2026`.
 *
 * Fail-soft guarantee, because every input is untrusted (sender-asserted
 * message timestamps, imported CRM records, restored backups, IDB rows written
 * by an older build): an unparseable value yields `''` rather than `Invalid
 * Date` — the caller renders a chip, not a crash.
 */
export type DateInput = string | number | Date | null | undefined;

export type DatePreset = 'date' | 'longDate' | 'dateTime' | 'time' | 'dayMonthLong' | 'dayMonthShort';

const PRESETS: Record<DatePreset, Intl.DateTimeFormatOptions> = {
  /** 12 May 2026 — task due dates, wallet transactions, recordings. */
  date: { day: 'numeric', month: 'short', year: 'numeric' },
  /** 12 May 2026 with a spelled-out month — group "Created" row. */
  longDate: { day: 'numeric', month: 'long', year: 'numeric' },
  /** 12 May 2026, 14:07 — last-backup stamp. */
  dateTime: { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  /** 14:07 — call-log rows. */
  time: { hour: '2-digit', minute: '2-digit' },
  /** 12 May, spelled-out month, year omitted — chat day separator within one year. */
  dayMonthLong: { day: 'numeric', month: 'long' },
  /** 12 May, abbreviated month, year omitted — bubble date stamp. */
  dayMonthShort: { day: 'numeric', month: 'short' },
};

const FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string | undefined, preset: DatePreset): Intl.DateTimeFormat {
  const key = `${locale ?? ''}|${preset}`;
  let fmt = FORMATTER_CACHE.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.DateTimeFormat(locale, PRESETS[preset]);
    } catch {
      // Unusable locale tag (hand-edited localStorage): fall back to the
      // runtime default rather than throwing inside a render.
      fmt = new Intl.DateTimeFormat(undefined, PRESETS[preset]);
    }
    FORMATTER_CACHE.set(key, fmt);
  }
  return fmt;
}

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * @param value   Epoch ms, ISO string or `Date`; unparseable input yields `''`.
 * @param locale  UI language (`useI18n().lang`); `undefined` = runtime default.
 * @param preset  Shape to render (see {@link DatePreset}).
 */
export function formatDateTimeValue(value: DateInput, locale?: string, preset: DatePreset = 'date'): string {
  const d = toDate(value);
  if (!d) return '';
  try {
    return formatter(locale, preset).format(d);
  } catch {
    return '';
  }
}

/** Short numeric date, e.g. `12 May 2026`. */
export function formatDate(value: DateInput, locale?: string): string {
  return formatDateTimeValue(value, locale, 'date');
}

/** Spelled-out month, e.g. `12 May 2026` with a long month name. */
export function formatLongDate(value: DateInput, locale?: string): string {
  return formatDateTimeValue(value, locale, 'longDate');
}

/** Date + time, e.g. `12 May 2026, 14:07`. */
export function formatDateTime(value: DateInput, locale?: string): string {
  return formatDateTimeValue(value, locale, 'dateTime');
}

/** Time only, e.g. `14:07`. */
export function formatTime(value: DateInput, locale?: string): string {
  return formatDateTimeValue(value, locale, 'time');
}

/**
 * Day + month WITHOUT a year, e.g. `12 May` / `12 мая`.
 *
 * The chat day separator and the bubble date stamp only add the year when the
 * message is not from the current year, so the no-year shape has to be
 * renderable on its own.
 */
export function formatDayMonth(value: DateInput, locale?: string, long = false): string {
  return formatDateTimeValue(value, locale, long ? 'dayMonthLong' : 'dayMonthShort');
}

/** Test-only: drops the memoized formatters so a suite can assert construction counts. */
export function resetDateTimeFormatterCache(): void {
  FORMATTER_CACHE.clear();
}
