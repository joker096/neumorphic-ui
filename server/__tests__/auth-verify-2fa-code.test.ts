import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'

// The env has to be in place BEFORE ../db and ../auth are evaluated: db.ts
// reads DB_PATH at module scope and auth.ts signs with JWT_SECRET.
vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing'
  process.env.DB_PATH = process.cwd() + '/data/test-verify-2fa-code.db'
})

import { getDb, closeDb, resetDbForTests } from '../db'
import { createAdminSession, signToken } from '../auth'
import { handleAuthRoute, resetRateLimits } from '../routes/auth'

const TOTP_SECRET = 'JBSWY3DPEHPK3PXP'

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

async function verify(sessionToken: string, code: string, ip: string) {
  const { res, state, done } = makeRes()
  const handled = handleAuthRoute(
    makeReq({ sessionToken, code }, ip),
    res,
    '/api/auth/verify-2fa'
  )
  expect(handled).toBe(true)
  await done
  return state
}

describe('POST /api/auth/verify-2fa error codes', () => {
  beforeAll(() => {
    resetDbForTests()
  })

  beforeEach(() => {
    resetDbForTests()
    resetRateLimits()
  })

  afterAll(() => {
    closeDb()
  })

  it('marks an unusable session token as an expired session', async () => {
    const state = await verify('not-a-real-token', '000000', '10.0.0.21')
    expect(state.status).toBe(401)
    const payload = JSON.parse(state.body) as { error: string; code?: string }
    expect(payload.code).toBe('session_expired')
  })

  it('marks a wrong code as an invalid code', async () => {
    const result = getDb()
      .prepare('INSERT INTO admins (username, password_hash, totp_secret) VALUES (?, ?, ?)')
      .run('verify-admin', 'not-a-real-hash', TOTP_SECRET)
    const adminId = result.lastInsertRowid as number
    const token = signToken({ adminId, username: 'verify-admin' })
    createAdminSession(adminId, token)

    const state = await verify(token, 'not-a-number', '10.0.0.22')
    expect(state.status).toBe(401)
    const payload = JSON.parse(state.body) as { error: string; code?: string }
    expect(payload.code).toBe('invalid_code')
  })
})
