// Paymento gateway integration configuration.
// Merchant credentials live server-side only (PAYMENTO_API_KEY / PAYMENTO_SECRET_KEY env).

export const PAYMENTO_GATEWAY_URL = 'https://app.paymento.io/gateway'

// Client talks to our own backend proxy (keeps the merchant secret server-side).
export const PAYMENTO_BACKEND_BASE = '/api/paymento'

// The proxy performs a third-party gateway round-trip, so it gets a longer
// ceiling than plain API calls — but still bounded (§4.2).
export const PAYMENT_REQUEST_TIMEOUT_MS = 20_000
export const ENTITLEMENT_TIMEOUT_MS = 10_000

export function buildGatewayUrl(token: string): string {
  return `${PAYMENTO_GATEWAY_URL}?token=${encodeURIComponent(token)}`
}

// Order id generation for client-initiated payments.
export function generateOrderId(prefix = 'ord'): string {
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  return `${prefix}-${Date.now().toString(36)}-${rand}`
}
