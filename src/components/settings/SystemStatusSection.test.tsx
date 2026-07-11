import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({
  Activity: 'div', Wifi: 'div', Zap: 'div', Clock: 'div',
  Smartphone: 'div', WifiOff: 'div', CloudOff: 'div', ChevronLeft: 'div', ChevronRight: 'div',
}));

import { SystemStatusSection } from './SystemStatusSection';

const defaultProps = {
  isDark: false,
  connectionStatus: 'connected',
  transportBackend: 'wss://relay.example.com',
  latencyMs: 45,
  blockedBackends: [],
  regionBlocked: false,
  onBack: vi.fn(),
  t: (k: string) => k,
  pendingMessages: 0,
};

describe('SystemStatusSection', () => {
  it('renders section title', () => {
    render(<SystemStatusSection {...defaultProps} />);
    expect(screen.getByText('settings.systemStatus')).toBeInTheDocument();
  });

  it('renders connection status', () => {
    render(<SystemStatusSection {...defaultProps} />);
    expect(screen.getByText('settings.connectionStatus')).toBeInTheDocument();
  });

  it('renders transport backend', () => {
    render(<SystemStatusSection {...defaultProps} />);
    expect(screen.getByText('settings.transportBackend')).toBeInTheDocument();
  });

  it('renders latency', () => {
    render(<SystemStatusSection {...defaultProps} />);
    expect(screen.getByText('settings.latency')).toBeInTheDocument();
    expect(screen.getByText('45 ms')).toBeInTheDocument();
  });

  it('shows blocked backends when exist', () => {
    render(<SystemStatusSection {...defaultProps} blockedBackends={['relay1', 'relay2']} />);
    expect(screen.getByText('settings.blockedBackends')).toBeInTheDocument();
    expect(screen.getByText('relay1')).toBeInTheDocument();
    expect(screen.getByText('relay2')).toBeInTheDocument();
  });
});
