import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'

// The env has to be in place BEFORE ../db and ../auth are evaluated: db.ts
// reads DB_PATH at module scope and auth.ts signs with JWT_SECRET.
vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing'
  process.env.DB_PATH = process.cwd() + '/data/test-reset-2fa.db'
})

import { getDb, closeDb, resetDbForTests } from '../db'
import { createAdminSession, signToken } from '../auth'
import { handleAuthRoute, resetRateLimits } from '../routes/auth'

const OLD_SECRET = 'JBSWY3DPEHPK3PXP'

/** A session row that is never used for authentication (only for cleanup checks). */
function insertSessionRow(adminId: number, token: string) {
  getDb()
    .prepare('INSERT INTO sessions (admin_id, token, expires_at) VALUES (?, ?, ?)')
    .run(adminId, token, new Date(Date.now() + 60 * 60 * 1000).toISOString())
}

function makeReq(token: string | null, ip: string): IncomingMessage {
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  return { method: 'POST', headers, socket: { remoteAddress: ip } } as unknown as IncomingMessage
}

function makeRes() {
  const state = { status: 0, body: '' }
  const res = {
    writeHead(status: number) {
      state.status = status
      return res
    },
    end(body?: string) {
      state.body = body ?? ''
      return res
    },
  } as unknown as ServerResponse
  return { res, state }
}

function seedAdmin(username: string): number {
  const result = getDb()
    .prepare('INSERT INTO admins (username, password_hash, totp_secret) VALUES (?, ?, ?)')
    .run(username, 'not-a-real-hash', OLD_SECRET)
  return result.lastInsertRowid as number
}

describe('POST /api/auth/reset-2fa', () => {
  beforeAll(() => {
    resetDbForTests()
  })

  beforeEach(() => {
    resetDbForTests()
    // The rate-limit map is module level and the admin ids restart at 1 after a
    // database reset, so the buckets have to be cleared between the cases.
    resetRateLimits()
  })

  afterAll(() => {
    closeDb()
  })

  it('rejects a request without a session token', () => {
    const { res, state } = makeRes()
    const handled = handleAuthRoute(makeReq(null, '10.0.0.9'), res, '/api/auth/reset-2fa')
    expect(handled).toBe(true)
    expect(state.status).toBe(401)
  })

  it('rotates the secret and drops the other sessions of that admin', () => {
    const adminId = seedAdmin('reset-admin')
    const token = signToken({ adminId, username: 'reset-admin' })
    createAdminSession(adminId, token)
    insertSessionRow(adminId, 'other-token')

    const { res, state } = makeRes()
    const handled = handleAuthRoute(makeReq(token, '10.0.0.1'), res, '/api/auth/reset-2fa')
    expect(handled).toBe(true)
    expect(state.status).toBe(200)

    const payload = JSON.parse(state.body) as { secret: string; uri: string }
    expect(payload.secret).toBeTruthy()
    expect(payload.uri).toContain('otpauth://')

    const row = getDb().prepare('SELECT totp_secret FROM admins WHERE id = ?').get(adminId) as {
      totp_secret: string
    }
    expect(row.totp_secret).toBe(payload.secret)
    expect(row.totp_secret).not.toBe(OLD_SECRET)

    const sessions = getDb()
      .prepare('SELECT token FROM sessions WHERE admin_id = ?')
      .all(adminId) as Array<{ token: string }>
    expect(sessions.map((s) => s.token)).toEqual([token])
  })

  it('rate limits the resets per administrator', () => {
    const adminId = seedAdmin('limit-admin')
    const token = signToken({ adminId, username: 'limit-admin' })
    createAdminSession(adminId, token)

    const statuses: number[] = []
    for (let i = 0; i < 6; i += 1) {
      const { res, state } = makeRes()
      handleAuthRoute(makeReq(token, '10.0.0.2'), res, '/api/auth/reset-2fa')
      statuses.push(state.status)
    }
    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200])
    expect(statuses[5]).toBe(429)
  })

  it('does not let one administrator exhaust the budget of another', () => {
    const firstId = seedAdmin('first-admin')
    const firstToken = signToken({ adminId: firstId, username: 'first-admin' })
    createAdminSession(firstId, firstToken)
    const secondId = seedAdmin('second-admin')
    const secondToken = signToken({ adminId: secondId, username: 'second-admin' })
    createAdminSession(secondId, secondToken)

    for (let i = 0; i < 6; i += 1) {
      const { res } = makeRes()
      handleAuthRoute(makeReq(firstToken, '10.0.0.3'), res, '/api/auth/reset-2fa')
    }

    // The second operator shares the address but not the budget.
    const { res, state } = makeRes()
    handleAuthRoute(makeReq(secondToken, '10.0.0.3'), res, '/api/auth/reset-2fa')
    expect(state.status).toBe(200)
  })
})
