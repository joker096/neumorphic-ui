import { IncomingMessage, ServerResponse } from 'node:http'
import bcrypt from 'bcrypt'
import { getDb } from '../db.js'
import { signToken, verifyTotp, createAdminSession, invalidateSession, validateSession } from '../auth.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, maxAttempts = 5, windowMs = 60000): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= maxAttempts) return false
  entry.count++
  return true
}

function getRemoteAddress(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  return req.socket.remoteAddress || 'unknown'
}

export function handleAuthRoute(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  if (path === '/api/auth/login' && req.method === 'POST') { handleLogin(req, res); return true }
  if (path === '/api/auth/verify-2fa' && req.method === 'POST') { handleVerify2FA(req, res); return true }
  if (path === '/api/auth/logout' && req.method === 'POST') { handleLogout(req as AuthenticatedRequest, res); return true }
  return false
}

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => body += chunk.toString())
    req.on('end', () => {
      try { resolve(JSON.parse(body)) } catch { reject(new Error('Invalid JSON')) }
    })
    req.on('error', reject)
  })
}

async function handleLogin(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const ip = getRemoteAddress(req)
  if (!checkRateLimit(ip)) {
    res.writeHead(429, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Too many attempts. Try again later.' }))
    return
  }
  try {
    const { username, password } = await readBody(req)
    if (!username || !password) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Username and password required' }))
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

    const payload = validateSession(sessionToken)
    if (!payload) {
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
