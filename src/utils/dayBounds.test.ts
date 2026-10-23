import { describe, it, expect } from 'vitest';
import { dayBounds } from './chatUtils';

describe('dayBounds', () => {
  it('is a half-open local-day range', () => {
    const b = dayBounds('2024-05-10')!;
    expect(b.start).toBe(new Date(2024, 4, 10).getTime());
    expect(b.end).toBe(new Date(2024, 4, 11).getTime());
    expect(new Date(2024, 4, 10, 23, 59, 59).getTime()).toBeLessThan(b.end);
  });

  it('rolls over the year boundary', () => {
    expect(dayBounds('2024-12-31')!.end).toBe(new Date(2025, 0, 1).getTime());
  });

  it('returns null for anything that is not YYYY-MM-DD', () => {
    expect(dayBounds('')).toBeNull();
    expect(dayBounds('10.05.2024')).toBeNull();
  });
});
