import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({
  Crown: 'div', FileUp: 'div', Smile: 'div', TrendingUp: 'div', ChevronLeft: 'div', ChevronRight: 'div',
}));
vi.mock('motion/react', () => ({ motion: { div: 'div' } }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));
vi.mock('../ui/Toast', () => ({ toast: vi.fn() }));

const h = vi.hoisted(() => ({
  premium: false as boolean,
  expiresAt: null as string | null,
  refreshPremiumEntitlement: vi.fn(),
  getDevicePublicKey: vi.fn(),
  createPaymentRequest: vi.fn(),
}));

vi.mock('../../store', () => ({
  useAppStore: (selector?: any) =>
    selector ? selector({
      premiumEntitlement: { premium: h.premium, expiresAt: h.expiresAt },
      refreshPremiumEntitlement: h.refreshPremiumEntitlement,
    }) : {},
}));
vi.mock('../../services/entitlements', () => ({ getDevicePublicKey: h.getDevicePublicKey }));
vi.mock('../../services/paymento', () => ({ createPaymentRequest: h.createPaymentRequest }));
vi.mock('../payments/PaymentRequestCard', () => ({
  PaymentRequestCard: vi.fn((props: any) => (
    <div data-testid="payment-card" data-amount={String(props.amount)} data-currency={props.currency}>
      <button onClick={() => props.onStatus?.(7)}>status-paid</button>
    </div>
  )),
}));

import { PremiumSection } from './PremiumSection';
import { toast } from '../ui/Toast';

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

const renderSection = (props: { isDark?: boolean; onBack?: () => void } = {}) =>
  render(<PremiumSection isDark={props.isDark} onBack={props.onBack ?? vi.fn()} />);

describe('PremiumSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.premium = false;
    h.expiresAt = null;
    h.getDevicePublicKey.mockResolvedValue('pubkey');
    h.createPaymentRequest.mockResolvedValue({ token: 'tok1', paymentUrl: 'https://pay/x' });
  });

  it('renders header, status sections and back button', () => {
    renderSection();
    expect(screen.getByRole('button', { name: t('common.back') })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: t('premium.title', 'Premium') })).toBeInTheDocument();
    expect(screen.getByText(t('premium.statusLabel', 'Premium status'))).toBeInTheDocument();
    expect(screen.getByText(t('premium.perksTitle', 'What Premium unlocks'))).toBeInTheDocument();
    expect(screen.getByText(t('premium.plans', 'Plans'))).toBeInTheDocument();
  });

  it('shows Inactive status when not premium', () => {
    renderSection();
    expect(screen.getByText(t('premium.inactive', 'Inactive'))).toBeInTheDocument();
  });

  it('shows Active status with expiry when premium', () => {
    h.premium = true;
    h.expiresAt = '2026-12-31T00:00:00.000Z';
    renderSection();
    expect(screen.getByText(t('premium.active', 'Active'))).toBeInTheDocument();
    expect(screen.getByText(t('premium.expiresAt'))).toBeInTheDocument();
  });

  it('renders all four perks', () => {
    renderSection();
    expect(screen.getByText(t('premium.perkFiles', 'Attachments up to 500 MB'))).toBeInTheDocument();
    expect(screen.getByText(t('premium.perkReactions', 'Extended reaction set'))).toBeInTheDocument();
    expect(screen.getByText(t('premium.perkStickers', 'Full ICQ sticker pack'))).toBeInTheDocument();
    expect(screen.getByText(t('premium.perkCrm', 'CRM deals, tasks and roles'))).toBeInTheDocument();
  });

  it('renders both plan rows', () => {
    renderSection();
    expect(screen.getByText(t('premium.plan30', 'Premium · 30 days'))).toBeInTheDocument();
    expect(screen.getByText(t('premium.plan90', 'Premium · 90 days'))).toBeInTheDocument();
    expect(screen.getAllByText(t('premium.pay'))).toHaveLength(2);
  });

  it('starts payment flow on plan click and shows card', async () => {
    renderSection();
    fireEvent.click(screen.getAllByText(t('premium.pay'))[0]);
    await waitFor(() => expect(h.getDevicePublicKey).toHaveBeenCalled());
    await waitFor(() => expect(h.createPaymentRequest).toHaveBeenCalledWith({
      amount: 5,
      currency: 'USD',
      orderId: 'sub:pubkey:premium',
    }));
    const card = await screen.findByTestId('payment-card');
    expect(card).toHaveAttribute('data-amount', '5');
    expect(card).toHaveAttribute('data-currency', 'USD');
  });

  it('activates premium when payment succeeds', async () => {
    renderSection();
    fireEvent.click(screen.getAllByText(t('premium.pay'))[0]);
    const card = await screen.findByTestId('payment-card');
    fireEvent.click(screen.getByText('status-paid'));
    await waitFor(() => expect(h.refreshPremiumEntitlement).toHaveBeenCalled());
    await waitFor(() => expect(toast).toHaveBeenCalledWith(t('premium.success', 'Premium activated'), 'success'));
    expect(screen.queryByTestId('payment-card')).not.toBeInTheDocument();
  });

  it('shows error toast when payment request fails', async () => {
    h.createPaymentRequest.mockRejectedValue(new Error('boom'));
    renderSection();
    fireEvent.click(screen.getAllByText(t('premium.pay'))[1]);
    await waitFor(() => expect(toast).toHaveBeenCalledWith('boom', 'error'));
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    renderSection({ onBack });
    fireEvent.click(screen.getByRole('button', { name: t('common.back') }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});