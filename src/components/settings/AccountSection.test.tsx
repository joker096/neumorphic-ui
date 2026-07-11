import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({ Plus: 'div', Check: 'div', QrCode: 'div', Copy: 'div', Share2: 'div', X: 'div', ChevronLeft: 'div', ChevronRight: 'div' }));

vi.mock('motion/react', () => ({
  motion: { div: 'div' },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('../../hooks/useLocalStorage', () => ({
  useLocalStorage: (key: string, initial: any) => {
    const val = vi.fn();
    return [initial, val];
  },
}));

import { AccountSection } from './AccountSection';

describe('AccountSection', () => {
  it('renders account title', () => {
    render(<AccountSection onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getAllByText('settings.account').length).toBeGreaterThanOrEqual(1);
  });

  it('renders accounts list', () => {
    render(<AccountSection onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('Nexus Terminal')).toBeInTheDocument();
    expect(screen.getByText('Work Node')).toBeInTheDocument();
  });

  it('renders add account button', () => {
    render(<AccountSection onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('settings.addAccount')).toBeInTheDocument();
  });

it('renders share identity section', () => {
    render(<AccountSection onBack={vi.fn()} t={(k: string) => k} />);
    const shareBtn = document.querySelector('[title="settings.shareIdentity"]');
    expect(shareBtn).toBeTruthy();
  });
});
