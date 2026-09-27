import { IncomingMessage, ServerResponse } from 'node:http'
import { randomInt, randomUUID } from 'node:crypto'
import bcrypt from 'bcrypt'
import { getDb } from '../db.js'
import { signToken, verifyAdminToken, verifyTotp, createAdminSession, invalidateSession, signRelayToken } from '../auth.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'
import { resolveClientIp } from '../middleware/clientIp.js'

interface RateLimitEntry {
  count: number
  resetAt: number
  lockedUntil?: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()
const LOCKOUT_DURATION = 300000 // 5 minutes lockout after too many attempts

function checkRateLimit(ip: string, maxAttempts = 5, windowMs = 60000): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  // Check if IP is currently locked out
  if (entry && entry.lockedUntil && now < entry.lockedUntil) {
    return false
  }

  // Reset if window has expired
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxAttempts) {
    entry.lockedUntil = now + LOCKOUT_DURATION
    return false
  }

  entry.count++
  return true
}

/**
 * Client IP for rate limiting. Must be proxy-aware: behind nginx every peer is
 * loopback, so a socket-only key turns every per-IP limit into one global
 * bucket (3 requests to /verify-2fa would lock 2FA for the whole internet).
 */
function getRemoteAddress(req: IncomingMessage): string {
  return resolveClientIp(req)
}

export function handleAuthRoute(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  if (path === '/api/auth/login' && req.method === 'POST') { handleLogin(req, res); return true }
  if (path === '/api/auth/verify-2fa' && req.method === 'POST') { handleVerify2FA(req, res); return true }
  if (path === '/api/auth/logout' && req.method === 'POST') { handleLogout(req as AuthenticatedRequest, res); return true }
  if (path === '/api/auth/token' && req.method === 'POST') { handleToken(req, res); return true }
  return false
}

/**
 * Public, self-service relay token issuance. The signaling WebSocket requires a
 * valid JWT in `?token=`; this endpoint lets any client mint one. Rate-limited
 * per client IP to curb abuse. Message secrecy is E2E (recipient public-key
 * encrypted), so a public token endpoint only gates connection, not content.
 */
async function handleToken(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const ip = getRemoteAddress(req)
  // 60/min per real client IP. Carrier NAT shares one public address across many
  // users, so the ceiling has to survive a cold start of a whole cohort.
  if (!checkRateLimit(ip, 60, 60000)) {
    res.writeHead(429, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Too many requests. Try again later.' }))
    return
  }
  try {
    const body = (await readBody(req).catch(() => ({}))) || {}
    const id =
      body && typeof body.id === 'string' && body.id
        ? body.id.slice(0, 256)
        : randomUUID()
    const token = signRelayToken(id)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ token }))
  } catch (err) {
    // Log the real cause (almost always JWT_SECRET missing in the relay env) so
    // PM2 logs show why token issuance fails instead of a bare 500.
    console.error('[auth] relay token issuance failed:', err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Token issuance failed' }))
  }
}

const MAX_BODY_SIZE = 1024 * 100 // 100KB limit

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_SIZE) {
        req.destroy()
        reject(new Error('Request body too large'))
        return
      }
      body += chunk.toString()
    })
    req.on('end', () => {
      try { resolve(JSON.parse(body)) } catch { reject(new Error('Invalid JSON')) }
    })
    req.on('error', reject)
  })
}

let captchaSessions = new Map<string, { answer: number; expiresAt: number }>()

export function generateCaptchaChallenge(): { challenge: string; answer: number; sessionId: string } {
  const ops = ['+', '-', '\u00d7']
  const op = ops[randomInt(ops.length)]
  let a = 0, b = 0, answer = 0
  if (op === '+') {
    a = randomInt(1, 51)
    b = randomInt(1, 51)
    answer = a + b
  } else if (op === '-') {
    a = randomInt(10, 60)
    b = randomInt(1, Math.min(a, 50) + 1)
    answer = a - b
  } else {
    a = randomInt(1, 13)
    b = randomInt(1, 13)
    answer = a * b
  }
  const sessionId = randomUUID()
  const expiresAt = Date.now() + 5 * 60 * 1000
  captchaSessions.set(sessionId, { answer, expiresAt })
  return { challenge: `${a} ${op} ${b} = ?`, answer, sessionId }
}

export function verifyCaptcha(sessionId: string, userAnswer: number): boolean {
  const entry = captchaSessions.get(sessionId)
  if (!entry || Date.now() > entry.expiresAt) return false
  captchaSessions.delete(sessionId)
  return userAnswer === entry.answer
}

function cleanupCaptchas() {
  const now = Date.now()
  for (const [key, entry] of captchaSessions.entries()) {
    if (now > entry.expiresAt) captchaSessions.delete(key)
  }
}
setInterval(cleanupCaptchas, 60000)

async function handleLogin(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const ip = getRemoteAddress(req)
  if (!checkRateLimit(ip)) {
    res.writeHead(429, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Too many attempts. Try again later.' }))
    return
  }
  try {
    const { username, password, captchaSession, captchaAnswer } = await readBody(req)
    if (!captchaSession || captchaAnswer === undefined) {
      const challenge = generateCaptchaChallenge()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ needsCaptcha: true, sessionId: challenge.sessionId, challenge: challenge.challenge }))
      return
    }
    if (!verifyCaptcha(captchaSession, captchaAnswer)) {
      res.writeHead(403, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'CAPTCHA verification failed' }))
      return
    }
    if (!username || !password) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Username and password required' }))
      return
    }

    // Per-account limiter closes the distributed-botnet brute-force gap that
    // the IP limiter above cannot (one attacker, many IPs). Applied for both
    // known and unknown usernames so response timing does not enumerate users.
    const userKey = 'user:' + String(username).trim().toLowerCase()
    if (!checkRateLimit(userKey)) {
      res.writeHead(429, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Too many attempts for this account. Try again later.' }))
      return
    }

    const admin = getDb().prepare('SELECT * FROM admins WHERE username = ?').get(username) as any
    if (!admin) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid credentials' }))
      return
    }

    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid credentials' }))
      return
    }

    const sessionToken = signToken({ adminId: admin.id, username: admin.username })
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ sessionToken, requires2FA: true }))
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid request body' }))
  }
}

async function handleVerify2FA(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const ip = getRemoteAddress(req)
  if (!checkRateLimit(ip, 3)) {
    res.writeHead(429, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Too many attempts. Try again later.' }))
    return
  }
  try {
    const { sessionToken, code } = await readBody(req)
    if (!sessionToken || !code) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Session token and code required' }))
      return
    }

    let payload: { adminId: number; username: string }
    try {
      // Admin-audience only: a relay token (publicly mintable) is rejected here
      // instead of relying on `adminId` happening to be absent.
      payload = verifyAdminToken(sessionToken)
    } catch {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid or expired session token' }))
      return
    }

    const admin = getDb().prepare('SELECT * FROM admins WHERE id = ?').get(payload.adminId) as any
    if (!admin || !verifyTotp(admin.totp_secret, code)) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid 2FA code' }))
      return
    }

    const jwt = signToken({ adminId: admin.id, username: admin.username })
    createAdminSession(admin.id, jwt)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ token: jwt }))
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid request body' }))
  }
}

function handleLogout(req: AuthenticatedRequest, res: ServerResponse): void {
  if (!requireAuth(req, res)) return
  const authHeader = req.headers['authorization']!
  const token = authHeader.slice(7)
  invalidateSession(token)
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true }))
}

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  }
}, 300000)
