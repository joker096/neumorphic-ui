import { getDevicePublicKey, fetchEntitlement } from '../../services/entitlements'
import { logError } from '../../lib/errorHandling'

export interface PremiumEntitlement {
  premium: boolean
  plan: string | null
  expiresAt: number | null
}

export interface PremiumSlice {
  premiumEntitlement: PremiumEntitlement;
  refreshPremiumEntitlement: () => Promise<void>;
}

// The backend remains the source of truth, but a last successful entitlement is cached
// so a transient 5xx/network outage does not silently revoke premium UI.
const ENTITLEMENT_CACHE_KEY = 'premium-entitlement-cache'
const RETRY_BACKOFF_MS = 60_000

let lastFailureAt = 0

const NO_PREMIUM: PremiumEntitlement = { premium: false, plan: null, expiresAt: null }

function readCachedEntitlement(): PremiumEntitlement | null {
  try {
    const raw = localStorage.getItem(ENTITLEMENT_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PremiumEntitlement>
    if (typeof parsed.premium !== 'boolean') return null
    return {
      premium: parsed.premium,
      plan: typeof parsed.plan === 'string' ? parsed.plan : null,
      expiresAt: typeof parsed.expiresAt === 'number' ? parsed.expiresAt : null,
    }
  } catch {
    return null
  }
}

function writeCachedEntitlement(entitlement: PremiumEntitlement): void {
  try {
    localStorage.setItem(ENTITLEMENT_CACHE_KEY, JSON.stringify(entitlement))
  } catch {
    // Storage may be unavailable; entitlement remains in memory only.
  }
}

export const createPremiumSlice = (set: any, get: any): PremiumSlice => ({
  premiumEntitlement: readCachedEntitlement() ?? NO_PREMIUM,
  refreshPremiumEntitlement: async () => {
    if (lastFailureAt > 0 && Date.now() - lastFailureAt < RETRY_BACKOFF_MS) return

    let pk: string
    try {
      pk = await getDevicePublicKey()
    } catch (e) {
      logError(e, 'getDevicePublicKey')
      return
    }

    try {
      const entitlement = await fetchEntitlement(pk)
      lastFailureAt = 0
      writeCachedEntitlement(entitlement)
      set({ premiumEntitlement: entitlement })
    } catch (e) {
      logError(e, 'refreshPremiumEntitlement')
      const status = (e as Error & { status?: number }).status
      if (status === undefined || status >= 500) {
        lastFailureAt = Date.now()
      } else {
        writeCachedEntitlement(NO_PREMIUM)
        set({ premiumEntitlement: NO_PREMIUM })
      }
    }
  },
});
