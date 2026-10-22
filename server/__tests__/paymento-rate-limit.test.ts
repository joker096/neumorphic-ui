/**
 * Rate limits of the Paymento routes (§3 / §4.2).
 *
 * Before this pass the module kept two private limiters (creation and entitlement
 * lookup) and left the two remaining endpoints - the provider callback and the
 * operator payment list - completely unbounded. All budgets now live in the
 * shared limiter (server/middleware/rateLimit.ts).
 *
 * Contract locked here:
 *   - every endpoint has a budget (create, ipn, list, entitlement, verify);
 *   - the IPN budget is generous (the provider retries) but bounded;
 *   - the operator list has one bucket per administrator, not per IP;
 *   - the budgets are independent of each other.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import http from 'node:http'

// --- Env must be set BEFORE importing the route (module-level constants) ---
process.env.JWT_SECRET = 'test-jwt-secret-paymento-limits'
process.env.PAYMENTO_SECRET_KEY = 'op_secret'
// No gateway key on purpose: /api/paymento/create answers 503 without calling
// out, so the budget test never touches the network.
process.env.PAYMENTO_API_KEY = ''
process.env.DB_PATH = 'data/test-paymento-rate-limit.db'

let handlePaymentoRoute: (req: any, res: any, p: string) => boolean
let harnessServer: http.Server
let harnessPort = 0

const harnessHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1')
  handlePaymentoRoute(req, res, url.pathname)
}

beforeAll(async () => {
  // dynamic import AFTER env is set so module-level constants pick it up
  const mod = await import('../routes/paymento.js')
  handlePaymentoRoute = mod.handlePaymentoRoute

  const { getDb } = await import('../db.js')
  const authMod = await import('../auth.js')
  const db = getDb()
  db
    .prepare("INSERT OR IGNORE INTO admins (id, username, password_hash, totp_secret) VALUES (1, 'admin-a', 'x', 'x')")
    .run()
  db
    .prepare("INSERT OR IGNORE INTO admins (id, username, password_hash, totp_secret) VALUES (2, 'admin-b', 'x', 'x')")
    .run()
  const tokenA = authMod.signToken({ adminId: 1, username: 'admin-a' })
  const tokenB = authMod.signToken({ adminId: 2, username: 'admin-b' })
  authMod.createAdminSession(1, tokenA)
  authMod.createAdminSession(2, tokenB)
  ;(globalThis as any).__tokenA = tokenA
  ;(globalThis as any).__tokenB = tokenB

  harnessServer = http.createServer(harnessHandler)
  await new Promise<void>((r) => harnessServer.listen(0, '127.0.0.1', () => r()))
  harnessPort = (harnessServer.address() as any).port
})

afterAll(async () => {
  const { closeDb, resetDbForTests } = await import('../db')
  resetDbForTests()
  closeDb()
  await new Promise<void>((r) => harnessServer.close(() => r()))
})

const base = () => `http://127.0.0.1:${harnessPort}`
const tokenA = () => (globalThis as any).__tokenA as string
const tokenB = () => (globalThis as any).__tokenB as string

// The harness listens on loopback, which is a trusted proxy, so the forwarded
// header decides the client IP - that is how each test gets its own bucket.
const post = (path: string, ip: string, body = '{}') =>
  fetch(`${base()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body,
  })

const get = (path: string, ip: string, token?: string) =>
  fetch(`${base()}${path}`, {
    headers: {
      'x-forwarded-for': ip,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

describe('Paymento rate limits', () => {
  it(
    'ipn: bounds the provider callback budget per IP',
    async () => {
      const ip = '203.0.113.10'
      for (let i = 0; i < 120; i++) {
        const res = await post('/api/paymento/ipn', ip)
        expect(res.status).not.toBe(429)
      }
      const blocked = await post('/api/paymento/ipn', ip)
      expect(blocked.status).toBe(429)
    },
    30000,
  )

  it(
    'list: bounds the operator budget per administrator, not per IP',
    async () => {
      const ip = '203.0.113.40'
      for (let i = 0; i < 60; i++) {
        const res = await get('/api/paymento/list', ip, tokenA())
        expect(res.status).toBe(200)
      }
      const blocked = await get('/api/paymento/list', ip, tokenA())
      expect(blocked.status).toBe(429)
      // A second operator on the same egress IP keeps its own budget.
      const other = await get('/api/paymento/list', ip, tokenB())
      expect(other.status).toBe(200)
    },
    30000,
  )

  it(
    'list: still refuses an unauthenticated caller',
    async () => {
      const res = await get('/api/paymento/list', '203.0.113.41')
      expect(res.status).toBe(401)
    },
    10000,
  )

  it(
    'entitlement: bounds the public lookup per IP',
    async () => {
      const ip = '203.0.113.20'
      const path = '/api/paymento/entitlement?pk=device-key-1'
      for (let i = 0; i < 30; i++) {
        const res = await get(path, ip)
        expect(res.status).toBe(200)
      }
      const blocked = await get(path, ip)
      expect(blocked.status).toBe(429)
    },
    30000,
  )

  it(
    'create: keeps the 10 per minute budget',
    async () => {
      const ip = '203.0.113.30'
      for (let i = 0; i < 10; i++) {
        const res = await post('/api/paymento/create', ip)
        expect(res.status).not.toBe(429)
      }
      const blocked = await post('/api/paymento/create', ip)
      expect(blocked.status).toBe(429)
    },
    30000,
  )

  it(
    'keeps the endpoint budgets independent of each other',
    async () => {
      // The IPN budget of 203.0.113.10 is exhausted by the first test.
      const res = await get('/api/paymento/entitlement?pk=device-key-1', '203.0.113.10')
      expect(res.status).toBe(200)
    },
    10000,
  )
})
