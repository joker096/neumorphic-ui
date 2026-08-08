import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({ Lock: 'div' }));
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
  lockAttempts: 0,
  lockBlockTimer: 0,
  lockBlockedUntil: undefined,
  handleUnlock: vi.fn(),
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

  it('shows permanently blocked state', () => {
    render(<AppLockScreen {...defaultProps} lockBlockedUntil={Infinity} />);
    expect(screen.getByText('Too many attempts')).toBeInTheDocument();
  });

  it('shows temporarily blocked state', () => {
    render(<AppLockScreen {...defaultProps} lockBlockTimer={30} />);
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });
});
