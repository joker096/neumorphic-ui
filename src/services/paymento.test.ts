import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete (navigator as any).share;
  delete (navigator as any).clipboard;
});

import {
  createPaymentRequest,
  verifyPayment,
  gatewayUrl,
  sharePaymentLink,
  buildPaymentMessage,
} from './paymento';
import { buildGatewayUrl } from '../config/paymento';

function jsonResponse(data: unknown, ok = true, status = 200): void {
  fetchMock.mockResolvedValueOnce({
    ok,
    status,
    text: async () => JSON.stringify(data),
  });
}

describe('createPaymentRequest', () => {
  it('posts input to the backend proxy and returns token with paymentUrl', async () => {
    const input = { amount: '10', currency: 'USD', orderId: 'ord1', description: 'Lunch' };
    jsonResponse({ token: 'tok', paymentUrl: 'https://pay.example/x' });

    const result = await createPaymentRequest(input);

    expect(result).toEqual({ token: 'tok', paymentUrl: 'https://pay.example/x' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/paymento/create',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    );
  });

  it('falls back to the gateway URL when paymentUrl is absent', async () => {
    jsonResponse({ token: 'tok' });

    const result = await createPaymentRequest({
      amount: 10,
      currency: 'USD',
      orderId: 'ord1',
    });

    expect(result.paymentUrl).toBe(buildGatewayUrl('tok'));
  });

  it('rejects with the backend error message on failure', async () => {
    jsonResponse({ error: 'boom' }, false, 400);

    await expect(
      createPaymentRequest({ amount: 10, currency: 'USD', orderId: 'ord1' }),
    ).rejects.toThrow('boom');
  });
});

describe('verifyPayment', () => {
  it('fetches the verify endpoint and normalizes the response', async () => {
    jsonResponse({
      status: '7',
      orderId: 'o1',
      amount: '10',
      currency: 'USD',
    });

    const result = await verifyPayment('tok en');

    expect(result).toEqual({
      status: 7,
      orderId: 'o1',
      amount: 10,
      currency: 'USD',
      raw: { status: '7', orderId: 'o1', amount: '10', currency: 'USD' },
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/paymento/verify/tok%20en');
  });

  it('rejects with the backend error message on failure', async () => {
    jsonResponse({ error: 'bad token' }, false, 404);

    await expect(verifyPayment('tok')).rejects.toThrow('bad token');
  });

  it('rejects with a status message when no error field is present', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => '',
    });

    await expect(verifyPayment('tok')).rejects.toThrow('Verify failed (500)');
  });

  it('does not throw on a non-JSON error body (HTML 502)', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 502,
      text: async () => '<html><body>Bad Gateway</body></html>',
    });

    await expect(verifyPayment('tok')).rejects.toThrow('Verify failed (502)');
  });
});

describe('gatewayUrl', () => {
  it('builds the gateway URL for a token', () => {
    expect(gatewayUrl('tok')).toBe('https://app.paymento.io/gateway?token=tok');
    expect(gatewayUrl('a b')).toBe('https://app.paymento.io/gateway?token=a%20b');
  });
});

describe('sharePaymentLink', () => {
  it('uses navigator.share with optional text prefix', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, writable: true, configurable: true });

    await sharePaymentLink('https://pay.example/x', 'Lunch');

    expect(share).toHaveBeenCalledWith({
      title: 'Payment',
      text: 'Lunch\nhttps://pay.example/x',
      url: 'https://pay.example/x',
    });
  });

  it('shares the bare URL when no text is given', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, writable: true, configurable: true });

    await sharePaymentLink('https://pay.example/x');

    expect(share).toHaveBeenCalledWith({
      title: 'Payment',
      text: 'https://pay.example/x',
      url: 'https://pay.example/x',
    });
  });

  it('falls back to clipboard when share is rejected', async () => {
    const share = vi.fn().mockRejectedValue(new Error('user cancelled'));
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, writable: true, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, writable: true, configurable: true });

    await sharePaymentLink('https://pay.example/x', 'Lunch');

    expect(share).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('Lunch\nhttps://pay.example/x');
  });

  it('uses clipboard directly when navigator.share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, writable: true, configurable: true });

    await sharePaymentLink('https://pay.example/x');

    expect(writeText).toHaveBeenCalledWith('https://pay.example/x');
  });
});

describe('buildPaymentMessage', () => {
  it('builds a payment message with description, amount, and status', () => {
    const msg = buildPaymentMessage({
      token: 'tok',
      paymentUrl: 'https://pay.example/x',
      amount: 10.5,
      currency: 'USD',
      description: 'Lunch',
      status: 2,
    });

    expect(msg).toMatchObject({
      type: 'payment',
      sender: 'me',
      text: 'Lunch',
      status: 'sent',
      silent: false,
      paymentToken: 'tok',
      paymentUrl: 'https://pay.example/x',
      amount: '10.5',
      currency: 'USD',
      description: 'Lunch',
      orderStatus: 2,
    });
    expect(typeof msg.id).toBe('string');
    expect(msg.id).not.toBe('');
    expect(typeof msg.time).toBe('string');
  });

  it('uses amount label when description is absent', () => {
    const msg = buildPaymentMessage({
      token: 'tok',
      paymentUrl: 'https://pay.example/x',
      amount: 10,
      currency: 'USD',
    });

    expect(msg.text).toBe('Payment request · 10 USD');
    expect(msg.amount).toBe('10');
    expect(msg.orderStatus).toBe(0);
  });

  it('uses the bare label and empty fields when amount and description are absent', () => {
    const msg = buildPaymentMessage({ token: 'tok', paymentUrl: 'https://pay.example/x' });

    expect(msg.text).toBe('Payment request');
    expect(msg.amount).toBe('');
    expect(msg.currency).toBe('');
    expect(msg.description).toBe('');
    expect(msg.orderStatus).toBe(0);
  });
});
