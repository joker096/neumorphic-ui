import { WebSocketServer, WebSocket } from 'ws'
import { createServer, RequestListener } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
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
  if (req && req.socket && req.socket.remoteAddress) return req.socket.remoteAddress
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

// WebSocket handshake origin check (CSWSH defense-in-depth).
// Browsers cannot set custom WS headers, so auth rides the query string;
// validating Origin prevents cross-site WebSocket hijacking when an
// allowlist is configured. When ALLOWED_ORIGINS is unset the server stays
// permissive (dev/self-host); requests without an Origin header (native
// mobile clients, test harness) are always permitted.
function isWsOriginAllowed(req: any): boolean {
  if (ALLOWED_ORIGINS.length === 0) return true
  const origin = (req.headers && (req.headers['origin'] || req.headers['Origin'])) || ''
  if (!origin) return true
  return isOriginAllowed(origin.toString())
}

const server = createServer()
const wss = new WebSocketServer({ server, maxPayload: 1024 * 1024 })

wss.on('connection', (ws, req) => {
  const ip = getClientIp(ws)
  if (!checkConnectionRateLimit(ip)) {
    ws.close(1008, 'Too many connections')
    return
  }

  // Reject cross-origin WebSocket handshakes when an origin allowlist is set
  if (!isWsOriginAllowed(req)) {
    ws.close(1008, 'Origin not allowed')
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
        // Validate metadata payload size
        if (msg.data && typeof msg.data === 'string' && msg.data.length > 4096) {
          send({ type: 'error', message: 'Metadata payload too large' })
          return
        }
        // Only forward primitive types (string, number, boolean, null)
        if (msg.data !== undefined && msg.data !== null && !['string', 'number', 'boolean'].includes(typeof msg.data)) {
          send({ type: 'error', message: 'Invalid metadata payload type' })
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

function serveAdminFile(res: any, req: any, path: string): boolean {
  if (!path.startsWith('/admin')) return false

  // Path traversal prevention: decode and normalize
  const decodedPath = decodeURIComponent(path)
  const fileRelPath = decodedPath.replace(/^\/admin(\/|$)/, '').replace(/\.\.\//g, '').replace(/\.\.\\/g, '')
  const normalizedPath = fileRelPath
    ? join(ADMIN_DIST, fileRelPath)
    : join(ADMIN_DIST, 'index.html')
  if (!normalizedPath.startsWith(ADMIN_DIST)) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Access denied' }))
    return true
  }
  // Block any path still containing traversal sequences
  if (normalizedPath.includes('..') || /[/\\]\.\./.test(normalizedPath)) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Access denied' }))
    return true
  }

  // Directory guard: serve index.html for directory requests, 404 otherwise.
  // An unhandled exception here (e.g. readFileSync on a directory) would crash the REST server.
  try {
    if (existsSync(normalizedPath) && statSync(normalizedPath).isDirectory()) {
      const indexPath = join(normalizedPath, 'index.html')
      if (existsSync(indexPath)) {
        return writeAdminFile(res, req, indexPath)
      }
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
      return true
    }
  } catch {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
    return true
  }

  if (existsSync(normalizedPath)) {
    return writeAdminFile(res, req, normalizedPath)
  }

  return false
}

function writeAdminFile(res: any, req: any, filePath: string): boolean {
  let contentType = 'text/plain'
  if (filePath.endsWith('.html')) contentType = 'text/html'
  else if (filePath.endsWith('.css')) contentType = 'text/css'
  else if (filePath.endsWith('.js')) contentType = 'application/javascript'
  else if (filePath.endsWith('.json')) contentType = 'application/json'
  else if (filePath.endsWith('.png')) contentType = 'image/png'
  else if (filePath.endsWith('.webp')) contentType = 'image/webp'
  else if (filePath.endsWith('.ico')) contentType = 'image/x-icon'
  else if (filePath.endsWith('.svg')) contentType = 'image/svg+xml'

  const headers: Record<string, string> = { 'Content-Type': contentType }
  if (filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable'
  } else if (filePath.match(/\.(png|jpg|jpeg|gif|ico|svg|webp|woff2|woff|ttf|eot)$/)) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable'
  } else {
    headers['Cache-Control'] = 'public, max-age=3600'
  }

  const acceptEncoding = (req.headers['accept-encoding'] || '') as string
  const supportsBrotli = acceptEncoding.includes('br')
  const supportsGzip = acceptEncoding.includes('gzip')

  if (supportsBrotli && existsSync(filePath + '.br')) {
    headers['Content-Encoding'] = 'br'
    headers['Content-Type'] = contentType
    res.writeHead(200, headers)
    res.end(readFileSync(filePath + '.br'))
    return true
  }

  if (supportsGzip && existsSync(filePath + '.gz')) {
    headers['Content-Encoding'] = 'gzip'
    headers['Content-Type'] = contentType
    res.writeHead(200, headers)
    res.end(readFileSync(filePath + '.gz'))
    return true
  }

  res.writeHead(200, headers)
  res.end(readFileSync(filePath))
  return true
}

const restServer = createServer((req, res) => {
  try {
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
    if (serveAdminFile(res, req, path)) return

    // Handle API routes
    const handled =
      handleAuthRoute(req, res, path) ||
      handleStatsRoute(req, res, path) ||
      handleAdsRoute(req, res, path)

    if (!handled) {
      res.writeHead(404)
      res.end(JSON.stringify({ error: 'Not found' }))
    }
  } catch (err) {
    // Never let a single bad request crash the REST server.
    console.error('[REST] Unhandled error:', err)
    try {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Internal server error' }))
      }
    } catch {
      // socket already destroyed
    }
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
