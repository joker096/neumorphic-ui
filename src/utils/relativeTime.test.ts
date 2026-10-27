import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatRelativeTime } from './relativeTime';

const t = (key: string, options?: unknown): string => {
  const opts = (options ?? {}) as Record<string, unknown>;
  if (key === 'notif.relNow') return 'now';
  if (key === 'notif.relMin') return `${opts.n}m`;
  if (key === 'notif.relHour') return `${opts.n}h`;
  if (key === 'notif.relDay') return `${opts.n}d`;
  return key;
};

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders now / minutes / hours / days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-26T12:00:00Z'));
    expect(formatRelativeTime(new Date('2026-10-26T11:59:30Z'), t)).toBe('now');
    expect(formatRelativeTime(new Date('2026-10-26T11:55:00Z'), t)).toBe('5m');
    expect(formatRelativeTime(new Date('2026-10-26T09:00:00Z'), t)).toBe('3h');
    expect(formatRelativeTime(new Date('2026-10-24T12:00:00Z'), t)).toBe('2d');
  });

  it('accepts ISO strings and epoch millis', () => {
    vi.useFakeTimers();
    const now = new Date('2026-10-26T12:00:00Z');
    vi.setSystemTime(now);
    expect(formatRelativeTime('2026-10-26T10:00:00Z', t)).toBe('2h');
    expect(formatRelativeTime(now.getTime() - 90_000, t)).toBe('1m');
  });

  it('never renders a negative age (clock skew)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-26T12:00:00Z'));
    expect(formatRelativeTime(new Date('2026-10-26T12:05:00Z'), t)).toBe('now');
  });

  it('fails soft on unusable input', () => {
    expect(formatRelativeTime(null, t)).toBe('');
    expect(formatRelativeTime(undefined, t)).toBe('');
    expect(formatRelativeTime('not-a-date', t)).toBe('');
  });
});
