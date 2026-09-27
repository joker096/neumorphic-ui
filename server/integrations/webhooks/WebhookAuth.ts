// Integration Hub — webhook authentication primitives (blueprint §37).
//
// The webhook endpoint is unauthenticated by design (providers cannot hold an
// admin session), so the *only* thing standing between the public internet and
// the import pipeline is this file. Rules it enforces:
//
//   1. A shared secret must exist. No secret = no verification possible = reject.
//   2. The signature is checked in constant time over `${timestamp}.${rawBody}`.
//   3. The timestamp must be inside a tolerance window, so a captured request
//      cannot be replayed forever.
//   4. Replay of an already-seen event id is dropped by `ReplayGuard`.
//
// Provider-native signature schemes (AmoCRM, Bitrix24, ...) are delegated to
// the connector; this module covers connectors that have no scheme of their own.
import { createHmac, timingSafeEqual } from 'node:crypto'

/** How far a webhook timestamp may drift from server time. */
export const WEBHOOK_TOLERANCE_MS = 300_000

/** Cap on remembered event ids, so the replay cache cannot grow unbounded. */
export const REPLAY_CACHE_MAX = 5000

/** Replay cache entry lifetime — comfortably above the tolerance window. */
export const REPLAY_TTL_MS = WEBHOOK_TOLERANCE_MS * 2

export type WebhookAuthFailure =
  | 'missing_secret'
  | 'missing_signature'
  | 'missing_timestamp'
  | 'stale_timestamp'
  | 'bad_signature'

/**
 * Not a discriminated union on purpose: this package compiles without
 * `strictNullChecks`, where boolean-literal narrowing does not apply.
 */
export interface WebhookAuthResult {
  ok: boolean
  reason?: WebhookAuthFailure
}

/** Canonical signing string: timestamp, a dot, then the untouched body. */
export function webhookSigningString(timestamp: string, rawBody: string): string {
  return `${timestamp}.${rawBody}`
}

/** HMAC-SHA256 of the signing string, `sha256=<hex>` form. */
export function signHmacWebhook(secret: string, timestamp: string, rawBody: string): string {
  const mac = createHmac('sha256', secret).update(webhookSigningString(timestamp, rawBody)).digest('hex')
  return `sha256=${mac}`
}

/** Constant-time comparison; accepts `sha256=<hex>` or a bare hex digest. */
function secureEqual(a: string, b: string): boolean {
  const norm = (s: string) => (s.startsWith('sha256=') ? s.slice('sha256='.length) : s)
  const expected = Buffer.from(norm(a), 'utf8')
  const provided = Buffer.from(norm(b), 'utf8')
  // timingSafeEqual throws on length mismatch — the length check is not secret.
  if (expected.length === 0 || expected.length !== provided.length) return false
  return timingSafeEqual(expected, provided)
}

/**
 * Normalise a unix timestamp in seconds or milliseconds.
 * Returns `null` for anything that is not a finite, plausible epoch value.
 */
export function parseWebhookTimestamp(value: string | undefined): number | null {
  if (value === undefined || value === null) return null
  const trimmed = String(value).trim()
  if (!trimmed || !/^\d{1,19}$/.test(trimmed)) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n <= 0) return null
  // Values below ~1e11 are seconds (year 5138 in ms terms is 1e13).
  const ms = n < 1e11 ? n * 1000 : n
  return Number.isFinite(ms) ? ms : null
}

export interface VerifyHubSignatureInput {
  secret: string | undefined
  timestamp: string | undefined
  rawBody: string
  signature: string | undefined
  now?: number
}

/**
 * Verify a hub-signed webhook. Fail-closed: every failure mode is an explicit
 * `ok: false` — there is no "no secret, so accept" path.
 */
export function verifyHubSignature(input: VerifyHubSignatureInput): WebhookAuthResult {
  const { secret, timestamp, rawBody, signature } = input
  if (!secret) return { ok: false, reason: 'missing_secret' }
  if (!signature) return { ok: false, reason: 'missing_signature' }

  const ts = parseWebhookTimestamp(timestamp)
  if (ts === null) return { ok: false, reason: 'missing_timestamp' }

  const now = input.now ?? Date.now()
  if (Math.abs(now - ts) > WEBHOOK_TOLERANCE_MS) return { ok: false, reason: 'stale_timestamp' }

  if (!secureEqual(signHmacWebhook(secret, String(timestamp).trim(), rawBody), signature)) {
    return { ok: false, reason: 'bad_signature' }
  }
  return { ok: true }
}

/**
 * Bounded replay cache. `claim` returns true the first time an event id is
 * seen and false for any repeat inside the TTL; expired entries are evicted
 * lazily and the oldest are dropped once the cap is reached.
 */
export class ReplayGuard {
  private seen = new Map<string, number>()

  constructor(
    private ttlMs: number = REPLAY_TTL_MS,
    private max: number = REPLAY_CACHE_MAX,
  ) {}

  /** True when the key is new (and now remembered); false for a replay. */
  claim(key: string, now: number = Date.now()): boolean {
    const expiry = this.seen.get(key)
    if (expiry !== undefined && expiry > now) return false
    this.seen.set(key, now + this.ttlMs)
    if (this.seen.size > this.max) this.evict(now)
    return true
  }

  has(key: string, now: number = Date.now()): boolean {
    const expiry = this.seen.get(key)
    return expiry !== undefined && expiry > now
  }

  /** Drop the shortest-lived entries until back under the cap. */
  private evict(now: number): void {
    for (const [key, expiry] of this.seen) {
      if (expiry <= now) this.seen.delete(key)
    }
    while (this.seen.size > this.max) {
      const oldest = this.seen.keys().next()
      if (oldest.done) break
      this.seen.delete(oldest.value)
    }
  }

  get size(): number {
    return this.seen.size
  }
}
