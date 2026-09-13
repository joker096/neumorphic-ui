import { PAYMENTO_BACKEND_BASE, buildGatewayUrl } from '../config/paymento'
import type {
  PaymentoCreateInput,
  PaymentoCreateResult,
  PaymentoVerifyResult,
} from '../types/paymento'

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let data: any = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = {}
    }
  }
  if (!res.ok) {
    throw new Error((data && (data.error || data.message)) || `Request failed (${res.status})`)
  }
  return data as T
}

// Create a Paymento payment request via our backend proxy (secret stays server-side).
export async function createPaymentRequest(
  input: PaymentoCreateInput,
): Promise<PaymentoCreateResult> {
  const data = await postJson<{ token: string; paymentUrl: string }>(
    `${PAYMENTO_BACKEND_BASE}/create`,
    input,
  )
  return { token: data.token, paymentUrl: data.paymentUrl || buildGatewayUrl(data.token) }
}

// Query the current status of a payment (proxies Paymento verify with server-held secret).
// POST + JSON body (not a URL path segment) keeps the payment token out of access logs.
export async function verifyPayment(token: string): Promise<PaymentoVerifyResult> {
  const res = await fetch(`${PAYMENTO_BACKEND_BASE}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  const text = await res.text()
  let data: any = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = {}
    }
  }
  if (!res.ok) {
    throw new Error(data?.error || `Verify failed (${res.status})`)
  }
  return {
    status: Number(data.status),
    orderId: data.orderId,
    amount: Number(data.amount),
    currency: data.currency,
    raw: data.raw || data,
  }
}

export function gatewayUrl(token: string): string {
  return buildGatewayUrl(token)
}

// Distribute the payment link through the messenger (share sheet / clipboard fallback).
export async function sharePaymentLink(url: string, text?: string): Promise<void> {
  const shareText = text ? `${text}\n${url}` : url
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: 'Payment', text: shareText, url })
      return
    } catch {
      // fall through to clipboard
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(shareText)
  }
}

export interface PaymentMessageInput {
  token: string
  paymentUrl: string
  amount?: string | number
  currency?: string
  description?: string
  status?: number
}

// Build a chat message object of type "payment" that renders inline in a conversation
// (mirrors buildNewMessage shape used by stickers/bot cards).
export function buildPaymentMessage(input: PaymentMessageInput): any {
  const label =
    input.description ||
    (input.amount != null
      ? `Payment request · ${input.amount} ${input.currency || ''}`.trim()
      : 'Payment request')
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'payment',
    sender: 'me',
    text: label,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'sent',
    silent: false,
    paymentToken: input.token,
    paymentUrl: input.paymentUrl,
    amount: input.amount != null ? String(input.amount) : '',
    currency: input.currency || '',
    description: input.description || '',
    orderStatus: typeof input.status === 'number' ? input.status : 0,
  }
}
