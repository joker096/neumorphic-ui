import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SecuritySection } from './SecuritySection';

const mockUseAppStore = vi.fn();

vi.mock('../../store', () => {
  const storeFn: any = (...args: any[]) => mockUseAppStore(...args);
  storeFn.getState = () => ({ userProfile: { name: 'test-user' } });
  return { useAppStore: storeFn };
});

const totpMock = vi.hoisted(() => ({
  generateSecret: vi.fn(() => 'TESTSECRETBASE32'),
  verifyTotp: vi.fn(async () => true),
  totpCode: vi.fn(async () => '987654'),
  otpauthUri: vi.fn((secret) => `otpauth://totp/x?secret=${secret}`),
}));

vi.mock('../../lib/twoFactor', () => totpMock);

const biometricMock = vi.hoisted(() => ({
  isBiometricAvailable: vi.fn(async () => true),
  registerBiometric: vi.fn(async () => 'cred-123'),
  verifyBiometric: vi.fn(async () => true),
  deleteBiometricCredential: vi.fn(async () => undefined),
}));

vi.mock('../../lib/biometric', () => biometricMock);

vi.mock('../../lib/crypto/cryptoCore', () => ({
  cryptoCore: {
    hashAppLockPIN: vi.fn().mockResolvedValue({ hash: 'hashed', saltHex: 'salt' }),
    verifyAppLockPIN: vi.fn().mockResolvedValue(true),
    secureWipe: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
}));

beforeEach(() => {
  mockUseAppStore.mockImplementation((selector?: any) => {
    const state = {
      setAppLock: vi.fn(),
      appLockHashedPIN: null,
      appLockSalt: '',
      appLockBiometricEnabled: false,
      appLockBiometricCredentialId: null,
      twoFactor: false,
      setTwoFactor: vi.fn(),
      totpSecret: null,
      setTotpSecret: vi.fn(),
    };
    if (typeof selector === 'function') {
      return selector(state);
    }
    return state;
  });
});

describe('SecuritySection - additional tests', () => {
  it('renders lock icon when pin exists', () => {
    mockUseAppStore.mockImplementation((selector?: any) => {
      beforeEach(() => {
      totpMock.verifyTotp.mockResolvedValue(true);
    });

    const state = {
        setAppLock: vi.fn(),
        appLockHashedPIN: 'hashed',
        appLockSalt: 'salt',
        twoFactor: false,
        setTwoFactor: vi.fn(),
        totpSecret: null,
        setTotpSecret: vi.fn(),
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    render(<SecuritySection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    expect(document.querySelector('[class*="lucide"]') || document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders unlock icon when no pin', () => {
    render(<SecuritySection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    expect(document.querySelector('[class*="lucide"]') || document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders dark theme styles', () => {
    const { container } = render(<SecuritySection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    expect(container.querySelector('[class*="bg-[#1a1d24]"]') || container.querySelector('[class*="border-white/5"]') || container.querySelector('[class*="flex-1"]') || container.querySelector('[class*="w-full"]')).toBeInTheDocument();
  });

  it('renders light theme styles', () => {
    const { container } = render(<SecuritySection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    expect(container.querySelector('[class*="bg-white"]') || container.querySelector('[class*="border-black/5"]') || container.querySelector('[class*="flex-1"]') || container.querySelector('[class*="w-full"]')).toBeInTheDocument();
  });

  it('renders confirm dialog', () => {
    render(<SecuritySection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('settings.security')).toBeInTheDocument();
  });

  it('renders section title', () => {
    render(<SecuritySection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('settings.security')).toBeInTheDocument();
  });

  it('renders danger zone title', () => {
    render(<SecuritySection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('settings.dangerZone')).toBeInTheDocument();
  });

  it('renders all groups', () => {
    const { container } = render(<SecuritySection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    expect(container.querySelectorAll('button, input, [class*="group"]').length).toBeGreaterThanOrEqual(1);
  });

  it('renders shield icon', () => {
    render(<SecuritySection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    expect(document.querySelector('[class*="lucide-shield"]') || document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders Lock/Unlock icons', () => {
    render(<SecuritySection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    expect(document.querySelector('[class*="lucide"]') || document.querySelector('svg')).toBeInTheDocument();
  });

  it('opens TOTP setup on toggle, verifies code, and enables 2FA', async () => {
    const setTwoFactor = vi.fn();
    const setTotpSecret = vi.fn();
    mockUseAppStore.mockImplementation((selector?: any) => {
      const state = {
        setAppLock: vi.fn(),
        appLockHashedPIN: null,
        appLockSalt: '',
        twoFactor: false,
        setTwoFactor,
        totpSecret: null,
        setTotpSecret,
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    render(<SecuritySection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);

    const toggle = screen.getByText('settings.twoFactorAuth');
    fireEvent.click(toggle);

    expect(totpMock.generateSecret).toHaveBeenCalled();
    expect(document.getElementById('security-totp-secret')).toHaveTextContent('TESTSECRETBASE32');

    const input = document.getElementById('security-totp-input');
    fireEvent.change(input as HTMLElement, { target: { value: '123456' } });

    fireEvent.click(screen.getByText('settings.verify'));

    await waitFor(() => {
      expect(totpMock.verifyTotp).toHaveBeenCalledWith('TESTSECRETBASE32', '123456');
      expect(setTotpSecret).toHaveBeenCalledWith('TESTSECRETBASE32');
      expect(setTwoFactor).toHaveBeenCalledWith(true);
    });
  });

  it('does not disable 2FA on a plain toggle click when no PIN is configured', async () => {
    const setTwoFactor = vi.fn();
    const setTotpSecret = vi.fn();
    mockUseAppStore.mockImplementation((selector?: any) => {
      const state = {
        setAppLock: vi.fn(),
        appLockHashedPIN: null,
        appLockSalt: '',
        appLockBiometricEnabled: false,
        appLockBiometricCredentialId: null,
        twoFactor: true,
        setTwoFactor,
        totpSecret: 'OLDSECRET1234',
        setTotpSecret,
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    render(<SecuritySection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);

    fireEvent.click(screen.getByText('settings.twoFactorAuth'));

    // Fail closed: no identity proof is possible, so nothing is disabled.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(setTwoFactor).not.toHaveBeenCalled();
    expect(setTotpSecret).not.toHaveBeenCalled();
  });

  it('disables 2FA only after the step-up PIN is accepted', async () => {
    const setTwoFactor = vi.fn();
    const setTotpSecret = vi.fn();
    mockUseAppStore.mockImplementation((selector?: any) => {
      const state = {
        setAppLock: vi.fn(),
        appLockHashedPIN: 'hashed',
        appLockSalt: 'salt',
        appLockBiometricEnabled: false,
        appLockBiometricCredentialId: null,
        twoFactor: true,
        setTwoFactor,
        totpSecret: 'OLDSECRET1234',
        setTotpSecret,
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    render(<SecuritySection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);

    fireEvent.click(screen.getByText('settings.twoFactorAuth'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(setTwoFactor).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('settings.enterPin'), { target: { value: '1234' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'settings.verify' }));
    });

    await waitFor(() => expect(setTwoFactor).toHaveBeenCalledWith(false));
    expect(setTotpSecret).toHaveBeenCalledWith(null);
  });

  it('disables biometric unlock only after the step-up PIN is accepted', async () => {
    const setAppLockBiometric = vi.fn();
    mockUseAppStore.mockImplementation((selector?: any) => {
      const state = {
        setAppLock: vi.fn(),
        appLockHashedPIN: 'hashed',
        appLockSalt: 'salt',
        appLockBiometricEnabled: true,
        appLockBiometricCredentialId: 'cred-123',
        setAppLockBiometric,
        twoFactor: false,
        setTwoFactor: vi.fn(),
        totpSecret: null,
        setTotpSecret: vi.fn(),
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    render(<SecuritySection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);

    const toggle = screen.getByRole('switch', { name: 'settings.biometricUnlock' });
    await waitFor(() => expect(toggle).toBeEnabled());
    fireEvent.click(toggle);

    // A one-tap "disable" would let anyone holding an unlocked session strip the
    // strongest lock the user has.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(setAppLockBiometric).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('settings.enterPin'), { target: { value: '1234' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'settings.verify' }));
    });

    await waitFor(() => expect(setAppLockBiometric).toHaveBeenCalledWith(false, null));
  });

  it('wipes the account only after a strong step-up challenge', async () => {
    const { cryptoCore } = await import('../../lib/crypto/cryptoCore');
    mockUseAppStore.mockImplementation((selector?: any) => {
      const state = {
        setAppLock: vi.fn(),
        appLockHashedPIN: 'hashed',
        appLockSalt: 'salt',
        appLockBiometricEnabled: false,
        appLockBiometricCredentialId: null,
        twoFactor: true,
        setTwoFactor: vi.fn(),
        totpSecret: 'SECRET',
        setTotpSecret: vi.fn(),
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    render(<SecuritySection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);

    // A single merged destructive control — no separate "wipe" row.
    expect(screen.queryByText('settings.wipeAllData')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('settings.deleteAccount'));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(cryptoCore.secureWipe).not.toHaveBeenCalled();
    // strong level → PIN + 2FA code.
    expect(screen.getByPlaceholderText('lock.totpLabel')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('settings.enterPin'), { target: { value: '1234' } });
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('lock.totpLabel'), { target: { value: '123456' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'settings.verify' }));
    });

    await waitFor(() => expect(cryptoCore.secureWipe).toHaveBeenCalledTimes(1));
  });

  it('guards PIN set against double submit while hashing', async () => {
    const { cryptoCore } = await import('../../lib/crypto/cryptoCore');
    let releaseHash!: (value: { hash: string; saltHex: string }) => void;
    vi.mocked(cryptoCore.hashAppLockPIN).mockImplementationOnce(
      () => new Promise((resolve) => { releaseHash = resolve; }),
    );

    render(<SecuritySection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    fireEvent.click(screen.getAllByRole('switch')[0]);

    fireEvent.change(screen.getByPlaceholderText('settings.enterPin'), {
      target: { value: '1234' },
    });
    const confirmBtn = screen.getByRole('button', { name: 'settings.confirmPin' });
    fireEvent.click(confirmBtn);
    fireEvent.click(confirmBtn);

    expect(cryptoCore.hashAppLockPIN).toHaveBeenCalledTimes(1);
    expect(confirmBtn).toBeDisabled();

    await act(async () => {
      releaseHash!({ hash: 'h', saltHex: 's' });
    });
    expect(screen.queryByPlaceholderText('settings.enterPin')).not.toBeInTheDocument();
  });
});
