import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const cryptoMock = vi.hoisted(() => ({
  verifyAppLockPIN: vi.fn(async () => true),
}));

const totpMock = vi.hoisted(() => ({
  verifyTotp: vi.fn(async () => true),
}));

const biometricMock = vi.hoisted(() => ({
  verifyBiometric: vi.fn(async () => true),
}));

vi.mock('../lib/crypto/cryptoCore', () => ({ cryptoCore: cryptoMock }));
vi.mock('../lib/twoFactor', () => totpMock);
vi.mock('../lib/biometric', () => biometricMock);

interface StoreState {
  appLockHashedPIN?: string | null;
  appLockSalt?: string | null;
  appLockBiometricEnabled?: boolean;
  appLockBiometricCredentialId?: string | null;
  twoFactor?: boolean;
  totpSecret?: string | null;
}

let storeState: StoreState = {};

vi.mock('../store', () => ({
  useAppStore: (selector: (s: Required<StoreState>) => unknown) => selector(storeState as Required<StoreState>),
}));

import { useSecurityChallenge, type StepUpRequest } from './useSecurityChallenge';

const level = (over: Partial<StoreState> = {}): Required<StoreState> => ({
  appLockHashedPIN: 'hash',
  appLockSalt: 'salt',
  appLockBiometricEnabled: false,
  appLockBiometricCredentialId: null,
  twoFactor: false,
  totpSecret: null,
  ...over,
});

beforeEach(() => {
  storeState = level();
  cryptoMock.verifyAppLockPIN.mockClear();
  cryptoMock.verifyAppLockPIN.mockResolvedValue(true);
  totpMock.verifyTotp.mockClear();
  totpMock.verifyTotp.mockResolvedValue(true);
  biometricMock.verifyBiometric.mockClear();
  biometricMock.verifyBiometric.mockResolvedValue(true);
  vi.useRealTimers();
});

const request = (onVerified: () => void, over: Partial<StepUpRequest> = {}): StepUpRequest => ({
  level: 'pin',
  title: 'Confirm',
  message: 'Something sensitive',
  onVerified,
  ...over,
});

describe('useSecurityChallenge — fail closed', () => {
  it('refuses to open when no PIN and no authenticator exist', () => {
    storeState = level({ appLockHashedPIN: null, appLockSalt: '' });
    const onVerified = vi.fn();
    const { result } = renderHook(() => useSecurityChallenge());

    let started = true;
    act(() => { started = result.current.require(request(onVerified)); });

    expect(started).toBe(false);
    expect(result.current.challenge.isOpen).toBe(false);
  });

  it('never runs the action when the PIN is wrong', async () => {
    cryptoMock.verifyAppLockPIN.mockResolvedValue(false);
    const onVerified = vi.fn();
    const { result } = renderHook(() => useSecurityChallenge());

    act(() => { result.current.require(request(onVerified)); });
    act(() => { result.current.challenge.setPin('0000'); });
    expect(result.current.challenge.canSubmit).toBe(true);
    await act(async () => { await result.current.challenge.onSubmit(); });

    expect(onVerified).not.toHaveBeenCalled();
    expect(cryptoMock.verifyAppLockPIN).toHaveBeenCalled();
    expect(result.current.challenge.error).toBe(true);
  });

  it('runs the action after the correct PIN and closes the challenge', async () => {
    const onVerified = vi.fn();
    const { result } = renderHook(() => useSecurityChallenge());

    act(() => { result.current.require(request(onVerified)); });
    act(() => { result.current.challenge.setPin('1234'); });
    await act(async () => { await result.current.challenge.onSubmit(); });

    expect(onVerified).toHaveBeenCalledTimes(1);
    expect(result.current.challenge.isOpen).toBe(false);
  });

  it('requires a 4-digit PIN and the TOTP code before submitting', async () => {
    storeState = level({ twoFactor: true, totpSecret: 'SECRET' });
    const onVerified = vi.fn();
    const { result } = renderHook(() => useSecurityChallenge());

    act(() => { result.current.require(request(onVerified, { level: 'strong' })); });
    expect(result.current.challenge.needsTotp).toBe(true);
    expect(result.current.challenge.canSubmit).toBe(false);

    act(() => { result.current.challenge.setPin('1234'); });
    expect(result.current.challenge.canSubmit).toBe(false);

    act(() => { result.current.challenge.setTotp('123456'); });
    expect(result.current.challenge.canSubmit).toBe(true);

    await act(async () => { await result.current.challenge.onSubmit(); });
    expect(totpMock.verifyTotp).toHaveBeenCalledWith('SECRET', '123456');
    expect(onVerified).toHaveBeenCalledTimes(1);
  });

  it('does not run a strong action with a good PIN but a bad 2FA code', async () => {
    storeState = level({ twoFactor: true, totpSecret: 'SECRET' });
    totpMock.verifyTotp.mockResolvedValue(false);
    const onVerified = vi.fn();
    const { result } = renderHook(() => useSecurityChallenge());

    act(() => { result.current.require(request(onVerified, { level: 'strong' })); });
    act(() => {
      result.current.challenge.setPin('1234');
      result.current.challenge.setTotp('000000');
    });
    await act(async () => { await result.current.challenge.onSubmit(); });

    expect(onVerified).not.toHaveBeenCalled();
    expect(result.current.challenge.error).toBe(true);
  });

  it('ignores a 2FA code for the pin level', async () => {
    storeState = level({ twoFactor: true, totpSecret: 'SECRET' });
    const onVerified = vi.fn();
    const { result } = renderHook(() => useSecurityChallenge());

    act(() => { result.current.require(request(onVerified, { level: 'pin' })); });
    expect(result.current.challenge.needsTotp).toBe(false);
    act(() => { result.current.challenge.setPin('1234'); });
    await act(async () => { await result.current.challenge.onSubmit(); });

    expect(totpMock.verifyTotp).not.toHaveBeenCalled();
    expect(onVerified).toHaveBeenCalledTimes(1);
  });
});

