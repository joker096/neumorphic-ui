import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import http from 'node:http'
import crypto from 'node:crypto'

// --- Env must be set BEFORE importing route/db (they read env at module load) ---
const MOCK_TOKEN = 'TOK_test_123'
const ORDER_ID = 'ord_test_1'
const OP_API_KEY = 'op_api_key'
const OP_SECRET = 'op_secret'

process.env.JWT_SECRET = 'test-jwt-secret-paymento'
process.env.PAYMENTO_API_KEY = OP_API_KEY
process.env.PAYMENTO_SECRET_KEY = OP_SECRET
process.env.DB_PATH = 'data/test-paymento-integration.db'

// --- Mock Paymento API server ---
const mockHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1')
  if (req.method === 'POST' && url.pathname === '/v1/payment/request') {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      void body
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true, message: 'ok', body: MOCK_TOKEN }))
    })
    return
  }
  if (req.method === 'POST' && url.pathname === '/v1/payment/verify') {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      const reqToken = (JSON.parse(body || '{}') as any).token
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          success: true,
          message: '',
          body: {
            token: reqToken ?? MOCK_TOKEN,
            orderId: ORDER_ID,
            orderStatus: 7,
            additionalData: [],
            settlement: { requestedFiatAmount: 10 },
          },
        }),
      )
    })
    return
  }
  res.writeHead(404)
  res.end('not mock')
}

const harnessHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1')
  handlePaymentoRoute(req, res, url.pathname)
}

let mockServer: http.Server
let harnessServer: http.Server
let harnessPort = 0

// handlers loaded after env set
let handlePaymentoRoute: (req: any, res: any, p: string) => boolean

function startServer(handler: (req: http.IncomingMessage, res: http.ServerResponse) => void): Promise<http.Server> {
  return new Promise((resolve) => {
    const s = http.createServer(handler)
    s.listen(0, '127.0.0.1', () => resolve(s))
  })
}

beforeAll(async () => {
  const mockSrv = await startServer(mockHandler)
  mockServer = mockSrv
  const mockPort = (mockSrv.address() as any).port
  process.env.PAYMENTO_API_URL = `http://127.0.0.1:${mockPort}`

  // dynamic import AFTER env is set so module-level constants pick up mock url
  const mod = await import('../routes/paymento.js')
  handlePaymentoRoute = mod.handlePaymentoRoute

  // Mint a valid admin session token (config/list now require auth).
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
  await new Promise<void>((r) => mockServer.close(() => r()))
  await new Promise<void>((r) => harnessServer.close(() => r()))
})

const base = () => `http://127.0.0.1:${harnessPort}`
const authHeader = () => ({ Authorization: `Bearer ${(globalThis as any).__adminToken}` })

