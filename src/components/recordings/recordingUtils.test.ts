import { describe, it, expect } from 'vitest';
import { formatDuration, formatDate } from './recordingUtils';

describe('formatDuration', () => {
  it('formats zero as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('pads seconds under a minute', () => {
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(59)).toBe('0:59');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(61)).toBe('1:01');
  });

  it('formats long durations', () => {
    expect(formatDuration(3661)).toBe('61:01');
  });
});

describe('formatDate', () => {
  it('returns a locale date string containing the year', () => {
    const out = formatDate(Date.parse('2026-01-05T00:00:00Z'));
    expect(typeof out).toBe('string');
    expect(out).toMatch(/2026/);
  });
});
