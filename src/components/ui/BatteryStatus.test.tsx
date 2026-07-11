import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BatteryStatus } from './BatteryStatus';

vi.mock('motion/react', () => ({
  motion: {
    div: 'div',
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('BatteryStatus', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders battery label', () => {
    render(<BatteryStatus />);
    expect(screen.getByText('Battery')).toBeInTheDocument();
  });

  it('renders battery percentage', () => {
    render(<BatteryStatus />);
    expect(screen.getByText(/%/)).toBeInTheDocument();
  });

  it('renders the battery bar container', () => {
    const { container } = render(<BatteryStatus />);
    const bars = container.querySelectorAll('.rounded-full');
    expect(bars.length).toBeGreaterThanOrEqual(2);
  });

  it('renders with getBattery if available', () => {
    const mockBattery = {
      level: 0.75,
      charging: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const getBatteryMock = vi.fn().mockResolvedValue(mockBattery);
    Object.defineProperty(navigator, 'getBattery', {
      value: getBatteryMock,
      writable: true,
      configurable: true,
    });

    render(<BatteryStatus />);
    expect(getBatteryMock).toHaveBeenCalled();
  });

  it('renders charging icon container', () => {
    const { container } = render(<BatteryStatus />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies background styles', () => {
    const { container } = render(<BatteryStatus />);
    const outer = container.firstElementChild;
    expect(outer?.className).toMatch(/bg-\[#[a-f0-9]+\]/);
  });
});
