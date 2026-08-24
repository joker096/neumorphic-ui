// Paymento gateway integration configuration.
// Merchant credentials live server-side only (PAYMENTO_API_KEY / PAYMENTO_SECRET_KEY env).

const ENV_API_URL = (import.meta.env.VITE_PAYMENTO_API_URL as string | undefined) || ''
export const PAYMENTO_API_URL = (ENV_API_URL || 'https://api.paymento.io').replace(/\/+$/, '')

export const PAYMENTO_GATEWAY_URL = 'https://app.paymento.io/gateway'

// Client talks to our own backend proxy (keeps the merchant secret server-side).
export const PAYMENTO_BACKEND_BASE = '/api/paymento'

// Paymento API paths (adjust here if the gateway version changes).
export const PAYMENTO_CREATE_PATH = '/v1/payment/request'
export const PAYMENTO_VERIFY_PATH = '/v1/payment/verify'

export function buildGatewayUrl(token: string): string {
  return `${PAYMENTO_GATEWAY_URL}?token=${encodeURIComponent(token)}`
}

// Order id generation for client-initiated payments.
export function generateOrderId(prefix = 'ord'): string {
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  return `${prefix}-${Date.now().toString(36)}-${rand}`
}
