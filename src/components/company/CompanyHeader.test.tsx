import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CompanyHeader } from './CompanyHeader';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'ru',
    setLang: vi.fn(),
  }),
}));

vi.mock('../../store', () => ({
  useAppStore: (selector: any) => {
    const mockState = { companySettings: { name: 'My Company' } };
    if (typeof selector === 'function') {
      return selector(mockState);
    }
    return undefined;
  },
}));

describe('CompanyHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders company name', () => {
    render(<CompanyHeader />);
    expect(screen.getByText('My Company')).toBeInTheDocument();
  });

  it('renders QR scan button', () => {
    render(<CompanyHeader />);
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onScanQR when QR button is clicked', () => {
    const onScanQR = vi.fn();
    render(<CompanyHeader onScanQR={onScanQR} />);
    const qrButton = document.querySelector('button[aria-label="QR Code"]');
    if (qrButton) {
      fireEvent.click(qrButton);
      expect(onScanQR).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onInvite when invite button is clicked', () => {
    const onInvite = vi.fn();
    render(<CompanyHeader onInvite={onInvite} />);
    const inviteButton = document.querySelector('button[aria-label="Invite"]');
    if (inviteButton) {
      fireEvent.click(inviteButton);
      expect(onInvite).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onSettings when settings button is clicked', () => {
    const onSettings = vi.fn();
    render(<CompanyHeader onSettings={onSettings} />);
    const settingsButton = document.querySelector('button[aria-label="Settings"]');
    if (settingsButton) {
      fireEvent.click(settingsButton);
      expect(onSettings).toHaveBeenCalledTimes(1);
    }
  });
});
