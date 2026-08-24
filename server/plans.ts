export interface Plan {
  id: string
  days: number
  price: number
  currency: string
}

// Server-side source of truth for premium plans. The client mirrors this
// in src/config/premium.ts; the amount check in routes/paymento.ts enforces
// the price floor so a tampered orderId cannot buy premium cheap.
export const PLANS: Record<string, Plan> = {
  premium: { id: 'premium', days: 30, price: 5, currency: 'USD' },
  premium90: { id: 'premium90', days: 90, price: 12, currency: 'USD' },
}

export function getPlan(planId: string): Plan | null {
  return PLANS[planId] ?? null
}
