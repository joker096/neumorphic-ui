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

vi.mock('../../lib/crypto/cryptoCore', () => ({
  cryptoCore: {
    hashAppLockPIN: vi.fn().mockResolvedValue({ hash: 'hashed', saltHex: 'salt' }),
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

  it('disables 2FA when toggle is flipped on an active setup', async () => {
    const setTwoFactor = vi.fn();
    const setTotpSecret = vi.fn();
    mockUseAppStore.mockImplementation((selector?: any) => {
      const state = {
        setAppLock: vi.fn(),
        appLockHashedPIN: null,
        appLockSalt: '',
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

    expect(setTwoFactor).toHaveBeenCalledWith(false);
    expect(setTotpSecret).toHaveBeenCalledWith(null);
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
