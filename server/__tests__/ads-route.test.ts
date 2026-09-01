import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import http from 'node:http'

// --- Env set BEFORE importing route/db (they read env at module load) ---
process.env.JWT_SECRET = 'test-jwt-secret-ads-route'
process.env.DB_PATH = 'data/test-ads-route.db'

const harnessHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1')
  handleAdsRoute(req, res, url.pathname)
}

let handleAdsRoute: (req: any, res: any, p: string) => boolean
let harnessServer: http.Server
let harnessPort = 0

function startServer(handler: (req: http.IncomingMessage, res: http.ServerResponse) => void): Promise<http.Server> {
  return new Promise((resolve) => {
    const s = http.createServer(handler)
    s.listen(0, '127.0.0.1', () => resolve(s))
  })
}

beforeAll(async () => {
  const mod = await import('../routes/ads.js')
  handleAdsRoute = mod.handleAdsRoute

  // Mint a valid admin session token (create/update/list require auth).
  const { getDb } = await import('../db.js')
  const authMod = await import('../auth.js')
  getDb()
    .prepare("INSERT OR IGNORE INTO admins (id, username, password_hash, totp_secret) VALUES (1, 'test', 'x', 'x')")
    .run()
  const adminToken = authMod.signToken({ adminId: 1, username: 'test' })
  authMod.createAdminSession(1, adminToken)
  ;(globalThis as any).__adminToken = adminToken

  harnessServer = await startServer(harnessHandler)
  harnessPort = (harnessServer.address() as any).port
})

afterAll(async () => {
  const { closeDb, resetDbForTests } = await import('../db')
  resetDbForTests()
  closeDb()
  await new Promise<void>((r) => harnessServer.close(() => r()))
})

const base = () => `http://127.0.0.1:${harnessPort}`
const authHeader = () => ({ Authorization: `Bearer ${(globalThis as any).__adminToken}` })

const createAd = (body: Record<string, unknown>) =>
  fetch(`${base()}/api/ads`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const VALID_AD = {
  title: 'Promo',
  image_url: 'https://example.com/ad.png',
  target_url: 'https://example.com/landing',
  active: true,
}

describe('Ads routes', () => {
  it('create: valid ad accepted with 201', async () => {
    const res = await createAd(VALID_AD)
    expect(res.status).toBe(201)
    const data = (await res.json()) as any
    expect(typeof data.id).toBe('number')
  })

  it('create: javascript target_url rejected with 400', async () => {
    const res = await createAd({ ...VALID_AD, target_url: 'javascript:alert(1)' })
    expect(res.status).toBe(400)
  })

  it('create: missing image_url rejected with 400', async () => {
    const res = await createAd({ title: 'NoImage', target_url: 'https://example.com' })
    expect(res.status).toBe(400)
  })

  it('create: overlong title rejected with 400', async () => {
    const res = await createAd({ ...VALID_AD, title: 'x'.repeat(201) })
    expect(res.status).toBe(400)
  })

  it('update: non-http image_url rejected with 400', async () => {
    const res = await fetch(`${base()}/api/ads/1`, {
      method: 'PUT',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: 'php://filter' }),
    })
    expect(res.status).toBe(400)
  })

  it('create: unauthenticated request rejected with 401', async () => {
    const res = await fetch(`${base()}/api/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_AD),
    })
    expect(res.status).toBe(401)
  })

  it('track: impression endpoint accepts unauthenticated POST', async () => {
    const res = await fetch(`${base()}/api/ads/1/impression`, { method: 'POST' })
    expect(res.status).toBe(200)
  })
})