import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'node:http'

const PORT = parseInt(process.env.PORT || '8765', 10)

const clients = new Map<string, WebSocket>()

const server = createServer()
const wss = new WebSocketServer({ server, maxPayload: 1024 * 1024 })

wss.on('connection', (ws) => {
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
