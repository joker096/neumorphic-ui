import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom/vitest';

const toDataURL = vi.hoisted(() => vi.fn());
const writeText = vi.hoisted(() => vi.fn());
const gatewayUrl = vi.hoisted(() =>
  vi.fn((token: string) => `https://gateway.example?token=${token}`),
);
const verifyPayment = vi.hoisted(() => vi.fn());
const sharePaymentLink = vi.hoisted(() => vi.fn());

vi.mock('qrcode', () => ({ default: { toDataURL } }));
vi.mock('../../services/paymento', () => ({
  gatewayUrl,
  verifyPayment,
  sharePaymentLink,
}));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock('../ui/Toast', () => ({ toast: vi.fn() }));
vi.mock('lucide-react', () => ({
  ExternalLink: 'div',
  Copy: 'div',
  Check: 'div',
  Share2: 'div',
  Send: 'div',
  CheckCircle2: 'div',
  XCircle: 'div',
  Loader2: 'div',
  Clock: 'div',
}));

import { PaymentRequestCard } from './PaymentRequestCard';
import { toast } from '../ui/Toast';
import { PaymentoOrderStatus } from '../../types/paymento';

const flushTimers = async (ms: number = 0) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('PaymentRequestCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    toDataURL.mockResolvedValue('data:image/png;base64,qr');
    gatewayUrl.mockReturnValue('https://gateway.example?token=tok');
    verifyPayment.mockResolvedValue({
      status: PaymentoOrderStatus.Paid,
      orderId: 'ord1',
      amount: 10,
      currency: 'USD',
      raw: {},
    });
    sharePaymentLink.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders QR, payment details, and action controls', async () => {
    render(
      <PaymentRequestCard
        token="tok"
        amount={10.5}
        currency="USD"
        description="Lunch"
        poll={false}
      />,
    );
    await flushTimers(0);

    expect(toDataURL).toHaveBeenCalledWith(
      'https://gateway.example?token=tok',
      { margin: 1, width: 220, color: { dark: '#000000', light: '#ffffff' } },
    );
    expect(screen.getByRole('img', { name: 'payments.qr' })).toHaveAttribute(
      'src',
      'data:image/png;base64,qr',
    );
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText(/10\.5 USD/)).toBeInTheDocument();
    expect(screen.getByText('https://gateway.example?token=tok')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'payments.open' })).toHaveAttribute(
      'href',
      'https://gateway.example?token=tok',
    );
    expect(screen.getByRole('button', { name: 'payments.copy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'payments.share' })).toBeInTheDocument();
    expect(screen.queryByText('Paid')).not.toBeInTheDocument();
  });

  it('does not render send-to-chat button when callback is absent', () => {
    render(<PaymentRequestCard token="tok" poll={false} />);
    expect(
      screen.queryByRole('button', { name: 'payments.sendToChat' }),
    ).not.toBeInTheDocument();
  });

  it('calls onSendToChat when provided', () => {
    const onSendToChat = vi.fn();
    render(<PaymentRequestCard token="tok" poll={false} onSendToChat={onSendToChat} />);

    fireEvent.click(screen.getByRole('button', { name: 'payments.sendToChat' }));

    expect(onSendToChat).toHaveBeenCalledTimes(1);
  });

  it('copies link and toasts success', async () => {
    render(<PaymentRequestCard token="tok" poll={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'payments.copy' }));
    await flushTimers(0);

    expect(writeText).toHaveBeenCalledWith('https://gateway.example?token=tok');
    expect(toast).toHaveBeenCalledWith('payments.linkCopied', 'success');
  });

  it('shares link with description and toasts info', async () => {
    render(<PaymentRequestCard token="tok" description="Lunch" poll={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'payments.share' }));
    await flushTimers(0);

    expect(sharePaymentLink).toHaveBeenCalledWith(
      'https://gateway.example?token=tok',
      'Lunch',
    );
    expect(toast).toHaveBeenCalledWith('payments.linkShared', 'info');
  });

  it('shares link with fallback title when description is absent', async () => {
    render(<PaymentRequestCard token="tok" poll={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'payments.share' }));
    await flushTimers(0);

    expect(sharePaymentLink).toHaveBeenCalledWith(
      'https://gateway.example?token=tok',
      'payments.completePayment',
    );
  });

  it('polls and stops after successful status', async () => {
    const onStatus = vi.fn();
    render(<PaymentRequestCard token="tok" poll onStatus={onStatus} />);

    expect(verifyPayment).not.toHaveBeenCalled();
    await flushTimers(1500);
    expect(verifyPayment).toHaveBeenCalledWith('tok');
    expect(onStatus).toHaveBeenCalledWith(PaymentoOrderStatus.Paid);
    expect(screen.getByText('Paid')).toBeInTheDocument();

    await flushTimers(5000);
    expect(verifyPayment).toHaveBeenCalledTimes(1);
  });

  it('polls and stops after failed status', async () => {
    verifyPayment.mockResolvedValue({
      status: PaymentoOrderStatus.Reject,
      orderId: 'ord1',
      amount: 10,
      currency: 'USD',
      raw: {},
    });
    render(<PaymentRequestCard token="tok" poll />);

    await flushTimers(1500);
    expect(screen.getByText('Rejected')).toBeInTheDocument();

    await flushTimers(5000);
    expect(verifyPayment).toHaveBeenCalledTimes(1);
  });

  it('continues polling while status is pending', async () => {
    verifyPayment
      .mockResolvedValueOnce({
        status: PaymentoOrderStatus.Pending,
        orderId: 'ord1',
        amount: 10,
        currency: 'USD',
        raw: {},
      })
      .mockResolvedValueOnce({
        status: PaymentoOrderStatus.Paid,
        orderId: 'ord1',
        amount: 10,
        currency: 'USD',
        raw: {},
      });
    render(<PaymentRequestCard token="tok" poll />);

    await flushTimers(1500);
    expect(verifyPayment).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Pending')).toBeInTheDocument();

    await flushTimers(5000);
    expect(verifyPayment).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('does not poll when poll is false', async () => {
    render(<PaymentRequestCard token="tok" poll={false} />);

    await flushTimers(1500);

    expect(verifyPayment).not.toHaveBeenCalled();
  });
});
