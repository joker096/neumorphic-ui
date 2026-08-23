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
  it('config: saves merchant config (encrypts secret)', async () => {
    const res = await fetch(`${base()}/api/paymento/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({
        apiKey: OP_API_KEY,
        secretKey: OP_SECRET,
        ipnUrl: 'https://merchant.example.com/ipn',
        returnUrl: 'https://merchant.example.com/return',
      }),
    })
    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.ok).toBe(true)
  })

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
