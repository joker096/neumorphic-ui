import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'

// The env has to be in place BEFORE ../db and ../auth are evaluated: db.ts
// reads DB_PATH at module scope and auth.ts signs with JWT_SECRET. The file is
// removed here as well, so every run starts with an empty database (the
// integration store keeps a reference to the connection that was open when it
// was constructed, so the database must not be closed and reopened later).
vi.hoisted(async () => {
  const fs = await import('node:fs')
  process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing'
  const dbPath = process.cwd() + '/data/test-integrations-rate-limit.db'
  process.env.DB_PATH = dbPath
  try {
    fs.unlinkSync(dbPath)
  } catch {
    // The file does not exist yet - nothing to remove.
  }
})

import { getDb } from '../db'
import { createAdminSession, signToken } from '../auth'
import { handleIntegrationsRoute, integrationsRateLimiters } from '../routes/integrations'

const LIST_PATH = '/api/v1/integrations'

function seedAdmin(username: string): number {
  const result = getDb()
    .prepare('INSERT INTO admins (username, password_hash, totp_secret) VALUES (?, ?, ?)')
    .run(username, 'not-a-real-hash', 'JBSWY3DPEHPK3PXP')
  return result.lastInsertRowid as number
}

function adminToken(username: string): string {
  const adminId = seedAdmin(username)
  const token = signToken({ adminId, username })
  createAdminSession(adminId, token)
  return token
}

function makeReq(method: string, path: string, token: string | null, ip: string, body?: unknown): IncomingMessage {
  const stream = Readable.from([body === undefined ? '' : JSON.stringify(body)]) as unknown as IncomingMessage
  const req = stream as unknown as Record<string, unknown>
  req.method = method
  req.url = path
  req.headers = token ? { authorization: `Bearer ${token}` } : {}
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

async function call(
  method: string,
  path: string,
  token: string | null,
  ip: string,
  body?: unknown
): Promise<{ handled: boolean; status: number; body: string }> {
  const { res, state, done } = makeRes()
  const handled = handleIntegrationsRoute(makeReq(method, path, token, ip, body), res, path)
  if (!handled) return { handled, status: 0, body: '' }
  await done
  return { handled, status: state.status, body: state.body }
}

describe('integration endpoints rate limits', () => {
  beforeEach(() => {
    // The database connection stays open (the integration store holds a
    // reference to it), so the rows are cleared instead of the file.
    getDb().prepare('DELETE FROM sessions').run()
    getDb().prepare('DELETE FROM admins').run()
    // The buckets live for the lifetime of the process.
    integrationsRateLimiters.admin.reset()
    integrationsRateLimiters.anonymous.reset()
  })

  it('rejects a request without a session token', async () => {
    const result = await call('GET', LIST_PATH, null, '10.0.0.41')
    expect(result.handled).toBe(true)
    expect(result.status).toBe(401)
  })

  it('answers a signed-in administrator', async () => {
    const token = adminToken('integrations-admin')
    const result = await call('GET', LIST_PATH, token, '10.0.0.42')
    expect(result.status).toBe(200)
  })

  it('limits the requests of one administrator', async () => {
    const token = adminToken('integrations-admin')
    const statuses: number[] = []
    for (let i = 0; i < 121; i += 1) {
      const result = await call('GET', LIST_PATH, token, '10.0.0.43')
      statuses.push(result.status)
    }
    expect(statuses.slice(0, 120).every((s) => s === 200)).toBe(true)
    expect(statuses[120]).toBe(429)
  })

  it('keeps the buckets of two administrators apart', async () => {
    const first = adminToken('first-admin')
    const second = adminToken('second-admin')

    for (let i = 0; i < 121; i += 1) {
      await call('GET', LIST_PATH, first, '10.0.0.44')
    }
    const exhausted = await call('GET', LIST_PATH, first, '10.0.0.44')
    expect(exhausted.status).toBe(429)

    // The second operator shares the address but not the budget.
    const other = await call('GET', LIST_PATH, second, '10.0.0.44')
    expect(other.status).toBe(200)
  })

  it('does not charge the public webhook to the administrator budget', async () => {
    const token = adminToken('integrations-admin')
    for (let i = 0; i < 121; i += 1) {
      await call('GET', LIST_PATH, token, '10.0.0.45')
    }
    const exhausted = await call('GET', LIST_PATH, token, '10.0.0.45')
    expect(exhausted.status).toBe(429)

    // The webhook receiver is throttled per address on its own.
    const webhook = await call('POST', '/api/v1/integrations/webhooks/provider/hook-1', null, '10.0.0.46', {})
    expect(webhook.status).not.toBe(429)
  })
})
