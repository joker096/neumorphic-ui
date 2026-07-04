import { WebSocketServer, WebSocket } from 'ws'
import { createServer, RequestListener } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import jwt from 'jsonwebtoken'
import { logConnection, logDisconnection, closeDb } from './db.js'
import { handleAuthRoute } from './routes/auth.js'
import { handleStatsRoute } from './routes/stats.js'
import { handleAdsRoute } from './routes/ads.js'
import { applyCSP } from './csp.js'

const PORT = parseInt(process.env.PORT || '8765', 10)

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required for signaling server')
  process.exit(1)
}

const clients = new Map<string, WebSocket>()

// Rate limit per IP: track connection attempts
const connectionAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_CONNECTIONS_PER_MINUTE = 10

function checkConnectionRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = connectionAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    connectionAttempts.set(ip, { count: 1, resetAt: now + 60000 })
    return true
  }
  if (entry.count >= MAX_CONNECTIONS_PER_MINUTE) return false
  entry.count++
  return true
}

// Clean up stale connection entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of connectionAttempts.entries()) {
    if (now > entry.resetAt) connectionAttempts.delete(key)
  }
}, 300000)

function getClientIp(ws: WebSocket): string {
  const req = (ws as any).request
  if (req && req.headers) {
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  }
  return 'unknown'
}

function verifyWsToken(authHeader: string): boolean {
  try {
    const token = authHeader.slice(7) // remove 'Bearer '
    jwt.verify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

// CORS allowlist from environment variable (comma-separated domains)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : []

function isOriginAllowed(origin: string): boolean {
  if (ALLOWED_ORIGINS.length === 0) return false
  return ALLOWED_ORIGINS.some((allowed) => origin === allowed)
}

const server = createServer()
const wss = new WebSocketServer({ server, maxPayload: 1024 * 1024 })

wss.on('connection', (ws, req) => {
  const ip = getClientIp(ws)
  if (!checkConnectionRateLimit(ip)) {
    ws.close(1008, 'Too many connections')
    return
  }

  // Verify authentication token from query param or header
  const url = (req as any).url || ''
  const urlParams = new URLSearchParams(url.split('?')[1] || '')
  const token = urlParams.get('token') || ''

  if (!token || !verifyWsToken(`Bearer ${token}`)) {
    ws.close(1008, 'Authentication required')
    return
  }

  let registeredKey: string | null = null

  const send = (data: object) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }

  // Capture IP and User-Agent for connection logging
  const clientIp = req.socket.remoteAddress || 'unknown'
  const clientUa = req.headers?.['user-agent'] || ''

  ws.on('message', (raw) => {
    let msg: any
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      send({ type: 'error', message: 'Invalid JSON' })
      return
    }

    switch (msg.type) {
      case 'register':
        if (typeof msg.publicKey !== 'string' || !msg.publicKey) {
          send({ type: 'error', message: 'Invalid publicKey' })
          return
        }
        registeredKey = msg.publicKey
        clients.set(registeredKey, ws)
        logConnection(registeredKey, clientIp, clientUa)
        send({ type: 'registered', publicKey: registeredKey })
        break

      case 'offer':
      case 'answer': {
        if (!registeredKey) {
          send({ type: 'error', message: 'Not registered' })
          return
        }
        if (typeof msg.target !== 'string' || !msg.target) {
          send({ type: 'error', message: 'Invalid target' })
          return
        }
        const target = clients.get(msg.target)
        if (!target || target.readyState !== WebSocket.OPEN) {
          send({ type: 'error', message: 'Target not available' })
          return
        }
        target.send(JSON.stringify({
          type: msg.type,
          from: registeredKey,
          sdp: msg.sdp,
          ...(msg.hmacKey ? { hmacKey: msg.hmacKey } : {}),
        }))
        break
      }

      case 'ice-candidate': {
        if (!registeredKey) {
          send({ type: 'error', message: 'Not registered' })
          return
        }
        if (typeof msg.target !== 'string' || !msg.target) {
          send({ type: 'error', message: 'Invalid target' })
          return
        }
        const target = clients.get(msg.target)
        if (!target || target.readyState !== WebSocket.OPEN) {
          send({ type: 'error', message: 'Target not available' })
          return
        }
        target.send(JSON.stringify({
          type: 'ice-candidate',
          from: registeredKey,
          candidate: msg.candidate,
        }))
        break
      }

      // Metadata signaling: typing indicators, delivery receipts, online status, read receipts
      case 'typing-indicator':
      case 'delivery-receipt':
      case 'online-status':
      case 'read-receipt': {
        if (!registeredKey) {
          send({ type: 'error', message: 'Not registered' })
          return
        }
        if (typeof msg.target !== 'string' || !msg.target) {
          send({ type: 'error', message: 'Invalid target' })
          return
        }
        const target = clients.get(msg.target)
        if (!target || target.readyState !== WebSocket.OPEN) {
          send({ type: 'error', message: 'Target not available' })
          return
        }
        target.send(JSON.stringify({
          type: msg.type,
          from: registeredKey,
          data: msg.data,
        }))
        break
      }

      default:
        send({ type: 'error', message: `Unknown message type: ${msg.type}` })
    }
  })

  ws.on('close', () => {
    if (registeredKey) {
      logDisconnection(registeredKey)
      if (clients.get(registeredKey) === ws) {
        clients.delete(registeredKey)
      }
    }
  })

  ws.on('error', () => {
    if (registeredKey) {
      logDisconnection(registeredKey)
      if (clients.get(registeredKey) === ws) {
        clients.delete(registeredKey)
      }
    }
  })
})

