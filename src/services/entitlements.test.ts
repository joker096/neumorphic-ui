import { describe, it, expect, vi, beforeEach } from 'vitest'
import { bufToBase64, getDevicePublicKey, fetchEntitlement } from './entitlements'
import { buildSubscriptionOrderId, PREMIUM_PLANS, getPremiumPlan } from '../config/premium'
import { PLANS } from '../../server/plans'
import { getMasterKeySet } from '../lib/identity/masterKey'
import type { MasterKeySet } from '../lib/identity/masterKey'

// Mirrors server/routes/paymento.ts SUB_ORDER_RE (kept in sync by this test).
const SERVER_ORDER_RE = /^sub:([A-Za-z0-9+/=]{40,64}):([a-z][a-z0-9]{0,15})(?::.+)?$/

vi.mock('../lib/identity/masterKey', () => ({
  getMasterKeySet: vi.fn(),
}))

const samplePkB64 = 'A'.repeat(44)

describe('bufToBase64', () => {
  it('encodes bytes to base64', () => {
    expect(bufToBase64(new Uint8Array([72, 105]))).toBe('SGk=')
  })

  it('produces a 44-char key string for a 32-byte ed25519 public key', () => {
    expect(bufToBase64(new Uint8Array(32))).toHaveLength(44)
  })
})

describe('buildSubscriptionOrderId', () => {
  it('builds sub:<pk>:<planId> without nonce', () => {
    expect(buildSubscriptionOrderId(samplePkB64, 'premium')).toBe(`sub:${samplePkB64}:premium`)
  })

  it('appends nonce when provided', () => {
    expect(buildSubscriptionOrderId(samplePkB64, 'premium90', 'abc123')).toBe(`sub:${samplePkB64}:premium90:abc123`)
  })

  it('matches the server order-id format', () => {
    expect(buildSubscriptionOrderId(samplePkB64, 'premium')).toMatch(SERVER_ORDER_RE)
    expect(buildSubscriptionOrderId(samplePkB64, 'premium90', 'x' /* nonce */)).toMatch(SERVER_ORDER_RE)
  })
})

describe('client plan mirror', () => {
  it('stays in parity with server PLANS', () => {
    expect(Object.keys(PREMIUM_PLANS).sort()).toEqual(Object.keys(PLANS).sort())
    for (const id of Object.keys(PLANS)) {
      expect(PREMIUM_PLANS[id]).toEqual(PLANS[id])
    }
  })

  it('resolves known plans and null for unknown', () => {
    expect(getPremiumPlan('premium')).toEqual(PLANS.premium)
    expect(getPremiumPlan('premium90')).toEqual(PLANS.premium90)
    expect(getPremiumPlan('nope')).toBeNull()
  })
})

describe('getDevicePublicKey', () => {
  it('base64-encodes the ed25519 public key', async () => {
    const keySet: MasterKeySet = {
      seed: new Uint8Array(32),
      aesKey: {} as CryptoKey,
      aesKeyHex: '',
      x25519Secret: new Uint8Array(32),
      x25519Public: new Uint8Array(32),
      ed25519Secret: new Uint8Array(32),
      ed25519Public: new Uint8Array([72, 105]),
    }
    vi.mocked(getMasterKeySet).mockResolvedValueOnce(keySet)
    await expect(getDevicePublicKey()).resolves.toBe('SGk=')
  })
})

describe('fetchEntitlement', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('parses a premium entitlement', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ premium: true, plan: 'premium', expiresAt: 123 }),
    } as unknown as Response)
    await expect(fetchEntitlement(samplePkB64)).resolves.toEqual({
      premium: true,
      plan: 'premium',
      expiresAt: 123,
    })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/entitlement?pk=${encodeURIComponent(samplePkB64)}`),
    )
  })

  it('defaults missing fields', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as unknown as Response)
    await expect(fetchEntitlement(samplePkB64)).resolves.toEqual({
      premium: false,
      plan: null,
      expiresAt: null,
    })
  })

  it('rejects non-2xx responses', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as unknown as Response)
    await expect(fetchEntitlement(samplePkB64)).rejects.toThrow('Entitlement check failed (404)')
  })
})
