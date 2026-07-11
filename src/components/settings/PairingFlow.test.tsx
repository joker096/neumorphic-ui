import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const mockStore = { pairingQrData: '', setPairingQrData: vi.fn() };

vi.mock('lucide-react', () => ({ ChevronLeft: 'div', QrCode: 'div', Camera: 'div', Smartphone: 'div', Check: 'div', X: 'div' }));

vi.mock('motion/react', () => ({
  motion: { div: 'div' },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('../../store', () => ({
  useAppStore: (selector?: any) => selector ? selector(mockStore) : mockStore,
}));

import { PairingFlow } from './PairingFlow';

describe('PairingFlow', () => {
  it('renders subview title', () => {
    render(<PairingFlow isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('settings.pairDevice')).toBeInTheDocument();
  });

  it('renders host and join buttons initially', () => {
    render(<PairingFlow isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('settings.hostDevice')).toBeInTheDocument();
    expect(screen.getByText('settings.joinDevice')).toBeInTheDocument();
  });

  it('shows host mode when host button clicked', () => {
    render(<PairingFlow isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    fireEvent.click(screen.getByText('settings.hostDevice'));
    expect(screen.getByText('settings.scanWithNewDevice')).toBeInTheDocument();
  });

  it('shows join mode when join button clicked', () => {
    render(<PairingFlow isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    fireEvent.click(screen.getByText('settings.joinDevice'));
    expect(screen.getByText('settings.scanOtherDevice')).toBeInTheDocument();
  });
});
