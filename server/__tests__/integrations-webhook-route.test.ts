import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import http from 'node:http'

// --- Env set BEFORE importing route/db (they read env at module load) ---
process.env.JWT_SECRET = 'test-jwt-secret-integrations-webhook'
process.env.DB_PATH = 'data/test-integrations-webhook.db'

const harnessHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1')
  handleIntegrationsRoute(req, res, url.pathname)
}

let handleIntegrationsRoute: (req: any, res: any, p: string) => boolean
let harnessServer: http.Server
let harnessPort = 0
const SECRET = 'whsec_route_test'
let integrationSeq = 0

function startServer(handler: (req: http.IncomingMessage, res: http.ServerResponse) => void): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const s = http.createServer(handler)
    s.once('error', reject)
    s.listen(0, '127.0.0.1', () => resolve(s))
  })
}

/** Seed an integration through the manager so the route has something to resolve. */
async function seedIntegration(provider: string, config: Record<string, unknown>): Promise<string> {
  const { integrationManager } = await import('../integrations/core/IntegrationManager.js')
  integrationSeq += 1
  return integrationManager.create('1', provider, `route ${integrationSeq}`, 'inbound', config).id
}

beforeAll(async () => {
  const mod = await import('../routes/integrations.js')
  handleIntegrationsRoute = mod.handleIntegrationsRoute
  const { getDb } = await import('../db.js')
  getDb()
    .prepare("INSERT OR IGNORE INTO admins (id, username, password_hash, totp_secret) VALUES (1, 'test', 'x', 'x')")
    .run()
  harnessServer = await startServer(harnessHandler)
  const address = harnessServer.address()
  if (!address || typeof address === 'string' || !address.port) {
    throw new Error(`integrations-webhook harness: no usable port (${String(address)})`)
  }
  harnessPort = address.port
})

afterAll(async () => {
  const fs = await import('node:fs')
  const { closeDb, resetDbForTests } = await import('../db')
  resetDbForTests()
  closeDb()
  await new Promise<void>((r) => harnessServer.close(() => r()))
  if (fs.existsSync('data/test-integrations-webhook.db')) fs.unlinkSync('data/test-integrations-webhook.db')
})

const base = () => `http://127.0.0.1:${harnessPort}`

/** Deliberately non-canonical JSON: whitespace + an escaped slash. */
const RAW_BODY = '{ "event" : "contact.created",\n  "url": "https:\\/\\/x.test\\/a" }'

function sign(secret: string, timestamp: string, body: string): string {
  // Imported lazily to keep env ordering identical to the route module.
  const { createHmac } = require('node:crypto') as typeof import('node:crypto')
  return `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`
}

async function post(id: string, headers: Record<string, string>, body = RAW_BODY) {
  return fetch(`${base()}/api/v1/integrations/webhooks/1c/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body,
  })
}

describe('Integrations webhook route', () => {
  it('rejects an unauthenticated webhook with 403', async () => {
    const id = await seedIntegration('1c', {})
    const res = await post(id, {})
    expect(res.status).toBe(403)
    const data = (await res.json()) as any
    expect(data.code).toBe('AUTH_FAILED')
  })

  it('accepts a hub-signed webhook and verifies the RAW body byte-for-byte', async () => {
    const id = await seedIntegration('1c', { webhookSecret: SECRET })
    const timestamp = String(Math.floor(Date.now() / 1000))
    const ok = await post(id, { 'x-signature': sign(SECRET, timestamp, RAW_BODY), 'x-timestamp': timestamp })
    expect(ok.status).toBe(202)
    const data = (await ok.json()) as any
    expect(data.accepted).toBe(true)

    // The same signature over the *re-serialised* body must fail — proof the
    // route hands the provider's exact bytes to the verifier.
    const reserialised = JSON.stringify(JSON.parse(RAW_BODY))
    const mismatch = await post(id, {
      'x-signature': sign(SECRET, timestamp, reserialised), 'x-timestamp': timestamp,
    }, RAW_BODY)
    expect(mismatch.status).toBe(403)
  })

  it('rejects a signature made with the wrong secret', async () => {
    const id = await seedIntegration('1c', { webhookSecret: SECRET })
    const timestamp = String(Math.floor(Date.now() / 1000))
    const res = await post(id, { 'x-signature': sign('other', timestamp, RAW_BODY), 'x-timestamp': timestamp })
    expect(res.status).toBe(403)
  })

  it('rejects a stale timestamp', async () => {
    const id = await seedIntegration('1c', { webhookSecret: SECRET })
    const timestamp = String(Math.floor(Date.now() / 1000) - 86_400)
    const res = await post(id, { 'x-signature': sign(SECRET, timestamp, RAW_BODY), 'x-timestamp': timestamp })
    expect(res.status).toBe(403)
  })

  it('rate-limits the unauthenticated endpoint per client IP', async () => {
    const id = await seedIntegration('1c', {})
    let limited = 0
    let authFailures = 0
    // Unauthenticated requests are rejected anyway; the limiter must engage
    // before the queue is ever reached.
    for (let i = 0; i < 80; i++) {
      const res = await post(id, { 'x-forwarded-for': '203.0.113.7' })
      if (res.status === 429) limited += 1
      else if (res.status === 403) authFailures += 1
    }
    expect(limited).toBeGreaterThan(0)
    expect(authFailures).toBeGreaterThan(0)

    // A different client IP has its own budget (X-Forwarded-For is honoured
    // because the harness peer is loopback — see middleware/clientIp).
    const other = await post(id, { 'x-forwarded-for': '203.0.113.8' })
    expect(other.status).toBe(403)
  })

  it('rejects an oversized body with 413 without touching the verifier', async () => {
    const id = await seedIntegration('1c', { webhookSecret: SECRET })
    const res = await post(id, { 'x-forwarded-for': '198.51.100.4' }, `"${'a'.repeat(1024 * 300)}"`)
    expect(res.status).toBe(413)
  })
})
