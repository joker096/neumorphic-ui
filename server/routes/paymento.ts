import { IncomingMessage, ServerResponse } from 'node:http'
import crypto from 'node:crypto'
import {
  insertPayment,
  updatePaymentStatus,
  getPaymentByOrderId,
  getPaymentByToken,
  getActiveEntitlement,
  grantEntitlement,
  recordSubscriptionGrant,
  listPayments,
} from '../db.js'
import { getPlan } from '../plans.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'

// Merchant credentials are operator config: set PAYMENTO_API_KEY and PAYMENTO_SECRET_KEY in the
// server environment. There is no runtime UI or API for changing them.
const API_URL = (process.env.PAYMENTO_API_URL || 'https://api.paymento.io').replace(/\/+$/, '')
const ENV_API_KEY = process.env.PAYMENTO_API_KEY || ''
const ENV_SECRET = process.env.PAYMENTO_SECRET_KEY || ''
const RETURN_URL = (process.env.PAYMENTO_RETURN_URL || '').replace(/\/+$/, '')
const GATEWAY_URL = 'https://app.paymento.io/gateway'
const CREATE_PATH = '/v1/payment/request'
const VERIFY_PATH = '/v1/payment/verify'

// --- Request body readers ---
const MAX_RAW_BODY = 1024 * 1024 // 1MB hard limit to prevent body-based DoS
function readRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > MAX_RAW_BODY) {
        req.destroy()
        reject(new Error('Request body too large'))
        return
      }
      chunks.push(Buffer.from(c))
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

// --- Rate limit for payment creation (external API is billed per call) ---
const createRateMap = new Map<string, { count: number; resetAt: number }>()
const CREATE_MAX = 10
const CREATE_WINDOW = 60000
function checkCreateRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = createRateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    createRateMap.set(ip, { count: 1, resetAt: now + CREATE_WINDOW })
    return true
  }
  if (entry.count >= CREATE_MAX) return false
  entry.count++
  return true
}
setInterval(() => {
  const now = Date.now()
  for (const [k, e] of createRateMap) if (now > e.resetAt) createRateMap.delete(k)
}, CREATE_WINDOW)

async function readJson<T = any>(req: IncomingMessage): Promise<T> {
  const raw = await readRawBody(req)
  if (!raw) return {} as T
  try {
    return JSON.parse(raw) as T
  } catch {
    return {} as T
  }
}

