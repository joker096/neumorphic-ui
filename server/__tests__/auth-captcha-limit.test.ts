import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'

// The env has to be in place BEFORE ../db is evaluated: db.ts reads DB_PATH at
// module scope.
vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing'
  process.env.DB_PATH = process.cwd() + '/data/test-captcha-limit.db'
})

import { handleAuthRoute, resetRateLimits } from '../routes/auth'

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

/** Request a challenge (no credentials yet). */
async function requestChallenge(ip: string) {
  const { res, state, done } = makeRes()
  const handled = handleAuthRoute(makeReq({ username: '', password: '' }, ip), res, '/api/auth/login')
  expect(handled).toBe(true)
  await done
  return state
}

/** Try to sign in with a wrong captcha answer (answers 403, never touches the DB). */
async function requestCredentialAttempt(ip: string) {
  const { res, state, done } = makeRes()
  const handled = handleAuthRoute(
    makeReq({ username: 'admin', password: 'secret', captchaSession: 'nope', captchaAnswer: '1' }, ip),
    res,
    '/api/auth/login'
  )
  expect(handled).toBe(true)
  await done
  return state
}

describe('POST /api/auth/login rate limits', () => {
  beforeEach(() => {
    // The limiter map is module level, so the buckets have to be cleared
    // between the cases.
    resetRateLimits()
  })

  it('does not spend the credential budget on captcha challenges', async () => {
    for (let i = 0; i < 10; i += 1) {
      const state = await requestChallenge('10.0.0.10')
      expect(state.status).toBe(200)
      expect(JSON.parse(state.body).needsCaptcha).toBe(true)
    }

    // The credential budget is untouched: the attempt is rejected as a wrong
    // captcha answer, not as a rate limit.
    const attempt = await requestCredentialAttempt('10.0.0.10')
    expect(attempt.status).toBe(403)
  })

  it('caps the captcha bucket on its own', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 22; i += 1) {
      const state = await requestChallenge('10.0.0.11')
      statuses.push(state.status)
    }
    expect(statuses.slice(0, 20).every((s) => s === 200)).toBe(true)
    expect(statuses[20]).toBe(429)
    expect(statuses[21]).toBe(429)
  })

  it('still rate limits real sign-in attempts', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 6; i += 1) {
      const state = await requestCredentialAttempt('10.0.0.12')
      statuses.push(state.status)
    }
    expect(statuses.slice(0, 5)).toEqual([403, 403, 403, 403, 403])
    expect(statuses[5]).toBe(429)
  })

  it('keeps the buckets of two addresses apart', async () => {
    for (let i = 0; i < 10; i += 1) {
      await requestChallenge('10.0.0.13')
    }
    const other = await requestChallenge('10.0.0.14')
    expect(other.status).toBe(200)
  })
})
