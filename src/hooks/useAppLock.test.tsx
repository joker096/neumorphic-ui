import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const storeState = vi.hoisted(() => ({
  state: {
    appLockHashedPIN: 'test-hash',
    appLockSalt: 'test-salt',
    appLocked: true,
    appLockBiometricEnabled: false,
    appLockBiometricCredentialId: null,
    appLockAutoLockOnBackground: false,
    appLockIdleSeconds: 0,
    setAppLocked: vi.fn(),
    twoFactor: false,
    totpSecret: null,
  },
}));

const twoFactorMock = vi.hoisted(() => ({
  verifyTotp: vi.fn(async () => false),
}));

vi.mock('../lib/crypto/cryptoCore', () => ({
  cryptoCore: {
    hashAppLockPIN: vi.fn().mockResolvedValue({ hash: 'test-hash' }),
    verifyAppLockPIN: vi.fn(async () => true),
  },
}));

vi.mock('../lib/twoFactor', () => twoFactorMock);

vi.mock('../constants', () => ({
  STORAGE_KEYS: {
    LOCK_ATTEMPTS: 'lock_attempts',
    LOCK_BLOCKED_UNTIL: 'lock_blocked_until',
  },
}));

vi.mock('../store', () => ({
  useAppStore: vi.fn((selector: any) => selector(storeState.state)),
}));

describe('useAppLock', () => {
  beforeEach(() => {
    storeState.state.twoFactor = false;
    storeState.state.totpSecret = null;
    twoFactorMock.verifyTotp.mockResolvedValue(false);
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should have initial state with isUnlocked false', async () => {
    const { useAppLock } = await import('./useAppLock');
    const { result } = renderHook(() => useAppLock());

    expect(result.current.isUnlocked).toBe(false);
    expect(result.current.pinInput).toBe('');
    expect(result.current.pinError).toBe(false);
  });

  it('should handle PIN input changes', async () => {
    const { useAppLock } = await import('./useAppLock');

    const { result } = renderHook(() => useAppLock());

    act(() => {
      result.current.setPinInput('1234');
    });

    expect(result.current.pinInput).toBe('1234');
  });

  it('should track lock attempts from localStorage', async () => {
    const { useAppLock } = await import('./useAppLock');
    localStorage.setItem('lock_attempts', '2');

    const { result } = renderHook(() => useAppLock());

    expect(result.current.lockAttempts).toBe(2);
  });

  it('unlocks with a correct TOTP code when 2FA is enabled', async () => {
    act(() => {
      storeState.state.twoFactor = true;
      storeState.state.totpSecret = 'SECRET';
    });
    twoFactorMock.verifyTotp.mockResolvedValue(true);

    const { useAppLock } = await import('./useAppLock');
    const { result } = renderHook(() => useAppLock());

    act(() => {
      result.current.setPinInput('1234');
      result.current.setTotpInput('123456');
    });

    await act(async () => {
      await result.current.handleUnlock();
    });

    expect(twoFactorMock.verifyTotp).toHaveBeenCalledWith('SECRET', '123456');
    expect(result.current.pinError).toBe(false);
    expect(result.current.totpError).toBe(false);
    expect(storeState.state.setAppLocked).toHaveBeenCalledWith(false);
  });

  it('stays locked when the TOTP code is wrong', async () => {
    act(() => {
      storeState.state.twoFactor = true;
      storeState.state.totpSecret = 'SECRET';
    });

    const { useAppLock } = await import('./useAppLock');
    const { result } = renderHook(() => useAppLock());

    act(() => {
      result.current.setPinInput('1234');
      result.current.setTotpInput('000000');
    });

    await act(async () => {
      await result.current.handleUnlock();
    });

    expect(result.current.isUnlocked).toBe(false);
    expect(result.current.totpError).toBe(true);
    expect(result.current.pinInput).toBe('');
    expect(result.current.totpInput).toBe('');
  });

  it('skips TOTP verification when 2FA is disabled', async () => {
    const { useAppLock } = await import('./useAppLock');
    const { result } = renderHook(() => useAppLock());

    act(() => {
      result.current.setPinInput('1234');
    });

    await act(async () => {
      await result.current.handleUnlock();
    });

    expect(twoFactorMock.verifyTotp).not.toHaveBeenCalled();
    expect(storeState.state.setAppLocked).toHaveBeenCalledWith(false);
  });

  it('prevents concurrent unlock submissions while verifying', async () => {
    const { useAppLock } = await import('./useAppLock');
    const { cryptoCore } = await import('../lib/crypto/cryptoCore');
    let releaseVerify!: (value: boolean) => void;
    vi.mocked(cryptoCore.verifyAppLockPIN).mockImplementationOnce(
      () => new Promise<boolean>((resolve) => { releaseVerify = resolve; }),
    );

    const { result } = renderHook(() => useAppLock());
    act(() => {
      result.current.setPinInput('1234');
    });

    await act(async () => {
      void result.current.handleUnlock();
    });
    await act(async () => {
      void result.current.handleUnlock();
    });

    expect(cryptoCore.verifyAppLockPIN).toHaveBeenCalledTimes(1);
    expect(result.current.unlockBusy).toBe(true);

    await act(async () => {
      releaseVerify!(true);
    });
    expect(result.current.unlockBusy).toBe(false);
    expect(storeState.state.setAppLocked).toHaveBeenCalledWith(false);
  });
});