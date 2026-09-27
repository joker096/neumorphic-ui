import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({
  CreditCard: 'div', Plus: 'div', ArrowUpRight: 'div', ArrowDownLeft: 'div',
  ShieldCheck: 'div', Smartphone: 'div', Loader2: 'div', CheckCircle2: 'div',
  XCircle: 'div', Clock: 'div', ChevronLeft: 'div', ChevronRight: 'div',
}));
vi.mock('motion/react', () => ({ motion: { div: 'div' } }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ lang: 'en-US', t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));
vi.mock('../ui/Toast', () => ({ toast: vi.fn() }));

const h = vi.hoisted(() => ({
  store: {
    transactions: [] as any[],
    walletCurrency: 'USD',
    walletEnabled: true,
    biometricEnabled: true,
    setWalletEnabled: vi.fn(),
    setBiometricEnabled: vi.fn(),
    walletTransactionStart: vi.fn(),
    walletTransactionResolve: vi.fn(),
    forwardMessage: vi.fn(),
  },
  useAppStore: Object.assign(vi.fn((sel: any) => sel(h.store)), { getState: () => h.store }),
  createPaymentRequest: vi.fn(),
  buildPaymentMessage: vi.fn((payload: any) => ({ type: 'payment', ...payload })),
}));

vi.mock('../../store', () => ({
  useAppStore: h.useAppStore,
  selectWalletBalance: (txs: any[]) =>
    txs.filter((x) => x.status === 'success').reduce((a, b) => a + b.amount, 0),
}));
vi.mock('../../services/paymento', () => ({
  createPaymentRequest: h.createPaymentRequest,
  buildPaymentMessage: h.buildPaymentMessage,
}));
vi.mock('../../config/paymento', () => ({
  generateOrderId: () => 'oid1',
  buildGatewayUrl: (token: string) => `https://pay/${token}`,
}));
vi.mock('../../types/paymento', () => ({
  isPaymentSuccessful: (s: number) => s === 7 || s === 8,
}));
vi.mock('../payments/PaymentRequestCard', () => ({
  PaymentRequestCard: vi.fn((props: any) => (
    <div data-testid="payment-card" data-amount={props.amount} data-currency={props.currency} data-send={Boolean(props.onSendToChat)}>
      <button onClick={() => props.onSendToChat?.()}>send-to-chat</button>
      <button onClick={() => props.onStatus?.(7)}>mark-paid</button>
    </div>
  )),
}));
vi.mock('../payments/ChatPickerModal', () => ({
  ChatPickerModal: vi.fn((props: any) => (
    <div data-testid="chat-picker" data-open={String(props.open)}>
      <button onClick={() => props.onPick({ id: 'chat1' })}>pick-chat</button>
    </div>
  )),
}));

import { PaymentsSection } from './PaymentsSection';
import { toast } from '../ui/Toast';

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

const renderSection = (props: { isDark?: boolean; onBack?: () => void } = {}) =>
  render(<PaymentsSection isDark={props.isDark} onBack={props.onBack ?? vi.fn()} />);

