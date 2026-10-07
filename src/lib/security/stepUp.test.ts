import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  canSatisfyStepUp,
  stepUpDelayMs,
  stepUpMethods,
  verifyStepUpPin,
  verifyStepUpTotp,
  STEP_UP_ATTEMPT_DELAYS_MS,
  type StepUpCredentialState,
} from './stepUp';

const cryptoMock = vi.hoisted(() => ({
  verifyAppLockPIN: vi.fn(async () => true),
}));

const totpMock = vi.hoisted(() => ({
  verifyTotp: vi.fn(async () => true),
}));

vi.mock('../crypto/cryptoCore', () => ({ cryptoCore: cryptoMock }));
vi.mock('../twoFactor', () => totpMock);

const base: StepUpCredentialState = {
  pinHash: 'hash',
  pinSalt: 'salt',
  biometricEnabled: false,
  biometricCredentialId: null,
  twoFactor: false,
  totpSecret: null,
};

beforeEach(() => {
  cryptoMock.verifyAppLockPIN.mockClear();
  cryptoMock.verifyAppLockPIN.mockResolvedValue(true);
  totpMock.verifyTotp.mockClear();
  totpMock.verifyTotp.mockResolvedValue(true);
});

describe('stepUpMethods', () => {
  it('requires both hash and salt before a PIN counts as available', () => {
    expect(stepUpMethods(base, 'pin').pin).toBe(true);
    expect(stepUpMethods({ ...base, pinSalt: null }, 'pin').pin).toBe(false);
    expect(stepUpMethods({ ...base, pinHash: null }, 'pin').pin).toBe(false);
  });

  it('reports biometrics only when enabled with a credential id', () => {
    expect(stepUpMethods(base, 'biometric').biometric).toBe(false);
    expect(
      stepUpMethods({ ...base, biometricEnabled: true, biometricCredentialId: null }, 'biometric').biometric,
    ).toBe(false);
    expect(
      stepUpMethods({ ...base, biometricEnabled: true, biometricCredentialId: 'cred' }, 'biometric').biometric,
    ).toBe(true);
  });

  it('demands TOTP only for the strong level with an active secret', () => {
    const twoFactorState = { ...base, twoFactor: true, totpSecret: 'SECRET' };
    expect(stepUpMethods(twoFactorState, 'strong').totp).toBe(true);
    expect(stepUpMethods(twoFactorState, 'pin').totp).toBe(false);
    expect(stepUpMethods(twoFactorState, 'biometric').totp).toBe(false);
    expect(stepUpMethods({ ...base, twoFactor: false, totpSecret: null }, 'strong').totp).toBe(false);
  });
});

describe('canSatisfyStepUp', () => {
  it('fails closed without any configured method', () => {
    const none: StepUpCredentialState = {
      pinHash: null,
      pinSalt: null,
      biometricEnabled: false,
      biometricCredentialId: null,
      twoFactor: false,
      totpSecret: null,
    };
    expect(canSatisfyStepUp(none, 'pin')).toBe(false);
    expect(canSatisfyStepUp(none, 'strong')).toBe(false);
    expect(canSatisfyStepUp(none, 'biometric')).toBe(false);
  });

  it('accepts a PIN for pin and strong levels', () => {
    expect(canSatisfyStepUp(base, 'pin')).toBe(true);
    expect(canSatisfyStepUp(base, 'strong')).toBe(true);
  });

  it('accepts biometrics alone only for the biometric level', () => {
    const bioOnly: StepUpCredentialState = {
      ...base,
      pinHash: null,
      pinSalt: null,
      biometricEnabled: true,
      biometricCredentialId: 'cred',
    };
    expect(canSatisfyStepUp(bioOnly, 'biometric')).toBe(true);
    // Removing the second factor or the PIN itself must never be unlockable by
    // a fingerprint alone.
    expect(canSatisfyStepUp(bioOnly, 'pin')).toBe(false);
    expect(canSatisfyStepUp(bioOnly, 'strong')).toBe(false);
  });
});

describe('verifyStepUpPin', () => {
  it('rejects an empty PIN or missing hash without hashing', async () => {
    await expect(verifyStepUpPin('', base)).resolves.toBe(false);
    await expect(verifyStepUpPin('1234', { ...base, pinHash: null })).resolves.toBe(false);
    await expect(verifyStepUpPin('1234', { ...base, pinSalt: '' })).resolves.toBe(false);
    expect(cryptoMock.verifyAppLockPIN).not.toHaveBeenCalled();
  });

  it('delegates to the stored hash and salt', async () => {
    cryptoMock.verifyAppLockPIN.mockResolvedValueOnce(false);
    await expect(verifyStepUpPin('1234', base)).resolves.toBe(false);
    expect(cryptoMock.verifyAppLockPIN).toHaveBeenCalledWith('1234', 'salt', 'hash');
  });
});

describe('verifyStepUpTotp', () => {
  it('rejects an empty code or secret without verifying', async () => {
    await expect(verifyStepUpTotp('', 'SECRET')).resolves.toBe(false);
    await expect(verifyStepUpTotp('123456', '')).resolves.toBe(false);
    expect(totpMock.verifyTotp).not.toHaveBeenCalled();
  });

  it('delegates to the TOTP verifier', async () => {
    totpMock.verifyTotp.mockResolvedValueOnce(false);
    await expect(verifyStepUpTotp('123456', 'SECRET')).resolves.toBe(false);
    expect(totpMock.verifyTotp).toHaveBeenCalledWith('SECRET', '123456');
  });
});

describe('stepUpDelayMs', () => {
  it('returns no delay for the first attempts', () => {
    expect(stepUpDelayMs(0)).toBe(0);
    expect(stepUpDelayMs(1)).toBe(0);
    expect(stepUpDelayMs(2)).toBe(0);
    expect(stepUpDelayMs(3)).toBe(0);
  });

  it('grows the delay and clamps at the last rung', () => {
    expect(stepUpDelayMs(4)).toBe(STEP_UP_ATTEMPT_DELAYS_MS[4]);
    expect(stepUpDelayMs(5)).toBeGreaterThan(stepUpDelayMs(4));
    expect(stepUpDelayMs(99)).toBe(STEP_UP_ATTEMPT_DELAYS_MS[STEP_UP_ATTEMPT_DELAYS_MS.length - 1]);
  });
});