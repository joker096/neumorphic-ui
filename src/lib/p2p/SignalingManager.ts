interface SignalingConnection {
  ws: WebSocket
  url: string
  connected: boolean
  reconnectAttempts: number
}

export interface SignalingMessage {
  type: string
  from?: string
  target?: string
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
  dhpk?: string
  hmacKey?: string
  data?: any
  message?: string
  messageId?: string
  ttl?: number
  path?: string[]
  payload?: string
}

export class SignalingManager {
  private connections: SignalingConnection[] = []
  private handlers: Map<string, Set<(msg: SignalingMessage) => void>> = new Map()
  private anyHandler: Set<(msg: SignalingMessage) => void> = new Set()
  private publicKey: string | null = null
  private maxReconnectAttempts = 10

  async connect(urls: string[], publicKey: string): Promise<void> {
    this.publicKey = publicKey
    const results = await Promise.allSettled(
      urls.map(url => this.connectOne(url))
    )
    const connected = results.filter(r => r.status === 'fulfilled').length
    if (connected === 0 && urls.length > 0) {
      throw new Error(`Failed to connect to any signaling server (${urls.length} tried)`)
    }
  }

  private connectOne(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let ws: WebSocket
      try {
        ws = new WebSocket(url)
      } catch (err) {
        reject(err)
        return
      }

      const conn: SignalingConnection = {
        ws, url, connected: false, reconnectAttempts: 0,
      }
      this.connections.push(conn)

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'register',
          publicKey: this.publicKey!,
        }))
      }

      ws.onmessage = (event) => {
        let msg: SignalingMessage
        try {
          msg = JSON.parse(event.data)
        } catch { return }

        if (msg.type === 'registered') {
          conn.connected = true
          conn.reconnectAttempts = 0
          resolve()
          return
        }

        if (msg.type === 'error') {
          console.error(`[SignalingManager] Server error (${url}):`, msg.message)
          return
        }

        this.dispatch(msg)
      }

      ws.onerror = () => {
        reject(new Error(`WebSocket connection failed: ${url}`))
      }

      ws.onclose = () => {
        conn.connected = false
        this.scheduleReconnect(conn)
      }
    })
  }

  private dispatch(msg: SignalingMessage): void {
    this.anyHandler.forEach(h => h(msg))
    const handlers = this.handlers.get(msg.type)
    if (handlers) handlers.forEach(h => h(msg))
  }

  onMessage(handler: (msg: SignalingMessage) => void): () => void {
    this.anyHandler.add(handler)
    return () => this.anyHandler.delete(handler)
  }

  on(type: string, handler: (msg: SignalingMessage) => void): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)
    return () => this.handlers.get(type)?.delete(handler)
  }

  send(msg: object): void {
    const json = JSON.stringify(msg)
    for (const conn of this.connections) {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(json)
      }
    }
  }

  private scheduleReconnect(conn: SignalingConnection): void {
    if (conn.reconnectAttempts >= this.maxReconnectAttempts) return
    conn.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, conn.reconnectAttempts - 1), 10000)
    setTimeout(() => {
      this.connectOne(conn.url).catch(() => {})
    }, delay)
  }

  isConnected(): boolean {
    return this.connections.some(c => c.connected)
  }

  getConnectedCount(): number {
    return this.connections.filter(c => c.connected).length
  }

  getConnectedUrls(): string[] {
    return this.connections.filter(c => c.connected).map(c => c.url)
  }

  disconnect(): void {
    for (const conn of this.connections) {
      conn.ws.onclose = null
      conn.ws.close()
    }
    this.connections = []
    this.handlers.clear()
    this.anyHandler.clear()
    this.publicKey = null
  }
}
