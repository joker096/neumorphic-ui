import { WebSocketServer, WebSocket } from 'ws'
import { createServer, IncomingMessage } from 'node:http'
import { lookup } from 'geoip-lite'
import { logConnection, logDisconnection, closeDb } from './db.js'

const PORT = parseInt(process.env.PORT || '8765', 10)

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:4173,http://localhost:3000').split(',')

const clients = new Map<string, WebSocket>()

const server = createServer()
const wss = new WebSocketServer({ server, maxPayload: 1024 * 1024 })

wss.on('connection', (ws, req: IncomingMessage) => {
  const origin = req.headers.origin
  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`Connection rejected from origin: ${origin}`)
    ws.close(4001, 'Origin not allowed')
    return
  }
  let registeredKey: string | null = null
  const ip = req.socket?.remoteAddress || 'unknown'
  const ua = req.headers?.['user-agent'] || ''

  const send = (data: object) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }

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
        const geo = lookup(ip)
        logConnection(registeredKey, ip, ua, geo?.country || undefined)
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
          ...(msg.dhpk ? { dhpk: msg.dhpk } : {}),
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

// --- REST API Server (port 8766) ---
import { createServer as createRestServer } from 'node:http'
import { handleAuthRoute } from './routes/auth.js'
import { handleStatsRoute } from './routes/stats.js'
import { handleAdsRoute } from './routes/ads.js'

const REST_PORT = parseInt(process.env.REST_PORT || '8766', 10)

const restServer = createRestServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const path = url.pathname

  res.setHeader('Content-Type', 'application/json')
  const origin = req.headers.origin
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // CSP violation report collector
  if (path === '/api/csp-report' && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const report = JSON.parse(body)
        console.warn('[CSP Violation]', JSON.stringify(report, null, 2))
      } catch { /* ignore malformed reports */ }
      res.writeHead(204)
      res.end()
    })
    return
  }

  const handled =
    handleAuthRoute(req, res, path) ||
    handleStatsRoute(req, res, path) ||
    handleAdsRoute(req, res, path)

  if (!handled) {
    res.writeHead(404)
    res.end(JSON.stringify({ error: 'Not found' }))
  }
})

restServer.listen(REST_PORT, () => {
  console.log(`[Mess&Anger] REST API listening on port ${REST_PORT}`)
})

export { server, wss, restServer }
