import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { OfflineBanner } from './OfflineBanner';

const t = (k: string, f?: string) => f ?? k;

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value });
}

afterEach(() => {
  setOnline(true);
  cleanup();
});

describe('OfflineBanner', () => {
  it('is hidden while online', () => {
    setOnline(true);
    render(<OfflineBanner t={t} />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('shows offline banner with last-synced time when offline', () => {
    setOnline(false);
    render(<OfflineBanner t={t} />);
    expect(screen.getByRole('status')).toHaveTextContent('Offline');
    expect(screen.getByRole('status')).toHaveTextContent('Last synced');
  });

  it('hides after the online event', () => {
    setOnline(false);
    render(<OfflineBanner t={t} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    setOnline(true);
    fireEvent(window, new Event('online'));
    expect(screen.queryByRole('status')).toBeNull();
  });
});