function verifySignature(rawPayload: string, receivedSignature: string, secret: string): boolean {
  if (!receivedSignature || !secret) return false
  const calc = crypto.createHmac('sha256', secret).update(rawPayload, 'utf8').digest('hex').toUpperCase()
  const expected = receivedSignature.toUpperCase()
  if (calc.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < calc.length; i++) diff |= calc.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

// --- Subscription (pay-per-key) order ids ---
// Format: sub:<devicePublicKeyB64>:<planId>[:<nonce>]
const SUB_ORDER_RE = /^sub:([A-Za-z0-9+/=]{40,64}):([a-z][a-z0-9]{0,15})(?::.+)?$/
// Paymento statuses that mean money is in: 7 = Paid, 8 = Approved (merchant confirmed).
const PAID_STATUSES = new Set([7, 8])

function parseSubscriptionOrderId(orderId: string): { publicKey: string; planId: string } | null {
  const m = SUB_ORDER_RE.exec(orderId)
  if (!m) return null
  if (!getPlan(m[2])) return null
  return { publicKey: m[1], planId: m[2] }
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

// --- Paymento API calls ---
async function callPaymentoCreate(
  apiKey: string,
  payload: Record<string, unknown>,
): Promise<{ token: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const resp = await fetch(`${API_URL}${CREATE_PATH}`, {
      method: 'POST',
      headers: {
        'Api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'text/plain',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const text = await resp.text()
    if (!resp.ok) {
      throw new Error(text || `Paymento create failed (${resp.status})`)
    }
    let parsed: any
    try {
      parsed = JSON.parse(text)
    } catch {
      // Some responses return the bare token as text/plain.
      return { token: text.trim() }
    }
    if (parsed && parsed.success === false) {
      throw new Error(parsed.error || parsed.message || 'Paymento create rejected')
    }
    const token = parsed?.body ?? parsed?.token ?? parsed
    if (!token || typeof token !== 'string') {
      throw new Error('Paymento did not return a token')
    }
    return { token }
  } finally {
    clearTimeout(timeout)
  }
}

async function callPaymentoVerify(
  apiKey: string,
  token: string,
): Promise<{ status: number; orderId: string; amount: number; currency: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const resp = await fetch(`${API_URL}${VERIFY_PATH}`, {
      method: 'POST',
      headers: {
        'Api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ token }),
      signal: controller.signal,
    })
    const text = await resp.text()
    if (!resp.ok) throw new Error(text || `Verify failed (${resp.status})`)
    const parsed: any = text ? JSON.parse(text) : {}
    const body = parsed.body ?? parsed
    const settlement = body.settlement ?? {}
    return {
      status: Number(body.orderStatus ?? body.OrderStatus ?? body.status ?? 0),
      orderId: String(body.orderId ?? body.order_id ?? body.OrderId ?? ''),
      amount: Number(settlement.requestedFiatAmount ?? body.amount ?? 0),
      currency: String(settlement.currency ?? body.currency ?? ''),
    }
  } finally {
    clearTimeout(timeout)
  }
}

// --- Route handler ---
export function handlePaymentoRoute(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  if (path === '/api/paymento/create' && req.method === 'POST') {
    const ip = req.socket.remoteAddress || 'unknown'
    if (!checkCreateRateLimit(ip)) {
      sendJson(res, 429, { error: 'Too many requests. Try again later.' })
      return true
    }
    handleCreate(req, res)
    return true
  }
  if (path === '/api/paymento/ipn' && req.method === 'POST') {
    handleIpn(req, res)
    return true
  }
  if (path.startsWith('/api/paymento/verify/') && req.method === 'GET') {
    handleVerify(req, res, path)
    return true
  }
  if (path === '/api/paymento/list' && req.method === 'GET') {
    if (!requireAuth(req as AuthenticatedRequest, res)) return true
    sendJson(res, 200, { payments: listPayments(50) })
    return true
  }
  if (path === '/api/paymento/entitlement' && req.method === 'GET') {
    handleEntitlement(req, res)
    return true
  }
  return false
}

// --- Entitlement lookup (device pk is public info, but the endpoint is rate-limited) ---
const entRateMap = new Map<string, { count: number; resetAt: number }>()
const ENT_MAX = 30
const ENT_WINDOW = 60000
function checkEntitlementRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = entRateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    entRateMap.set(ip, { count: 1, resetAt: now + ENT_WINDOW })
    return true
  }
  if (entry.count >= ENT_MAX) return false
  entry.count++
  return true
}
setInterval(() => {
  const now = Date.now()
  for (const [k, e] of entRateMap) if (now > e.resetAt) entRateMap.delete(k)
}, ENT_WINDOW)

function handleEntitlement(req: IncomingMessage, res: ServerResponse): void {
  try {
    const ip = req.socket.remoteAddress || 'unknown'
    if (!checkEntitlementRateLimit(ip)) {
      sendJson(res, 429, { error: 'Too many requests. Try again later.' })
      return
    }
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    const pk = url.searchParams.get('pk') || ''
    if (!pk || pk.length > 128) {
      sendJson(res, 400, { error: 'Missing or invalid pk' })
      return
    }
    const row = getActiveEntitlement(pk)
    if (!row) {
      sendJson(res, 200, { premium: false })
      return
    }
    sendJson(res, 200, { premium: true, plan: row.plan, expiresAt: row.expiresAt })
  } catch (err: any) {
    console.error('[Paymento] Entitlement error:', err)
    sendJson(res, 500, { error: 'Entitlement lookup failed' })
  }
}

async function handleCreate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    if (!ENV_API_KEY || !ENV_SECRET) {
      sendJson(res, 503, { error: 'Paymento is not configured on the server' })
      return
    }
    const body = await readJson<any>(req)

    const orderId = String(body.orderId || `ord-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`)

    // Price-floor guard: a subscription order must cost at least the plan price.
    const subOrder = parseSubscriptionOrderId(orderId)
    if (subOrder) {
      const plan = getPlan(subOrder.planId)!
      const amount = Number(body.amount)
      if (!Number.isFinite(amount) || amount < plan.price) {
        sendJson(res, 400, { error: `Amount must be at least ${plan.price} ${plan.currency} for plan ${plan.id}` })
        return
      }
    }

    const payload: Record<string, unknown> = {
      fiatAmount: String(body.amount),
      fiatCurrency: body.currency || 'USD',
      orderId,
      Speed: body.speed === 1 ? 1 : 0,
    }
    const returnUrl = typeof body.returnUrl === 'string' && body.returnUrl ? body.returnUrl : RETURN_URL
    if (returnUrl) payload.ReturnUrl = returnUrl
    if (body.email) payload.EmailAddress = body.email
    if (body.description) {
      payload.additionalData = [{ key: 'description', value: String(body.description) }]
    } else if (Array.isArray(body.additionalData)) {
      payload.additionalData = body.additionalData
    }

    const { token } = await callPaymentoCreate(ENV_API_KEY, payload)
    const paymentUrl = `${GATEWAY_URL}?token=${encodeURIComponent(token)}`

    insertPayment({
      token,
      paymentId: null,
      orderId,
      apiKey: ENV_API_KEY,
      amount: String(body.amount),
      currency: String(body.currency || 'USD'),
      status: 0,
      additionalData: JSON.stringify(payload.additionalData || []),
    })

    sendJson(res, 200, { token, paymentUrl, orderId })
  } catch (err: any) {
    sendJson(res, 502, { error: err?.message || 'create failed' })
  }
}

