import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({ Lock: 'div', Fingerprint: 'div', LockOpen: 'div' }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => {
      const map: Record<string, string> = {
        'lock.title': 'App Locked',
        'lock.description': 'Recovery is impossible, please enter your PIN',
        'lock.enterPin': 'Enter PIN',
        'lock.unlock': 'Unlock',
        'lock.tooManyAttempts': 'Too many attempts',
        'lock.permanentlyLocked': 'App is permanently locked. Recovery required.',
        'lock.locked': 'Locked',
        'lock.tryAgainIn': 'Try again in {seconds} seconds',
        'lock.wrongPin': 'Wrong PIN. {remaining} attempt(s) remaining',
        'lock.totpLabel': '2FA code',
        'lock.totpWrong': 'Incorrect 2FA code',
      };
      return map[key] || fallback || key;
    }
  })
}));

import { AppLockScreen } from './AppLockScreen';

const defaultProps = {
  pinInput: '',
  setPinInput: vi.fn(),
  pinError: false,
  biometricError: false,
  biometricBusy: false,
  biometricEnabled: false,
  biometricAvailable: false,
  lockAttempts: 0,
  lockBlockTimer: 0,
  lockBlockedUntil: undefined,
  handleUnlock: vi.fn(),
  handleUnlockBiometric: vi.fn(),
};

describe('AppLockScreen', () => {
  it('renders lock icon and title', () => {
    render(<AppLockScreen {...defaultProps} />);
    expect(screen.getByText('App Locked')).toBeInTheDocument();
    expect(screen.getByText('Recovery is impossible, please enter your PIN')).toBeInTheDocument();
  });

  it('renders PIN input', () => {
    render(<AppLockScreen {...defaultProps} />);
    const input = screen.getByPlaceholderText('****');
    expect(input).toBeInTheDocument();
  });

  it('renders unlock button', () => {
    render(<AppLockScreen {...defaultProps} />);
    expect(screen.getByText('Unlock')).toBeInTheDocument();
  });

  it('disables unlock and shows ellipsis while busy', () => {
    render(<AppLockScreen {...defaultProps} unlockBusy />);
    const button = screen.getByRole('button', { name: 'Unlock' });
    expect(button).toBeDisabled();
    expect(screen.getByText('…')).toBeInTheDocument();
  });

  it('shows permanently blocked state', () => {
    render(<AppLockScreen {...defaultProps} lockBlockedUntil={Infinity} />);
    expect(screen.getByText('Too many attempts')).toBeInTheDocument();
  });

  it('shows temporarily blocked state', () => {
    render(<AppLockScreen {...defaultProps} lockBlockTimer={30} />);
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('renders TOTP input when 2FA is required', () => {
    render(<AppLockScreen {...defaultProps} twoFactorRequired={true} totpError={true} />);
    const input = document.getElementById('app-lock-totp-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Incorrect 2FA code')).toBeInTheDocument();
  });

  it('does not render TOTP input when 2FA is off', () => {
    render(<AppLockScreen {...defaultProps} />);
    expect(document.getElementById('app-lock-totp-input')).not.toBeInTheDocument();
  });
});
