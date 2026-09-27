import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom/vitest';

const verifyPayment = vi.hoisted(() => vi.fn());
const writeText = vi.hoisted(() => vi.fn());

vi.mock('../../services/paymento', () => ({ verifyPayment }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ lang: 'en-US', t: (key: string) => key }),
}));
vi.mock('../ui/Toast', () => ({ toast: vi.fn() }));
vi.mock('lucide-react', () => ({
  ExternalLink: 'div',
  Copy: 'div',
  Check: 'div',
  CheckCircle2: 'div',
  XCircle: 'div',
  Loader2: 'div',
  Clock: 'div',
  Wallet: 'div',
}));

import { PaymentChatBubble } from './PaymentChatBubble';
import { toast } from '../ui/Toast';
import { PaymentoOrderStatus } from '../../types/paymento';

const flushTimers = async (ms: number = 0) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('PaymentChatBubble', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    verifyPayment.mockResolvedValue({
      status: PaymentoOrderStatus.Paid,
      orderId: 'ord1',
      amount: 10,
      currency: 'USD',
      raw: {},
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders payment metadata and paid status', () => {
    const url = 'https://app.paymento.io/gateway?token=tok';
    render(
      <PaymentChatBubble
        msg={{
          paymentUrl: url,
          amount: 10.5,
          currency: 'USD',
          description: 'Lunch',
          orderStatus: PaymentoOrderStatus.Paid,
        }}
      />,
    );

    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText(/\$10\.50/)).toBeInTheDocument();
    expect(screen.getByText(url)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'payments.pay' })).toHaveAttribute('href', url);
    expect(screen.getByRole('button', { name: 'payments.copy' })).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('shows failed, pending, and initialized labels', () => {
    const { unmount } = render(
      <PaymentChatBubble msg={{ orderStatus: PaymentoOrderStatus.Reject }} />,
    );
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    unmount();

    render(<PaymentChatBubble msg={{ orderStatus: PaymentoOrderStatus.Pending }} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();

    unmount();
    render(<PaymentChatBubble msg={{ orderStatus: PaymentoOrderStatus.Initialize }} />);
    expect(screen.getByText('Initialized')).toBeInTheDocument();
  });

  it('polls verification when token is present', async () => {
    render(
      <PaymentChatBubble
        msg={{ paymentToken: 'tok', orderStatus: PaymentoOrderStatus.Initialize }}
      />,
    );

    expect(verifyPayment).not.toHaveBeenCalled();
    await flushTimers(1500);
    expect(verifyPayment).toHaveBeenCalledWith('tok');
    expect(screen.getByText('Paid')).toBeInTheDocument();

    await flushTimers(5000);
    expect(verifyPayment).toHaveBeenCalledTimes(2);
  });

  it('copies link and toasts success', async () => {
    const url = 'https://app.paymento.io/gateway?token=tok';
    render(
      <PaymentChatBubble
        msg={{ paymentUrl: url, orderStatus: PaymentoOrderStatus.Paid }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'payments.copy' }));
    await flushTimers(0);

    expect(writeText).toHaveBeenCalledWith(url);
    expect(toast).toHaveBeenCalledWith('payments.linkCopied', 'success');
    expect(screen.getByRole('button', { name: 'payments.copied' })).toBeInTheDocument();

    await flushTimers(1500);
    expect(screen.getByRole('button', { name: 'payments.copy' })).toBeInTheDocument();
  });
});
