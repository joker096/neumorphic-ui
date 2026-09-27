import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatDate,
  formatLongDate,
  formatDateTime,
  formatTime,
  resetDateTimeFormatterCache,
} from './dateTime';

const TS = Date.UTC(2026, 7, 12, 14, 7, 30);

describe('dateTime formatters', () => {
  beforeEach(() => resetDateTimeFormatterCache());

  it('matches the plain Intl call it replaces', () => {
    const d = new Date(TS);
    expect(formatDate(TS, 'en-US')).toBe(
      new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(d),
    );
    expect(formatLongDate(TS, 'en-US')).toBe(
      new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(d),
    );
    expect(formatDateTime(TS, 'en-US')).toBe(
      new Intl.DateTimeFormat('en-US', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }).format(d),
    );
    expect(formatTime(TS, 'en-US')).toBe(
      new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(d),
    );
  });

  it('follows the UI locale instead of the host runtime', () => {
    // The bug being fixed: `date.toLocaleDateString()` ignored the language
    // chosen in Settings, so a German UI on an en-US machine printed `8/12/2026`.
    expect(formatDate(TS, 'de-DE')).not.toBe(formatDate(TS, 'en-US'));
    expect(formatDate(TS, 'de-DE')).toContain('2026');
    expect(formatLongDate(TS, 'ru-RU')).toContain('августа');
  });

  it('accepts ISO strings, epoch ms and Date instances alike', () => {
    const iso = new Date(TS).toISOString();
    expect(formatDate(iso, 'en-US')).toBe(formatDate(TS, 'en-US'));
    expect(formatDate(new Date(TS), 'en-US')).toBe(formatDate(TS, 'en-US'));
  });

  it('renders nothing instead of "Invalid Date" for unparseable input', () => {
    expect(formatDate('not-a-date', 'en-US')).toBe('');
    expect(formatDate('', 'en-US')).toBe('');
    expect(formatDate(null, 'en-US')).toBe('');
    expect(formatDate(undefined, 'en-US')).toBe('');
    expect(formatDate(Number.NaN, 'en-US')).toBe('');
    expect(formatTime(new Date(Number.NaN), 'en-US')).toBe('');
  });

  it('falls back to the runtime locale on a hand-edited locale tag', () => {
    expect(() => formatDate(TS, 'not a locale!!')).not.toThrow();
    expect(formatDate(TS, 'not a locale!!')).not.toBe('');
  });

  it('reuses one formatter per locale/preset pair', () => {
    const Original = Intl.DateTimeFormat;
    let built = 0;
    // Constructor wrapper (not `vi.spyOn`, which strips the prototype under `new`).
    (Intl as unknown as { DateTimeFormat: unknown }).DateTimeFormat = function patched(
      locales?: unknown,
      opts?: unknown,
    ) {
      built++;
      return new Original(locales as string | undefined, opts as Intl.DateTimeFormatOptions);
    } as unknown as typeof Intl.DateTimeFormat;

    try {
      for (let i = 0; i < 4; i++) formatDate(TS, 'en-US');
      expect(built).toBe(1);
      formatLongDate(TS, 'en-US');
      expect(built).toBe(2);
      formatDate(TS, 'de-DE');
      expect(built).toBe(3);
    } finally {
      (Intl as unknown as { DateTimeFormat: unknown }).DateTimeFormat = Original;
    }
  });
});