describe('PaymentsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.store.transactions = [];
    h.store.walletCurrency = 'USD';
    h.store.walletEnabled = true;
    h.store.biometricEnabled = true;
    h.createPaymentRequest.mockResolvedValue({ token: 'tokA', paymentUrl: '' });
  });

  it('renders header, zero balance and back button', () => {
    renderSection();
    expect(screen.getByRole('button', { name: t('common.back') })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: t('settings.payments', 'Payments & Billing') })).toBeInTheDocument();
    expect(screen.getByText(t('wallet.balance', 'Balance'))).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText(t('wallet.empty', 'No transactions yet'))).toBeInTheDocument();
  });

  it('renders settings section with payment switches', () => {
    renderSection();
    expect(screen.getByRole('switch', { name: t('settings.paymentsEnabled', 'Payments') })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: t('settings.biometricPay', 'Biometric confirmation') })).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles payments switch to disabled and toasts saved', () => {
    renderSection();
    const sw = screen.getByRole('switch', { name: t('settings.paymentsEnabled', 'Payments') });
    fireEvent.click(sw);
    expect(h.store.setWalletEnabled).toHaveBeenCalledWith(false);
    expect(toast).toHaveBeenCalledWith(t('settings.saved', 'Saved'), 'success');
  });

  it('top up creates a real payment request and records a pending deposit', async () => {
    renderSection();
    fireEvent.click(screen.getByLabelText(t('wallet.topUp', 'Top up')));
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '25' } });
    fireEvent.click(screen.getByTestId('wallet-submit'));
    await waitFor(() =>
      expect(h.createPaymentRequest).toHaveBeenCalledWith({
        amount: 25,
        currency: 'USD',
        orderId: 'oid1',
        description: t('wallet.topUp', 'Top up'),
      }),
    );
    expect(h.store.walletTransactionStart).toHaveBeenCalledWith('topup', 25, t('wallet.topUp', 'Top up'), 'tokA');
    const card = await screen.findByTestId('payment-card');
    expect(card).toHaveAttribute('data-amount', '25');
    expect(card).toHaveAttribute('data-send', 'false');
  });

  it('send creates a request and can be forwarded to chat', async () => {
    renderSection();
    fireEvent.click(screen.getByLabelText(t('wallet.send', 'Send')));
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '8' } });
    fireEvent.click(screen.getByTestId('wallet-submit'));
    await waitFor(() => expect(h.store.walletTransactionStart).toHaveBeenCalledWith('send', 8, t('wallet.send', 'Send'), 'tokA'));
    const card = await screen.findByTestId('payment-card');
    expect(card).toHaveAttribute('data-send', 'true');
    fireEvent.click(screen.getByText('send-to-chat'));
    expect(screen.getByTestId('chat-picker')).toHaveAttribute('data-open', 'true');
    fireEvent.click(screen.getByText('pick-chat'));
    await waitFor(() => expect(h.buildPaymentMessage).toHaveBeenCalled());
    expect(h.store.forwardMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'payment' }), 'chat1');
    await waitFor(() => expect(toast).toHaveBeenCalledWith(t('wallet.sentToChat', 'Payment sent to chat'), 'success'));
  });

  it('resolves wallet transaction on paid status', async () => {
    renderSection();
    fireEvent.click(screen.getByLabelText(t('wallet.topUp', 'Top up')));
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('wallet-submit'));
    const card = await screen.findByTestId('payment-card');
    fireEvent.click(screen.getByText('mark-paid'));
    await waitFor(() =>
      expect(h.store.walletTransactionResolve).toHaveBeenCalledWith('tokA', true),
    );
  });

  it('rejects invalid amount with error toast', () => {
    renderSection();
    fireEvent.click(screen.getByLabelText(t('wallet.topUp', 'Top up')));
    fireEvent.click(screen.getByTestId('wallet-submit'));
    expect(toast).toHaveBeenCalledWith(t('wallet.invalidAmount', 'Enter a valid amount'), 'error');
    expect(h.createPaymentRequest).not.toHaveBeenCalled();
  });

  it('blocks opening forms when payments are disabled', () => {
    h.store.walletEnabled = false;
    renderSection();
    fireEvent.click(screen.getByLabelText(t('wallet.topUp', 'Top up')));
    expect(toast).toHaveBeenCalledWith(t('wallet.disabled', 'Payments are disabled'), 'error');
    expect(screen.queryByText(t('wallet.title', 'Wallet'))).toBeInTheDocument();
    expect(h.createPaymentRequest).not.toHaveBeenCalled();
  });

  it('shows error toast when payment creation fails', async () => {
    h.createPaymentRequest.mockRejectedValue(new Error('nope'));
    renderSection();
    fireEvent.click(screen.getByLabelText(t('wallet.send', 'Send')));
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '3' } });
    fireEvent.click(screen.getByTestId('wallet-submit'));
    await waitFor(() => expect(toast).toHaveBeenCalledWith('nope', 'error'));
    expect(h.store.walletTransactionStart).not.toHaveBeenCalled();
  });

  it('lists transactions from store with signed amounts', () => {
    h.store.transactions = [
      { id: '1', type: 'topup', title: 'Top up', amount: 12, date: Date.now(), status: 'success' },
      { id: '2', type: 'send', title: 'Send', amount: -5, date: Date.now(), status: 'pending' },
    ];
    renderSection();
    expect(screen.getByText(t('wallet.transactions', 'Transactions'))).toBeInTheDocument();
    expect(screen.getByText('+$12.00')).toBeInTheDocument();
    expect(screen.getByText('-$5.00')).toBeInTheDocument();
    expect(screen.getByText(t('wallet.pending', 'Pending'))).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    renderSection({ onBack });
    fireEvent.click(screen.getByRole('button', { name: t('common.back') }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
