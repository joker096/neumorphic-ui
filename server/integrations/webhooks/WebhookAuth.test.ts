import { describe, it, expect } from 'vitest'
import {
  ReplayGuard, WEBHOOK_TOLERANCE_MS, parseWebhookTimestamp, signHmacWebhook,
  verifyHubSignature, webhookSigningString, type VerifyHubSignatureInput,
} from './WebhookAuth.js'

const SECRET = 'whsec_secret'
const BODY = '{"hello":"world"}'
const now = 1_700_000_000_000

describe('verifyHubSignature', () => {
  const ts = String(Math.floor(now / 1000))

  it('accepts a signature over `${timestamp}.${rawBody}`', () => {
    expect(verifyHubSignature({
      secret: SECRET, timestamp: ts, rawBody: BODY, signature: signHmacWebhook(SECRET, ts, BODY), now,
    })).toEqual({ ok: true })
  })

  it('accepts a bare hex digest without the sha256= prefix', () => {
    const sig = signHmacWebhook(SECRET, ts, BODY).replace('sha256=', '')
    expect(verifyHubSignature({ secret: SECRET, timestamp: ts, rawBody: BODY, signature: sig, now })).toEqual({ ok: true })
  })

  it('signs the exact bytes — whitespace in the body changes the signature', () => {
    const sig = signHmacWebhook(SECRET, ts, BODY)
    const res = verifyHubSignature({ secret: SECRET, timestamp: ts, rawBody: `${BODY} `, signature: sig, now })
    expect(res).toEqual({ ok: false, reason: 'bad_signature' })
  })

  it.each<[string, Omit<VerifyHubSignatureInput, 'now'>, string]>([
    ['no secret', { secret: undefined, timestamp: ts, rawBody: BODY, signature: 'x' }, 'missing_secret'],
    ['no signature', { secret: SECRET, timestamp: ts, rawBody: BODY, signature: undefined }, 'missing_signature'],
    ['no timestamp', { secret: SECRET, timestamp: undefined, rawBody: BODY, signature: 'x' }, 'missing_timestamp'],
    ['garbage timestamp', { secret: SECRET, timestamp: 'not-a-time', rawBody: BODY, signature: 'x' }, 'missing_timestamp'],
    ['empty signature', { secret: SECRET, timestamp: ts, rawBody: BODY, signature: '' }, 'missing_signature'],
  ])('fails closed on %s', (_label, input, reason) => {
    expect(verifyHubSignature({ ...input, now })).toEqual({ ok: false, reason })
  })

  it('rejects a signature for a different body', () => {
    const sig = signHmacWebhook(SECRET, ts, BODY)
    expect(verifyHubSignature({ secret: SECRET, timestamp: ts, rawBody: '{"hello":"there"}', signature: sig, now }))
      .toEqual({ ok: false, reason: 'bad_signature' })
  })

  it('rejects a truncated signature of the right shape', () => {
    expect(verifyHubSignature({ secret: SECRET, timestamp: ts, rawBody: BODY, signature: 'sha256=abcd', now }))
      .toEqual({ ok: false, reason: 'bad_signature' })
  })

  it('accepts timestamps inside the window and rejects ones outside it', () => {
    const inside = String(Math.floor((now - WEBHOOK_TOLERANCE_MS + 1000) / 1000))
    const outside = String(Math.floor((now - WEBHOOK_TOLERANCE_MS - 60_000) / 1000))
    const sigInside = signHmacWebhook(SECRET, inside, BODY)
    expect(verifyHubSignature({ secret: SECRET, timestamp: inside, rawBody: BODY, signature: sigInside, now }).ok).toBe(true)
    expect(verifyHubSignature({
      secret: SECRET, timestamp: outside, rawBody: BODY, signature: sigInside, now,
    })).toEqual({ ok: false, reason: 'stale_timestamp' })
  })
})

describe('parseWebhookTimestamp', () => {
  it('reads unix seconds and milliseconds', () => {
    expect(parseWebhookTimestamp('1700000000')).toBe(1_700_000_000_000)
    expect(parseWebhookTimestamp('1700000000000')).toBe(1_700_000_000_000)
  })

  it('tolerates surrounding whitespace', () => {
    expect(parseWebhookTimestamp(' 1700000000 ')).toBe(1_700_000_000_000)
  })

  it.each([[''], ['abc'], ['-1'], ['1.5'], ['1e9'], ['0'], [undefined]])('rejects %s', (v) => {
    expect(parseWebhookTimestamp(v as string | undefined)).toBeNull()
  })
})

describe('ReplayGuard', () => {
  it('claims a key once and reports repeats', () => {
    const g = new ReplayGuard()
    expect(g.claim('e1', now)).toBe(true)
    expect(g.claim('e1', now + 1000)).toBe(false)
    expect(g.has('e1', now + 1000)).toBe(true)
  })

  it('forgets a key after the TTL so late retries are ingested again', () => {
    const g = new ReplayGuard(1000)
    expect(g.claim('e1', now)).toBe(true)
    expect(g.has('e1', now + 999)).toBe(true)
    expect(g.has('e1', now + 1001)).toBe(false)
    expect(g.claim('e1', now + 1001)).toBe(true)
  })

  it('stays bounded under a flood of unique ids', () => {
    const g = new ReplayGuard(60_000, 100)
    for (let i = 0; i < 1000; i++) g.claim(`e${i}`, now)
    expect(g.size).toBeLessThanOrEqual(100)
  })

  it('evicts expired entries before dropping live ones', () => {
    const g = new ReplayGuard(1000, 10)
    for (let i = 0; i < 10; i++) g.claim(`old${i}`, now)
    for (let i = 0; i < 20; i++) g.claim(`new${i}`, now + 2000)
    expect(g.has('old0', now + 2000)).toBe(false)
    expect(g.size).toBeLessThanOrEqual(10)
  })
})

describe('webhookSigningString', () => {
  it('is timestamp, dot, body', () => {
    expect(webhookSigningString('123', 'abc')).toBe('123.abc')
  })
})
