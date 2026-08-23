import { describe, it, expect } from 'vitest';
import { computeSafetyNumber, computeVerificationLevel, getVerificationColor } from './safetyNumber';

const KEY_A = 'A'.repeat(64);
const KEY_B = 'B'.repeat(64);
const KEY_C = 'C'.repeat(64);

describe('safetyNumber', () => {
  it('computes a deterministic 12-group number from two keys', async () => {
    const n1 = await computeSafetyNumber(KEY_A, KEY_B);
    const n2 = await computeSafetyNumber(KEY_A, KEY_B);
    expect(n1).toBe(n2);
    expect(n1.split(' ')).toHaveLength(12);
  });

  it('is symmetric regardless of argument order', async () => {
    const n1 = await computeSafetyNumber(KEY_A, KEY_B);
    const n2 = await computeSafetyNumber(KEY_B, KEY_A);
    expect(n1).toBe(n2);
  });

  it('produces different numbers for different keys', async () => {
    const n1 = await computeSafetyNumber(KEY_A, KEY_B);
    const n2 = await computeSafetyNumber(KEY_A, KEY_C);
    expect(n1).not.toBe(n2);
  });

  describe('computeVerificationLevel', () => {
    it('returns 0 for empty input', () => {
      expect(computeVerificationLevel('')).toBe(0);
    });
    it('caps the result at 100', () => {
      const big = '0'.repeat(64);
      expect(computeVerificationLevel(big)).toBeLessThanOrEqual(100);
    });
  });

  describe('getVerificationColor', () => {
    it('returns green for a high level', () => {
      expect(getVerificationColor(90)).toBe('#22c55e');
    });
    it('returns yellow for a medium level', () => {
      expect(getVerificationColor(60)).toBe('#eab308');
    });
    it('returns gray for a low level', () => {
      expect(getVerificationColor(10)).toBe('#94a3b8');
    });
  });
});
