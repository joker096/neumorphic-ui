import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({ Lock: 'div' }));
vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));

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
    expect(screen.getByText('lock.title')).toBeInTheDocument();
    expect(screen.getByText('lock.description')).toBeInTheDocument();
  });

  it('renders PIN input', () => {
    render(<AppLockScreen {...defaultProps} />);
    const input = screen.getByPlaceholderText('****');
    expect(input).toBeInTheDocument();
  });

  it('renders unlock button', () => {
    render(<AppLockScreen {...defaultProps} />);
    expect(screen.getByText('lock.unlock')).toBeInTheDocument();
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
