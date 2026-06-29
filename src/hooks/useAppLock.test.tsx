import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/crypto/cryptoCore', () => ({
  cryptoCore: {
    hashAppLockPIN: vi.fn().mockResolvedValue({ hash: 'test-hash' }),
  },
}));

vi.mock('../constants', () => ({
  STORAGE_KEYS: {
    LOCK_ATTEMPTS: 'lock_attempts',
    LOCK_BLOCKED_UNTIL: 'lock_blocked_until',
  },
}));

vi.mock('../store', () => ({
  useAppStore: vi.fn((selector: any) => selector({ appLockHashedPIN: null, appLockSalt: null })),
}));

describe('useAppLock', () => {
  beforeEach(() => {
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
});