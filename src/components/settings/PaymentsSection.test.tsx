import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({
  CreditCard: 'div', Wallet: 'div', Plus: 'div', ArrowUpRight: 'div', ArrowDownLeft: 'div',
  Receipt: 'div', ShieldCheck: 'div', Smartphone: 'div', ChevronLeft: 'div', ChevronRight: 'div',
}));
vi.mock('motion/react', () => ({ motion: { div: 'div' } }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));
vi.mock('../ui/Toast', () => ({ toast: vi.fn() }));

import { PaymentsSection } from './PaymentsSection';
import { toast } from '../ui/Toast';

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

const renderSection = (props: { isDark?: boolean; onBack?: () => void } = {}) =>
  render(<PaymentsSection isDark={props.isDark} onBack={props.onBack ?? vi.fn()} />);

describe('PaymentsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header, wallet balance and back button', () => {
    renderSection();
    expect(screen.getByRole('button', { name: t('common.back') })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: t('settings.payments', 'Payments & Billing') })).toBeInTheDocument();
    expect(screen.getByText(t('settings.balance', 'Balance'))).toBeInTheDocument();
    expect(screen.getByText('$128.40')).toBeInTheDocument();
  });

  it('renders settings section with payment switches and security row', () => {
    renderSection();
    expect(screen.getByText(t('settings.paymentSettings', 'Settings'))).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: t('settings.paymentsEnabled', 'Payments') })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: t('settings.biometricPay', 'Biometric confirmation') })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText(t('settings.paymentSecurity', 'Security'))).toBeInTheDocument();
  });

  it('toggles payments switch and toasts saved', () => {
    renderSection();
    const sw = screen.getByRole('switch', { name: t('settings.paymentsEnabled', 'Payments') });
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(toast).toHaveBeenCalledWith(t('settings.saved', 'Saved'), 'success');
  });

  it('toggles biometric switch without toast', () => {
    renderSection();
    const sw = screen.getByRole('switch', { name: t('settings.biometricPay', 'Biometric confirmation') });
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(toast).not.toHaveBeenCalled();
  });

  it('top up button toasts success', () => {
    renderSection();
    fireEvent.click(screen.getByLabelText(t('settings.topUpBtn', 'Top up')));
    expect(toast).toHaveBeenCalledWith(t('settings.topUp', 'Top up started'), 'success');
  });

  it('send button toasts info', () => {
    renderSection();
    fireEvent.click(screen.getByLabelText(t('settings.sendBtn', 'Send')));
    expect(toast).toHaveBeenCalledWith(t('settings.sendStarted', 'Send started'), 'info');
  });

  it('renders transactions with signed amounts', () => {
    renderSection();
    expect(screen.getByText('Coffee Shop')).toBeInTheDocument();
    expect(screen.getByText('-4.50')).toBeInTheDocument();
    expect(screen.getByText('Refund · Marketplace')).toBeInTheDocument();
    expect(screen.getByText('+12.00')).toBeInTheDocument();
    expect(screen.getByText('Transfer to Mom')).toBeInTheDocument();
    expect(screen.getByText('-20.00')).toBeInTheDocument();
    expect(screen.getByText('2026-08-12')).toBeInTheDocument();
  });

  it('receipts button toasts info', () => {
    renderSection();
    fireEvent.click(screen.getByLabelText(t('settings.viewAllReceipts', 'View all receipts')));
    expect(toast).toHaveBeenCalledWith(t('settings.receiptOpen', 'Opening receipts…'), 'info');
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    renderSection({ onBack });
    fireEvent.click(screen.getByRole('button', { name: t('common.back') }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});