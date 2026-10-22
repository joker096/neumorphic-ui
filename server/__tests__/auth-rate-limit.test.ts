import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'

// The env has to be in place BEFORE ../db is evaluated: db.ts reads DB_PATH at
// module scope.
vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing'
  process.env.DB_PATH = process.cwd() + '/data/test-auth-rate-limit.db'
})

import { handleAuthRoute, resetRateLimits, generateCaptchaChallenge } from '../routes/auth'
import { checkRateLimit, cleanupRateLimits } from '../middleware/rateLimit'

const WINDOW_MS = 60 * 1000
const LOCKOUT_MS = 300 * 1000

/** A request with a JSON body, as the login route reads it. */
function makeReq(body: unknown, ip: string): IncomingMessage {
  const stream = Readable.from([JSON.stringify(body)]) as unknown as IncomingMessage
  const req = stream as unknown as Record<string, unknown>
  req.method = 'POST'
  req.headers = { 'content-type': 'application/json' }
  req.socket = { remoteAddress: ip }
  return stream
}

function makeRes() {
  const state = { status: 0, body: '' }
  let resolveDone!: () => void
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve
  })
  const res = {
    writeHead(status: number) {
      state.status = status
      return res
    },
    end(body?: string) {
      state.body = body ?? ''
      resolveDone()
      return res
    },
  } as unknown as ServerResponse
  return { res, state, done }
}

/** A sign-in attempt with a wrong captcha answer: 403, but it spends the budget. */
async function attempt(ip: string, username = 'operator') {
  const { res, state, done } = makeRes()
  const handled = handleAuthRoute(
    makeReq({ username, password: 'secret', captchaSession: 'nope', captchaAnswer: 1 }, ip),
    res,
    '/api/auth/login'
  )
  expect(handled).toBe(true)
  await done
  return state
}

/** A sign-in attempt with a valid captcha: it reaches the per-account budget. */
async function attemptWithCaptcha(ip: string, username: string) {
  const { sessionId, answer } = generateCaptchaChallenge()
  const { res, state, done } = makeRes()
  const handled = handleAuthRoute(
    makeReq({ username, password: 'secret', captchaSession: sessionId, captchaAnswer: answer }, ip),
    res,
    '/api/auth/login'
  )
  expect(handled).toBe(true)
  await done
  return state
}

describe('credential rate limits', () => {
  beforeEach(() => {
    resetRateLimits()
    // Only Date is faked: the limiter reads the clock, while the async
    // machinery of the route (streams, bcrypt) must keep running for real.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    resetRateLimits()
  })

  it('caps the budget of one address', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 6; i += 1) {
      statuses.push((await attempt('10.1.0.1')).status)
    }
    expect(statuses.slice(0, 5)).toEqual([403, 403, 403, 403, 403])
    expect(statuses[5]).toBe(429)
    expect(JSON.parse((await attempt('10.1.0.1')).body).error).toBe('Too many attempts. Try again later.')
  })

  it('keeps the lockout after the window expired', async () => {
    for (let i = 0; i < 5; i += 1) {
      await attempt('10.1.0.2')
    }
    expect((await attempt('10.1.0.2')).status).toBe(429)

    // The window is over, the lockout is not: a brute-force attempt must not
    // simply wait the window out.
    vi.setSystemTime(new Date(Date.now() + WINDOW_MS + 1000))
    const afterWindow = await attempt('10.1.0.2')
    expect(afterWindow.status).toBe(429)
    expect(JSON.parse(afterWindow.body).error).toBe('Too many attempts. Try again later.')
  })

  it('does not let the sweeper drop a locked key', async () => {
    for (let i = 0; i < 5; i += 1) {
      await attempt('10.1.0.3')
    }
    // The rejected attempt is what starts the lockout.
    expect((await attempt('10.1.0.3')).status).toBe(429)
    vi.setSystemTime(new Date(Date.now() + WINDOW_MS + 1000))

    // The window expired, so the sweeper would normally drop the key - but the
    // lockout is still running and must survive it.
    cleanupRateLimits()
    expect((await attempt('10.1.0.3')).status).toBe(429)
  })

  it('releases the budget when the lockout expires', async () => {
    for (let i = 0; i < 5; i += 1) {
      await attempt('10.1.0.4')
    }
    expect((await attempt('10.1.0.4')).status).toBe(429)

    vi.setSystemTime(new Date(Date.now() + LOCKOUT_MS + 1000))
    expect((await attempt('10.1.0.4')).status).toBe(403)
  })

  it('drops the lockout on the test seam', async () => {
    for (let i = 0; i < 5; i += 1) {
      await attempt('10.1.0.5')
    }
    expect((await attempt('10.1.0.5')).status).toBe(429)

    resetRateLimits()
    expect((await attempt('10.1.0.5')).status).toBe(403)
  })

  it('keeps the account budget apart from the address budget', async () => {
    for (let i = 0; i < 5; i += 1) {
      // A valid captcha reaches the per-account budget (an unknown account
      // answers 401, the bucket is spent all the same).
      expect((await attemptWithCaptcha('10.1.0.6', 'target-account')).status).toBe(401)
    }

    // Another address, the same account: the address budget is fresh, the
    // account budget is spent - that is the distributed-botnet guard.
    const sameAccount = await attemptWithCaptcha('10.1.0.7', 'target-account')
    expect(sameAccount.status).toBe(429)
    expect(JSON.parse(sameAccount.body).error).toBe('Too many attempts for this account. Try again later.')

    // A different account from the same address is not affected.
    const otherAccount = await attemptWithCaptcha('10.1.0.7', 'other-account')
    expect(otherAccount.status).toBe(401)
  })
})

describe('shared limiter lockout', () => {
  beforeEach(() => {
    resetRateLimits()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    resetRateLimits()
  })

  it('does not lock a key when no lockout was requested', () => {
    for (let i = 0; i < 3; i += 1) {
      expect(checkRateLimit('plain', { maxRequests: 3 }).allowed).toBe(true)
    }
    expect(checkRateLimit('plain', { maxRequests: 3 }).allowed).toBe(false)

    vi.setSystemTime(new Date(Date.now() + WINDOW_MS + 1000))
    expect(checkRateLimit('plain', { maxRequests: 3 }).allowed).toBe(true)
  })

  it('locks a key for the requested lockout', () => {
    const opts = { maxRequests: 2, windowMs: WINDOW_MS, lockoutMs: LOCKOUT_MS }
    expect(checkRateLimit('locked', opts).allowed).toBe(true)
    expect(checkRateLimit('locked', opts).allowed).toBe(true)
    expect(checkRateLimit('locked', opts).allowed).toBe(false)

    vi.setSystemTime(new Date(Date.now() + WINDOW_MS + 1000))
    expect(checkRateLimit('locked', opts).allowed).toBe(false)

    vi.setSystemTime(new Date(Date.now() + LOCKOUT_MS + 1000))
    expect(checkRateLimit('locked', opts).allowed).toBe(true)
  })
})
