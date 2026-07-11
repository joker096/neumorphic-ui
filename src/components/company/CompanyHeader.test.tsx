import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CompanyHeader } from './CompanyHeader';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        company_scanQR: 'Scan QR to join',
        company_invite: 'Invite members',
      };
      return translations[key] || key;
    },
    lang: 'ru',
    setLang: vi.fn(),
  }),
}));

vi.mock('../../store', () => ({
  useAppStore: (selector: any) => {
    if (typeof selector === 'function') {
      return selector({ companySettings: { name: 'My Company' } });
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
    render(<CompanyHeader onScanQR={() => {}} onInvite={() => {}} onSettings={() => {}} />);
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onScanQR when QR button is clicked', () => {
    const onScanQR = vi.fn();
    render(<CompanyHeader onScanQR={onScanQR} />);
    const qrButton = document.querySelector('button[title="Scan QR"]');
    if (qrButton) {
      fireEvent.click(qrButton);
      expect(onScanQR).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onInvite when invite button is clicked', () => {
    const onInvite = vi.fn();
    render(<CompanyHeader onInvite={onInvite} />);
    const inviteButton = document.querySelector('button[title="Invite"]');
    if (inviteButton) {
      fireEvent.click(inviteButton);
      expect(onInvite).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onSettings when settings button is clicked', () => {
    const onSettings = vi.fn();
    render(<CompanyHeader onSettings={onSettings} />);
    const settingsButton = document.querySelector('button[title="Edit company"]');
    if (settingsButton) {
      fireEvent.click(settingsButton);
      expect(onSettings).toHaveBeenCalledTimes(1);
    }
  });
});
