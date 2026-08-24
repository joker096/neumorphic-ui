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

// Memory-only: the backend is the source of truth and localStorage is tamperable.
export const createPremiumSlice = (set: any, get: any): PremiumSlice => ({
  premiumEntitlement: { premium: false, plan: null, expiresAt: null },
  refreshPremiumEntitlement: async () => {
    try {
      const pk = await getDevicePublicKey()
      const entitlement = await fetchEntitlement(pk)
      set({ premiumEntitlement: entitlement })
    } catch (e) {
      logError(e, 'refreshPremiumEntitlement')
    }
  },
});
