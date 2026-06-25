import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'node:http'
import jwt from 'jsonwebtoken'

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
    if (registeredKey && clients.get(registeredKey) === ws) {
      clients.delete(registeredKey)
    }
  })

  ws.on('error', () => {
    if (registeredKey && clients.get(registeredKey) === ws) {
      clients.delete(registeredKey)
    }
  })
})

server.listen(PORT, () => {
  console.log(`[Mess&Anger] Signaling server listening on port ${PORT}`)
})

export { server, wss }
