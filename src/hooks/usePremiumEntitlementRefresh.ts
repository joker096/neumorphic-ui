import { useEffect, useRef } from 'react'
import { useAppStore } from '../store'

// Suppresses focus-event bursts right after app start (main.tsx already fetched at bootstrap).
export const PREMIUM_REFRESH_MIN_INTERVAL_MS = 30_000

/**
 * Keeps the premium entitlement fresh across app-lifecycle transitions:
 * refreshes on visibility return (tab/app foreground) and window focus.
 * An expired entitlement is re-fetched immediately, ignoring the throttle.
 */
export function usePremiumEntitlementRefresh(): void {
  const lastFetchRef = useRef<number>(Date.now())

  useEffect(() => {
    const refresh = (force: boolean) => {
      const now = Date.now()
      const { premiumEntitlement, refreshPremiumEntitlement } = useAppStore.getState()
      const expired =
        premiumEntitlement.expiresAt !== null && premiumEntitlement.expiresAt < now
      if (!force && !expired && now - lastFetchRef.current < PREMIUM_REFRESH_MIN_INTERVAL_MS) return
      lastFetchRef.current = now
      void refreshPremiumEntitlement()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) refresh(false)
    }
    const handleFocus = () => refresh(false)

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])
}
