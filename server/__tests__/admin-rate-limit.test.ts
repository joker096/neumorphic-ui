import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import http from 'node:http'

// --- Env set BEFORE importing the routes / db (they read env at module load) ---
process.env.JWT_SECRET = 'test-jwt-secret-admin-rate-limit'
process.env.DB_PATH = 'data/test-admin-rate-limit.db'

type RouteHandler = (req: http.IncomingMessage, res: http.ServerResponse, path: string) => boolean

let handleAdsRoute: RouteHandler
let handleStatsRoute: RouteHandler
let adsRateLimiters: { anonymous: { reset: () => void; size: () => number }; admin: { reset: () => void; size: () => number } }
let statsRateLimiters: { anonymous: { reset: () => void; size: () => number }; admin: { reset: () => void; size: () => number } }
let harnessServer: http.Server
let harnessPort = 0

let adminToken = ''
let otherAdminToken = ''

const harnessHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1')
  if (handleAdsRoute(req, res, url.pathname)) return
  if (handleStatsRoute(req, res, url.pathname)) return
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
}

function startServer(handler: (req: http.IncomingMessage, res: http.ServerResponse) => void): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const s = http.createServer(handler)
    s.once('error', reject)
    s.listen(0, '127.0.0.1', () => resolve(s))
  })
}

beforeAll(async () => {
  const adsMod = await import('../routes/ads.js')
  const statsMod = await import('../routes/stats.js')
  handleAdsRoute = adsMod.handleAdsRoute
  handleStatsRoute = statsMod.handleStatsRoute
  adsRateLimiters = adsMod.adsRateLimiters
  statsRateLimiters = statsMod.statsRateLimiters

  const { getDb } = await import('../db.js')
  const authMod = await import('../auth.js')
  const db = getDb()
  db.prepare("INSERT OR IGNORE INTO admins (id, username, password_hash, totp_secret) VALUES (1, 'test', 'x', 'x')").run()
  db.prepare("INSERT OR IGNORE INTO admins (id, username, password_hash, totp_secret) VALUES (2, 'other', 'x', 'x')").run()
  adminToken = authMod.signToken({ adminId: 1, username: 'test' })
  otherAdminToken = authMod.signToken({ adminId: 2, username: 'other' })
  authMod.createAdminSession(1, adminToken)
  authMod.createAdminSession(2, otherAdminToken)

  harnessServer = await startServer(harnessHandler)
  const address = harnessServer.address()
  if (!address || typeof address === 'string' || !address.port) {
    throw new Error(`admin-rate-limit harness: no usable port (${String(address)})`)
  }
  harnessPort = address.port
})

afterAll(async () => {
  const { closeDb, resetDbForTests } = await import('../db')
  resetDbForTests()
  closeDb()
  await new Promise<void>((r) => harnessServer.close(() => r()))
})

beforeEach(() => {
  adsRateLimiters.anonymous.reset()
  adsRateLimiters.admin.reset()
  statsRateLimiters.anonymous.reset()
  statsRateLimiters.admin.reset()
})

const base = () => `http://127.0.0.1:${harnessPort}`
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

/** Spend the anonymous per-IP budget with ad requests. */
async function floodAnonymous(count: number): Promise<number[]> {
  const statuses: number[] = []
  for (let i = 0; i < count; i += 1) {
    const res = await fetch(`${base()}/api/ads/active`)
    statuses.push(res.status)
  }
  return statuses
}

describe('admin endpoints are limited per administrator, not per IP', () => {
  it('limits anonymous traffic per IP', async () => {
    const statuses = await floodAnonymous(51)
    expect(statuses.slice(0, 50).every((s) => s === 200)).toBe(true)
    expect(statuses[50]).toBe(429)
  })

  it('keeps a signed-in admin usable when the anonymous budget of that IP is spent', async () => {
    const statuses = await floodAnonymous(50)
    expect(statuses[49]).toBe(200)
    // The anonymous bucket is now exhausted for this IP.
    const blocked = await fetch(`${base()}/api/ads/active`)
    expect(blocked.status).toBe(429)

    // The operator still gets the panel - their budget is their own.
    const res = await fetch(`${base()}/api/ads`, { headers: bearer(adminToken) })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { ads: unknown[] }
    expect(Array.isArray(body.ads)).toBe(true)
  })

  it('gives every administrator their own budget', async () => {
    const first = await fetch(`${base()}/api/ads`, { headers: bearer(adminToken) })
    const second = await fetch(`${base()}/api/ads`, { headers: bearer(otherAdminToken) })
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(adsRateLimiters.admin.size()).toBe(2)
  })

  it('answers 401 for an anonymous caller of a stats endpoint', async () => {
    const res = await fetch(`${base()}/api/stats/overview`)
    expect(res.status).toBe(401)
  })

  it('serves the stats endpoints to a signed-in admin', async () => {
    const res = await fetch(`${base()}/api/stats/overview`, { headers: bearer(adminToken) })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { onlineNow: number }
    expect(typeof body.onlineNow).toBe('number')
  })
})
