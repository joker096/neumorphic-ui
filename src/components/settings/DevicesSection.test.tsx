import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DevicesSection } from './DevicesSection';
import { cryptoCore } from '../../lib/crypto/cryptoCore';

vi.mock('../../lib/crypto/cryptoCore', () => ({
  cryptoCore: { secureWipe: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { toast } from 'sonner';

const defaultProps = {
  isDark: false,
  onBack: vi.fn(),
  t: (key: string, fallback?: string) => fallback ?? key,
};

describe('DevicesSection', () => {
  it('renders this device and empty other-devices state', () => {
    render(<DevicesSection {...defaultProps} />);
    expect(screen.getAllByText('This device').length).toBeGreaterThan(1);
    expect(screen.getByText('No other devices')).toBeInTheDocument();
    expect(screen.getByText('Only this device is connected')).toBeInTheDocument();
  });

  it('opens terminate-all confirm modal (honest: no other sessions)', () => {
    render(<DevicesSection {...defaultProps} />);
    fireEvent.click(screen.getByText('Terminate all other sessions'));
    expect(screen.getByText('End all other sessions? They will lose access.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Terminate all' }));
    expect(toast.info).toHaveBeenCalledWith('No other active sessions');
  });

  it('terminates current session via confirm modal', async () => {
    render(<DevicesSection {...defaultProps} />);
    fireEvent.click(screen.getByText('End this session and wipe local data'));
    expect(screen.getByText('End the session on this device? Local data will be wiped.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Terminate' }));
    await vi.waitFor(() => expect(cryptoCore.secureWipe).toHaveBeenCalled());
  });

  it('calls onBack from header', () => {
    render(<DevicesSection {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });
});
