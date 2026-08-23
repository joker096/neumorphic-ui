import { IncomingMessage, ServerResponse } from 'node:http'
import crypto from 'node:crypto'
import {
  upsertMerchantConfig,
  getMerchantSecretEnc,
  insertPayment,
  updatePaymentStatus,
  getPaymentByOrderId,
  getPaymentByToken,
  listPayments,
} from '../db.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'

const API_URL = (process.env.PAYMENTO_API_URL || 'https://api.paymento.io').replace(/\/+$/, '')
const ENV_API_KEY = process.env.PAYMENTO_API_KEY || ''
const ENV_SECRET = process.env.PAYMENTO_SECRET_KEY || ''
const GATEWAY_URL = 'https://app.paymento.io/gateway'
const CREATE_PATH = '/v1/payment/request'
const VERIFY_PATH = '/v1/payment/verify'

// --- Encryption of merchant secrets at rest (AES-256-GCM, key derived from the app secret) ---
const _paymentoJwtSecret = process.env.JWT_SECRET
if (!_paymentoJwtSecret) {
  throw new Error('JWT_SECRET is required to derive the Paymento encryption key; refusing to start with a hardcoded fallback')
}
const ENC_KEY = crypto.scryptSync(_paymentoJwtSecret, 'paymento-salt', 32)

function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

function decryptSecret(b64: string): string {
  const buf = Buffer.from(b64, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const enc = buf.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

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

// --- Secret resolution: ENV operator creds take precedence, else stored merchant config ---
function resolveSecret(apiKey?: string): string {
  if (ENV_API_KEY && (!apiKey || apiKey === ENV_API_KEY)) return ENV_SECRET
  if (apiKey) {
    const enc = getMerchantSecretEnc(apiKey)
    if (enc) {
      try {
        return decryptSecret(enc)
      } catch {
        return ''
      }
    }
  }
  return ''
}

function resolveApiKey(provided?: string): string {
  if (provided) return provided
  return ENV_API_KEY
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
  if (path === '/api/paymento/config' && req.method === 'POST') {
    if (!requireAuth(req as AuthenticatedRequest, res)) return true
    handleConfig(req, res)
    return true
  }
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
  return false
}

async function handleConfig(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readJson<{ apiKey?: string; secretKey?: string; ipnUrl?: string; returnUrl?: string }>(req)
    if (!body.apiKey || !body.secretKey) {
      sendJson(res, 400, { error: 'apiKey and secretKey are required' })
      return
    }
    upsertMerchantConfig(
      body.apiKey,
      encryptSecret(body.secretKey),
      body.ipnUrl || '',
      body.returnUrl || '',
    )
    sendJson(res, 200, { ok: true })
  } catch (err: any) {
    sendJson(res, 500, { error: err?.message || 'config failed' })
  }
}

async function handleCreate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readJson<any>(req)
    const apiKey = resolveApiKey(body.apiKey)
    if (!apiKey) {
      sendJson(res, 400, { error: 'Paymento API key not configured' })
      return
    }
    const secret = resolveSecret(apiKey)
    if (!secret) {
      sendJson(res, 400, { error: 'Paymento secret not configured for this API key' })
      return
    }

    const orderId = String(body.orderId || `ord-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`)
    const payload: Record<string, unknown> = {
      fiatAmount: String(body.amount),
      fiatCurrency: body.currency || 'USD',
      orderId,
      Speed: body.speed === 1 ? 1 : 0,
    }
    if (body.returnUrl) payload.ReturnUrl = body.returnUrl
    if (body.email) payload.EmailAddress = body.email
    if (body.description) {
      payload.additionalData = [{ key: 'description', value: String(body.description) }]
    } else if (Array.isArray(body.additionalData)) {
      payload.additionalData = body.additionalData
    }

    const { token } = await callPaymentoCreate(apiKey, payload)
    const paymentUrl = `${GATEWAY_URL}?token=${encodeURIComponent(token)}`

    insertPayment({
      token,
      paymentId: null,
      orderId,
      apiKey,
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
    const apiKey = payment?.api_key || ''
    const secret = resolveSecret(apiKey)
    if (!verifySignature(raw, signature, secret)) {
      console.warn('[Paymento] Invalid IPN signature for', orderId)
      sendJson(res, 401, { error: 'Invalid signature' })
      return
    }

    const status = Number(body.OrderStatus ?? 0)
    const paymentId = body.PaymentId != null ? Number(body.PaymentId) : null
    updatePaymentStatus(orderId, status, paymentId)

    if (apiKey && !payment) {
      // First contact for an order we didn't create locally: still record it.
      insertPayment({
        token: String(body.Token || ''),
        paymentId,
        orderId,
        apiKey,
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
    const token = decodeURIComponent(path.replace('/api/paymento/verify/', ''))
    const payment = getPaymentByToken(token)
    const apiKey = payment?.api_key || ENV_API_KEY
    if (!apiKey) {
      sendJson(res, 400, { error: 'API key not configured' })
      return
    }
    const result = await callPaymentoVerify(apiKey, token)
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
