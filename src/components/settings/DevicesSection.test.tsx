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
  it('renders this device without mock other-devices section', () => {
    render(<DevicesSection {...defaultProps} />);
    expect(screen.getAllByText('This device').length).toBeGreaterThan(1);
    expect(screen.queryByText('No other devices')).not.toBeInTheDocument();
    expect(screen.queryByText('Terminate all other sessions')).not.toBeInTheDocument();
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
