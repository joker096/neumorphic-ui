import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('../../hooks/useAppLock', () => ({
  useAppLock: vi.fn(),
}));

vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));

import { LockScreen } from './LockScreen';
import { useAppLock } from '../../hooks/useAppLock';
import type { LockScreenProps } from './LockScreen';

const mockUseAppLock = vi.mocked(useAppLock);

const mockSalt = 'mock_salt_12345';

const getMockProps = (hashPIN: string | null = 'hashed_pin', unlocked: boolean = false): LockScreenProps => ({
  appLockHashedPIN: hashPIN,
  isUnlocked: unlocked,
  setIsUnlocked: vi.fn(),
  pinInput: '',
  setPinInput: vi.fn(),
  pinError: false,
  setPinError: vi.fn(),
  lockAttempts: 0,
  setLockAttempts: vi.fn(),
  lockBlockedUntil: 0,
  setLockBlockedUntil: vi.fn(),
  lockBlockTimer: 0,
  setLockBlockTimer: vi.fn(),
});

const createMockLocalStorage = (hasSalt: boolean) => ({
  getItem: vi.fn((key: string) => (key === 'app_lock_salt' && hasSalt ? mockSalt : null)),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: hasSalt ? 1 : 0,
  key: vi.fn(),
});

describe('LockScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', createMockLocalStorage(true));
    mockUseAppLock.mockReturnValue({
      appLockHashedPIN: 'hashed_pin',
      isUnlocked: false,
      pinInput: '',
      setPinInput: vi.fn(),
      pinError: false,
      lockAttempts: 0,
      lockBlockedUntil: 0,
      lockBlockTimer: 0,
      handleUnlock: vi.fn(),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when no hashed PIN', () => {
    const { container } = render(<LockScreen {...getMockProps(null)} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when already unlocked', () => {
    const { container } = render(<LockScreen {...getMockProps('hashed_pin', true)} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when no salt', () => {
    vi.restoreAllMocks();
    vi.stubGlobal('localStorage', createMockLocalStorage(false));
    const { container } = render(<LockScreen {...getMockProps('hashed_pin')} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders lock icon and title', () => {
    render(<LockScreen {...getMockProps()} />);
    expect(screen.getByText('lock.title')).toBeInTheDocument();
    expect(screen.getByText('lock.description')).toBeInTheDocument();
  });

  it('renders PIN input', () => {
    render(<LockScreen {...getMockProps()} />);
    const input = screen.getByPlaceholderText('****');
    expect(input).toBeInTheDocument();
  });

  it('renders unlock button', () => {
    render(<LockScreen {...getMockProps()} />);
    expect(screen.getByText('lock.unlock')).toBeInTheDocument();
  });
});