describe('useSecurityChallenge — biometric discipline', () => {
  it('never substitutes a fingerprint for the PIN on pin/strong levels', async () => {
    storeState = level({
      appLockBiometricEnabled: true,
      appLockBiometricCredentialId: 'cred',
      twoFactor: true,
      totpSecret: 'SECRET',
    });
    const onVerified = vi.fn();
    const { result } = renderHook(() => useSecurityChallenge());

    act(() => { result.current.require(request(onVerified, { level: 'strong' })); });
    expect(result.current.challenge.allowBiometric).toBe(false);
    await act(async () => { await result.current.challenge.onBiometric(); });

    expect(biometricMock.verifyBiometric).not.toHaveBeenCalled();
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('accepts a fingerprint for the biometric level', async () => {
    storeState = level({ appLockBiometricEnabled: true, appLockBiometricCredentialId: 'cred' });
    const onVerified = vi.fn();
    const { result } = renderHook(() => useSecurityChallenge());

    act(() => { result.current.require(request(onVerified, { level: 'biometric' })); });
    expect(result.current.challenge.allowBiometric).toBe(true);
    await act(async () => { await result.current.challenge.onBiometric(); });

    expect(biometricMock.verifyBiometric).toHaveBeenCalledWith('cred');
    expect(onVerified).toHaveBeenCalledTimes(1);
  });

  it('accepts the PIN as fallback when biometrics are enrolled', async () => {
    storeState = level({ appLockBiometricEnabled: true, appLockBiometricCredentialId: 'cred' });
    biometricMock.verifyBiometric.mockResolvedValue(false);
    const onVerified = vi.fn();
    const { result } = renderHook(() => useSecurityChallenge());

    act(() => { result.current.require(request(onVerified, { level: 'biometric' })); });
    await act(async () => { await result.current.challenge.onBiometric(); });
    expect(onVerified).not.toHaveBeenCalled();
    expect(result.current.challenge.biometricError).toBe(true);

    act(() => { result.current.challenge.setPin('1234'); });
    await act(async () => { await result.current.challenge.onSubmit(); });
    expect(onVerified).toHaveBeenCalledTimes(1);
  });

  it('does not verify anything when no authenticator is enrolled', async () => {
    const onVerified = vi.fn();
    const { result } = renderHook(() => useSecurityChallenge());

    act(() => { result.current.require(request(onVerified, { level: 'biometric' })); });
    await act(async () => { await result.current.challenge.onBiometric(); });

    expect(biometricMock.verifyBiometric).not.toHaveBeenCalled();
    expect(onVerified).not.toHaveBeenCalled();
  });
});

describe('useSecurityChallenge — brute-force backoff', () => {
  it('blocks the 5th attempt and keeps the penalty across cancel + reopen', async () => {
    cryptoMock.verifyAppLockPIN.mockResolvedValue(false);
    const onVerified = vi.fn();
    const { result } = renderHook(() => useSecurityChallenge());

    for (let i = 0; i < 4; i += 1) {
      act(() => {
        result.current.require(request(onVerified));
        result.current.challenge.setPin('0000');
      });
      await act(async () => { await result.current.challenge.onSubmit(); });
      act(() => { result.current.challenge.onCancel(); });
    }

    act(() => { result.current.require(request(onVerified)); });
    expect(result.current.challenge.blockedSeconds).toBeGreaterThan(0);
    expect(result.current.challenge.canSubmit).toBe(false);

    await act(async () => { await result.current.challenge.onSubmit(); });
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('clears the counter after a successful verification', async () => {
    vi.useFakeTimers();
    cryptoMock.verifyAppLockPIN.mockResolvedValue(false);
    const onVerified = vi.fn();
    const { result } = renderHook(() => useSecurityChallenge());

    const failOnce = async () => {
      act(() => {
        result.current.require(request(onVerified));
        result.current.challenge.setPin('0000');
      });
      await act(async () => { await result.current.challenge.onSubmit(); });
      act(() => { result.current.challenge.onCancel(); });
    };

    for (let i = 0; i < 4; i += 1) await failOnce();
    expect(result.current.challenge.blockedSeconds).toBe(30);

    // Wait out the penalty, then satisfy the challenge.
    await act(async () => { vi.advanceTimersByTime(31_000); });
    expect(result.current.challenge.blockedSeconds).toBe(0);

    cryptoMock.verifyAppLockPIN.mockResolvedValue(true);
    act(() => {
      result.current.require(request(onVerified));
      result.current.challenge.setPin('1234');
    });
    await act(async () => { await result.current.challenge.onSubmit(); });
    expect(onVerified).toHaveBeenCalledTimes(1);

    // The counter restarted: a fresh run of failures escalates to 30s again
    // instead of jumping straight to the 60s rung.
    cryptoMock.verifyAppLockPIN.mockResolvedValue(false);
    for (let i = 0; i < 5; i += 1) await failOnce();
    expect(result.current.challenge.blockedSeconds).toBe(30);

    vi.useRealTimers();
  });

  it('does nothing when submitted without a PIN', async () => {
    const onVerified = vi.fn();
    const { result } = renderHook(() => useSecurityChallenge());

    act(() => { result.current.require(request(onVerified)); });
    await act(async () => { await result.current.challenge.onSubmit(); });

    expect(cryptoMock.verifyAppLockPIN).not.toHaveBeenCalled();
    expect(onVerified).not.toHaveBeenCalled();
  });
});