// --- REST API Server (port 8766) ---
const ADMIN_DIST = join(__dirname, '..', 'dist', 'admin')

function serveAdminFile(res: any, reqUrl: string, path: string): boolean {
  if (!path.startsWith('/admin')) return false

  // Normalize and validate path to prevent directory traversal
  const fileRelPath = path.replace(/^\/admin(\/|$)/, '/')
  const filePath = join(ADMIN_DIST, fileRelPath)
  const normalizedPath = join(ADMIN_DIST, fileRelPath)
  if (!normalizedPath.startsWith(ADMIN_DIST)) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Access denied' }))
    return true
  }

  if (existsSync(normalizedPath)) {
    // Determine content type from extension
    let contentType = 'text/plain'
    if (normalizedPath.endsWith('.html')) contentType = 'text/html'
    else if (normalizedPath.endsWith('.css')) contentType = 'text/css'
    else if (normalizedPath.endsWith('.js')) contentType = 'application/javascript'
    else if (normalizedPath.endsWith('.json')) contentType = 'application/json'
    else if (normalizedPath.endsWith('.png')) contentType = 'image/png'
    else if (normalizedPath.endsWith('.webp')) contentType = 'image/webp'
    else if (normalizedPath.endsWith('.ico')) contentType = 'image/x-icon'
    else if (normalizedPath.endsWith('.svg')) contentType = 'image/svg+xml'

    res.writeHead(200, { 'Content-Type': contentType })
    res.end(readFileSync(normalizedPath))
    return true
  }

  return false
}

const restServer = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const path = url.pathname

  // Apply security headers (CSP, X-Content-Type-Options, etc.)
  applyCSP(res)

  // CORS headers - restricted to allowed origins
  const origin = (req.headers['origin'] || '').toString()
  if (ALLOWED_ORIGINS.length > 0 && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  res.setHeader('Content-Type', 'application/json')

  // Try serving admin static files first
  if (serveAdminFile(res, '', path)) return

  // Handle API routes
  const handled =
    handleAuthRoute(req, res, path) ||
    handleStatsRoute(req, res, path) ||
    handleAdsRoute(req, res, path)

  if (!handled) {
    res.writeHead(404)
    res.end(JSON.stringify({ error: 'Not found' }))
  }
})

const REST_PORT = parseInt(process.env.REST_PORT || '8766', 10)
restServer.listen(REST_PORT, () => {
  console.log(`[Mess&Anger] REST API listening on port ${REST_PORT}`)
})

server.listen(PORT, () => {
  console.log(`[Mess&Anger] Signaling server listening on port ${PORT}`)
})

process.on('SIGINT', () => {
  console.log('\nShutting down...')
  closeDb()
  process.exit(0)
})
process.on('SIGTERM', () => {
  closeDb()
  process.exit(0)
})

export { server, wss, restServer }
