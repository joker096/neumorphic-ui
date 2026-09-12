import { describe, it, expect, beforeEach } from 'vitest';
import { generateSecret, totpCode, verifyTotp, otpauthUri } from './twoFactor';

const RFC_VECTOR_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

beforeEach(() => {
  localStorage.clear();
});

describe('twoFactor', () => {
  it('generates a 32-char base32 secret', () => {
    const secret = generateSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(generateSecret()).not.toBe(secret);
  });

  it('reproduces the RFC 6238 SHA1 vector for counter 1', async () => {
    expect(await totpCode(RFC_VECTOR_SECRET, 59000)).toBe('287082');
  });

  it('round-trips code generation and verification', async () => {
    const secret = generateSecret();
    const code = await totpCode(secret, 1_000_000);
    expect(code).toMatch(/^\d{6}$/);
    expect(await verifyTotp(secret, code, 1_000_000)).toBe(true);
  });

  it('accepts ±1 step drift', async () => {
    const secret = generateSecret();
    const t0 = 500_000;
    const sameStep = await totpCode(secret, t0);
    expect(await verifyTotp(secret, sameStep, t0 + 29_999)).toBe(true);
    const nextStep = await totpCode(secret, t0 + 30_000);
    expect(await verifyTotp(secret, nextStep, t0)).toBe(true);
  });

  it('rejects wrong, short, and garbage codes', async () => {
    const secret = generateSecret();
    const code = await totpCode(secret, 123_456);
    expect(await verifyTotp(secret, '000000', 123_456)).toBe(false);
    if (code !== '999999') {
      expect(await verifyTotp(secret, '999999', 123_456)).toBe(false);
    }
    expect(await verifyTotp(secret, 'abc', 1)).toBe(false);
    expect(await verifyTotp(secret, '', 1)).toBe(false);
    expect(await verifyTotp(secret, '1234567', 1)).toBe(false);
  });

  it('builds an otpauth URI with encoded account and issuer', () => {
    const uri = otpauthUri('ABC234567890', 'alice');
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('secret=ABC234567890');
    expect(uri).toContain('issuer=Mess%26Anger');
    expect(uri).toContain('&digits=6&period=30');
  });
});