import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({
  Plus: 'div', ChevronLeft: 'div', ChevronRight: 'div',
}));
vi.mock('motion/react', () => ({ motion: { div: 'div' } }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));
vi.mock('../ui/Toast', () => ({ toast: vi.fn() }));

const h = vi.hoisted(() => ({
  forwardMessage: vi.fn(),
  createPaymentRequest: vi.fn(),
  buildPaymentMessage: vi.fn((payload: any) => ({ type: 'payment', ...payload })),
}));

vi.mock('../../store', () => ({
  useAppStore: { getState: () => ({ forwardMessage: h.forwardMessage }) },
}));
vi.mock('../../services/paymento', () => ({
  createPaymentRequest: h.createPaymentRequest,
  buildPaymentMessage: h.buildPaymentMessage,
}));
vi.mock('../../config/paymento', () => ({
  generateOrderId: () => 'oid1',
  buildGatewayUrl: (token: string) => `https://pay/${token}`,
}));
vi.mock('../payments/PaymentRequestCard', () => ({
  PaymentRequestCard: vi.fn((props: any) => (
    <div data-testid="payment-card" data-amount={props.amount} data-currency={props.currency}>
      <button onClick={() => props.onSendToChat?.()}>send-to-chat</button>
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

import { PaymentRequestsSection } from './PaymentRequestsSection';
import { toast } from '../ui/Toast';

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

const renderSection = (props: { isDark?: boolean; onBack?: () => void } = {}) =>
  render(<PaymentRequestsSection isDark={props.isDark} onBack={props.onBack ?? vi.fn()} />);

describe('PaymentRequestsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.createPaymentRequest.mockResolvedValue({ token: 'tokA', paymentUrl: '' });
  });

  it('renders header, form and back button', () => {
    renderSection();
    expect(screen.getByRole('button', { name: t('common.back') })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: t('payRequests.title', 'Payment Requests') })).toBeInTheDocument();
    expect(screen.getByText(t('payRequests.new', 'New payment request'))).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(t('payRequests.descPlaceholder', 'Description (optional)'))).toBeInTheDocument();
  });

  it('rejects invalid amount with error toast', () => {
    renderSection();
    fireEvent.click(screen.getByLabelText(t('payRequests.create', 'Create payment request')));
    expect(toast).toHaveBeenCalledWith(t('payRequests.invalidAmount', 'Enter a valid amount'), 'error');
    expect(h.createPaymentRequest).not.toHaveBeenCalled();
  });

  it('creates payment request and shows card', async () => {
    renderSection();
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '10.5' } });
    fireEvent.change(screen.getByPlaceholderText(t('payRequests.descPlaceholder', 'Description (optional)')), { target: { value: 'Lunch' } });
    fireEvent.click(screen.getByLabelText(t('payRequests.create', 'Create payment request')));
    await waitFor(() => expect(h.createPaymentRequest).toHaveBeenCalledWith({
      amount: 10.5,
      currency: 'USD',
      orderId: 'oid1',
      description: 'Lunch',
    }));
    const card = await screen.findByTestId('payment-card');
    expect(card).toHaveAttribute('data-amount', '10.5');
    expect(card).toHaveAttribute('data-currency', 'USD');
    await waitFor(() => expect(toast).toHaveBeenCalledWith(t('payRequests.created', 'Payment request created'), 'success'));
    expect((screen.getByPlaceholderText('0.00') as HTMLInputElement).value).toBe('');
  });

  it('uppercases currency input', () => {
    renderSection();
    fireEvent.change(screen.getByDisplayValue('USD'), { target: { value: 'eur' } });
    expect(screen.getByDisplayValue('EUR')).toBeInTheDocument();
  });

  it('sends payment card to chat via picker', async () => {
    renderSection();
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '5' } });
    fireEvent.click(screen.getByLabelText(t('payRequests.create', 'Create payment request')));
    const card = await screen.findByTestId('payment-card');
    fireEvent.click(screen.getByText('send-to-chat'));
    expect(screen.getByTestId('chat-picker')).toHaveAttribute('data-open', 'true');
    fireEvent.click(screen.getByText('pick-chat'));
    await waitFor(() => expect(h.buildPaymentMessage).toHaveBeenCalled());
    expect(h.forwardMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'payment' }), 'chat1');
    await waitFor(() => expect(toast).toHaveBeenCalledWith(t('payRequests.sentToChat', 'Payment card sent to chat'), 'success'));
    expect(screen.getByTestId('chat-picker')).toHaveAttribute('data-open', 'false');
  });

  it('shows error toast when payment creation fails', async () => {
    h.createPaymentRequest.mockRejectedValue(new Error('nope'));
    renderSection();
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '1' } });
    fireEvent.click(screen.getByLabelText(t('payRequests.create', 'Create payment request')));
    await waitFor(() => expect(toast).toHaveBeenCalledWith('nope', 'error'));
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    renderSection({ onBack });
    fireEvent.click(screen.getByRole('button', { name: t('common.back') }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});