import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPremiumSlice } from './premiumSlice'
import { getDevicePublicKey, fetchEntitlement } from '../../services/entitlements'

vi.mock('../../services/entitlements', () => ({
  getDevicePublicKey: vi.fn(),
  fetchEntitlement: vi.fn(),
}))

vi.mock('../../lib/errorHandling', () => ({
  logError: vi.fn(),
}))

const CACHE_KEY = 'premium-entitlement-cache'
let clock = 0

function createTestSlice() {
  let state: any = {}
  const set = (partial: any) => {
    const next = typeof partial === 'function' ? partial(state) : partial
    state = { ...state, ...next }
  }
  const get = () => state
  const slice = createPremiumSlice(set, get)
  state = { ...slice }
  return { slice, get }
}

describe('premiumSlice', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(getDevicePublicKey).mockReset()
    vi.mocked(fetchEntitlement).mockReset()
    vi.mocked(getDevicePublicKey).mockResolvedValue('pk')
    vi.useFakeTimers()
    clock += 120_000
    vi.setSystemTime(new Date(clock))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('uses cached entitlement when present', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ premium: true, plan: 'premium', expiresAt: 123 }))
    const { slice } = createTestSlice()
    expect(slice.premiumEntitlement).toEqual({ premium: true, plan: 'premium', expiresAt: 123 })
  })

  it('ignores invalid cached entitlement', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ premium: 'yes' }))
    const { slice } = createTestSlice()
    expect(slice.premiumEntitlement).toEqual({ premium: false, plan: null, expiresAt: null })
  })

  it('persists successful entitlement refresh', async () => {
    const { slice, get } = createTestSlice()
    vi.mocked(fetchEntitlement).mockResolvedValueOnce({ premium: true, plan: 'premium', expiresAt: 123 })

    await slice.refreshPremiumEntitlement()

    expect(get().premiumEntitlement).toEqual({ premium: true, plan: 'premium', expiresAt: 123 })
    expect(JSON.parse(localStorage.getItem(CACHE_KEY)!)).toEqual({ premium: true, plan: 'premium', expiresAt: 123 })
  })

  it('treats 4xx as authoritative no-premium without backoff', async () => {
    const { slice, get } = createTestSlice()
    const err = new Error('Entitlement check failed (404)')
    ;(err as any).status = 404
    vi.mocked(fetchEntitlement).mockRejectedValueOnce(err)

    await slice.refreshPremiumEntitlement()

    expect(get().premiumEntitlement).toEqual({ premium: false, plan: null, expiresAt: null })
    expect(JSON.parse(localStorage.getItem(CACHE_KEY)!)).toEqual({ premium: false, plan: null, expiresAt: null })

    vi.mocked(fetchEntitlement).mockResolvedValueOnce({ premium: false, plan: null, expiresAt: null })
    await slice.refreshPremiumEntitlement()
    expect(fetchEntitlement).toHaveBeenCalledTimes(2)
  })

  it('keeps cached entitlement and backs off after 5xx', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ premium: true, plan: 'premium', expiresAt: 123 }))
    const { slice, get } = createTestSlice()
    const err = new Error('Entitlement check failed (502)')
    ;(err as any).status = 502
    vi.mocked(fetchEntitlement).mockRejectedValueOnce(err)

    await slice.refreshPremiumEntitlement()

    expect(get().premiumEntitlement).toEqual({ premium: true, plan: 'premium', expiresAt: 123 })
    await slice.refreshPremiumEntitlement()
    expect(fetchEntitlement).toHaveBeenCalledTimes(1)
  })

  it('keeps cached entitlement and backs off after network error', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ premium: true, plan: 'premium', expiresAt: 123 }))
    const { slice, get } = createTestSlice()
    vi.mocked(fetchEntitlement).mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await slice.refreshPremiumEntitlement()

    expect(get().premiumEntitlement).toEqual({ premium: true, plan: 'premium', expiresAt: 123 })
    await slice.refreshPremiumEntitlement()
    expect(fetchEntitlement).toHaveBeenCalledTimes(1)
  })

  it('retries after the backoff window', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ premium: true, plan: 'premium', expiresAt: 123 }))
    const { slice } = createTestSlice()
    const err = new Error('Entitlement check failed (502)')
    ;(err as any).status = 502
    vi.mocked(fetchEntitlement)
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce({ premium: true, plan: 'premium', expiresAt: 123 })

    await slice.refreshPremiumEntitlement()
    clock += 61_000
    vi.setSystemTime(new Date(clock))
    await slice.refreshPremiumEntitlement()

    expect(fetchEntitlement).toHaveBeenCalledTimes(2)
  })
})