// Client mirror of server/plans.ts (source of truth).
// The server enforces the price floor on create, so a tampered orderId cannot buy premium cheap.

export interface PremiumPlan {
  id: string
  days: number
  price: number
  currency: string
}

export const PREMIUM_PLANS: Record<string, PremiumPlan> = {
  premium: { id: 'premium', days: 30, price: 5, currency: 'USD' },
  premium90: { id: 'premium90', days: 90, price: 12, currency: 'USD' },
}

export function getPremiumPlan(planId: string): PremiumPlan | null {
  return PREMIUM_PLANS[planId] ?? null
}

// Attachment size caps (bytes). Free tier: 50 MB, Premium: 500 MB.
export const PREMIUM_FILE_LIMITS = {
  free: 50 * 1024 * 1024,
  premium: 500 * 1024 * 1024,
}

export function getAttachmentLimit(premium: boolean): number {
  return premium ? PREMIUM_FILE_LIMITS.premium : PREMIUM_FILE_LIMITS.free
}

// Free tier unlocks the first N ICQ animated stickers; Premium unlocks the full pack.
export const ICQ_FREE_STICKER_COUNT = 24

// Order id scheme: sub:<devicePublicKeyB64>:<planId>[:<nonce>]
// Device key binds the subscription to this install; the IPN HMAC is the payment trust anchor.
export const PREMIUM_ORDER_PREFIX = 'sub'

export function buildSubscriptionOrderId(devicePublicKey: string, planId: string, nonce?: string): string {
  return nonce
    ? `${PREMIUM_ORDER_PREFIX}:${devicePublicKey}:${planId}:${nonce}`
    : `${PREMIUM_ORDER_PREFIX}:${devicePublicKey}:${planId}`
}