async function handleIpn(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const raw = await readRawBody(req)
    const signature = (req.headers['x-hmac-sha256-signature'] as string) || ''
    let body: any = {}
    try {
      body = raw ? JSON.parse(raw) : {}
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON' })
      return
    }

    const orderId = String(body.OrderId || '')
    if (!orderId) {
      sendJson(res, 400, { error: 'Missing OrderId' })
      return
    }

    const payment = getPaymentByOrderId(orderId)
    if (!verifySignature(raw, signature, ENV_SECRET)) {
      console.warn('[Paymento] Invalid IPN signature for', orderId)
      sendJson(res, 401, { error: 'Invalid signature' })
      return
    }

    const status = Number(body.OrderStatus ?? 0)
    const paymentId = body.PaymentId != null ? Number(body.PaymentId) : null
    updatePaymentStatus(orderId, status, paymentId)

    // Pay-per-key grant: trust anchor is the Paymento HMAC above, not the orderId.
    if (PAID_STATUSES.has(status)) {
      const sub = parseSubscriptionOrderId(orderId)
      if (sub) {
        const first = recordSubscriptionGrant(orderId, sub.publicKey, sub.planId)
        if (first) {
          const plan = getPlan(sub.planId)!
          grantEntitlement(sub.publicKey, sub.planId, plan.days)
        }
      }
    }

    if (!payment) {
      // First contact for an order we didn't create locally: still record it.
      insertPayment({
        token: String(body.Token || ''),
        paymentId,
        orderId,
        apiKey: ENV_API_KEY,
        amount: '',
        currency: '',
        status,
        additionalData: JSON.stringify(body.AdditionalData || []),
      })
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
  } catch (err: any) {
    console.error('[Paymento] IPN error:', err)
    sendJson(res, 500, { error: 'IPN processing error' })
  }
}

async function handleVerify(req: IncomingMessage, res: ServerResponse, path: string): Promise<void> {
  try {
    if (!ENV_API_KEY) {
      sendJson(res, 503, { error: 'Paymento is not configured on the server' })
      return
    }
    const token = decodeURIComponent(path.replace('/api/paymento/verify/', ''))
    const payment = getPaymentByToken(token)
    const result = await callPaymentoVerify(ENV_API_KEY, token)
    const row = payment ?? (result.orderId ? getPaymentByOrderId(result.orderId) : null)
    if (row) {
      if (!result.currency) result.currency = String(row.currency ?? '')
      if (!result.amount) result.amount = Number(row.amount ?? 0)
    }
    updatePaymentStatus(result.orderId || (row?.order_id ?? ''), result.status, null)
    sendJson(res, 200, result)
  } catch (err: any) {
    sendJson(res, 502, { error: err?.message || 'verify failed' })
  }
}