describe('Paymento integration', () => {
  it('create: proxies to Paymento and writes payment to DB', async () => {
    const res = await fetch(`${base()}/api/paymento/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: OP_API_KEY,
        amount: '10',
        currency: 'USD',
        orderId: ORDER_ID,
        description: 'Integration test payment',
        returnUrl: 'https://merchant.example.com/return',
      }),
    })
    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.token).toBe(MOCK_TOKEN)
    expect(data.paymentUrl).toContain(`token=${MOCK_TOKEN}`)
    expect(data.orderId).toBe(ORDER_ID)
  })

  it('list: contains the created payment with status 0', async () => {
    const res = await fetch(`${base()}/api/paymento/list`, { headers: authHeader() })
    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    const found = data.payments.find((p: any) => p.order_id === ORDER_ID)
    expect(found).toBeDefined()
    expect(found.status).toBe(0)
  })

  it('ipn: valid HMAC signature updates status to 7', async () => {
    const body = JSON.stringify({
      Token: MOCK_TOKEN,
      PaymentId: 9001,
      OrderId: ORDER_ID,
      OrderStatus: 7,
      AdditionalData: [],
    })
    const sig = crypto.createHmac('sha256', OP_SECRET).update(body, 'utf8').digest('hex').toUpperCase()
    const res = await fetch(`${base()}/api/paymento/ipn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-HMAC-SHA256-SIGNATURE': sig },
      body,
    })
    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.ok).toBe(true)

    const listRes = await fetch(`${base()}/api/paymento/list`, { headers: authHeader() })
    const list = (await listRes.json()) as any
    const found = list.payments.find((p: any) => p.order_id === ORDER_ID)
    expect(found.status).toBe(7)
    expect(found.payment_id).toBe(9001)
  })

  it('ipn: invalid HMAC signature rejected with 401', async () => {
    const body = JSON.stringify({
      Token: MOCK_TOKEN,
      PaymentId: 9001,
      OrderId: ORDER_ID,
      OrderStatus: 9,
      AdditionalData: [],
    })
    const res = await fetch(`${base()}/api/paymento/ipn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-HMAC-SHA256-SIGNATURE': 'DEADBEEF' },
      body,
    })
    expect(res.status).toBe(401)
    const data = (await res.json()) as any
    expect(data.error).toMatch(/signature/i)
  })

  it('verify: proxies Paymento verify endpoint and returns status', async () => {
    const res = await fetch(`${base()}/api/paymento/verify/${MOCK_TOKEN}`, { method: 'GET' })
    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.status).toBe(7)
    expect(data.orderId).toBe(ORDER_ID)
    expect(data.amount).toBe(10)
    expect(data.currency).toBe('USD')
  })
})

describe('Paymento pay-per-key entitlements', () => {
  const SUB_PK = Buffer.alloc(32, 7).toString('base64')
  const SUB_PK_FAIL = Buffer.alloc(32, 9).toString('base64')
  const SUB_ORDER = `sub:${SUB_PK}:premium`
  const SUB_ORDER_FAIL = `sub:${SUB_PK_FAIL}:premium90`

  const ipn = async (orderId: string, orderStatus: number) => {
    const body = JSON.stringify({
      Token: MOCK_TOKEN,
      PaymentId: 9100,
      OrderId: orderId,
      OrderStatus: orderStatus,
      AdditionalData: [],
    })
    const sig = crypto.createHmac('sha256', OP_SECRET).update(body, 'utf8').digest('hex').toUpperCase()
    return fetch(`${base()}/api/paymento/ipn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-HMAC-SHA256-SIGNATURE': sig },
      body,
    })
  }

  const entitlement = (pk: string) => fetch(`${base()}/api/paymento/entitlement?pk=${encodeURIComponent(pk)}`)

  it('create: sub order with amount below plan price rejected with 400', async () => {
    const res = await fetch(`${base()}/api/paymento/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: '0.01', currency: 'USD', orderId: SUB_ORDER }),
    })
    expect(res.status).toBe(400)
    const data = (await res.json()) as any
    expect(data.error).toMatch(/at least 5/i)
  })

  it('create: sub order with valid amount accepted', async () => {
    const res = await fetch(`${base()}/api/paymento/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: '5', currency: 'USD', orderId: SUB_ORDER }),
    })
    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.orderId).toBe(SUB_ORDER)
  })

  it('entitlement: inactive before paid IPN', async () => {
    const res = await entitlement(SUB_PK)
    expect(res.status).toBe(200)
    expect((await res.json()) as any).toEqual({ premium: false })
  })

  it('ipn: paid sub order grants entitlement', async () => {
    const res = await ipn(SUB_ORDER, 7)
    expect(res.status).toBe(200)
    const ent = (await (await entitlement(SUB_PK)).json()) as any
    expect(ent.premium).toBe(true)
    expect(ent.plan).toBe('premium')
    expect(typeof ent.expiresAt).toBe('number')
    expect(ent.expiresAt).toBeGreaterThan(Date.now())
  })

  it('ipn: duplicate paid sub order does not double-grant or fail', async () => {
    const res = await ipn(SUB_ORDER, 7)
    expect(res.status).toBe(200)
    const ent = (await (await entitlement(SUB_PK)).json()) as any
    expect(ent.premium).toBe(true)
    expect(ent.plan).toBe('premium')
  })

  it('ipn: failed sub order does not grant entitlement', async () => {
    const res = await fetch(`${base()}/api/paymento/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: '12', currency: 'USD', orderId: SUB_ORDER_FAIL }),
    })
    expect(res.status).toBe(200)
    await ipn(SUB_ORDER_FAIL, 9)
    const ent = (await (await entitlement(SUB_PK_FAIL)).json()) as any
    expect(ent).toEqual({ premium: false })
  })

  it('entitlement: unknown pk returns premium false', async () => {
    const pk = Buffer.alloc(32, 5).toString('base64')
    const res = await entitlement(pk)
    expect(res.status).toBe(200)
    expect((await res.json()) as any).toEqual({ premium: false })
  })

  it('entitlement: missing pk rejected with 400', async () => {
    const res = await fetch(`${base()}/api/paymento/entitlement`)
    expect(res.status).toBe(400)
  })
})
