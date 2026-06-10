import { P2PTransport } from './P2PTransport'

export interface PeerConnection {
  peerId: string
  connected: boolean
  lastSeen: number
  bandwidth?: number
  latency?: number
}

export interface BroadcastMessage {
  senderId: string
  data: any
  timestamp: number
  messageId: string
}

export interface P2PNetworkOptions {
  peerId?: string
  signalingUrl?: string
  maxPeers?: number
}

const DEFAULT_MAX_PEERS = 10
const DEFAULT_SIGNALING_URL = 'ws://localhost:8765'

export class P2PNetwork {
  private peerId: string
  private peers: Map<string, PeerConnection> = new Map()
  private transports: Map<string, P2PTransport> = new Map()
  private messageHandlers: Set<(msg: BroadcastMessage) => void> = new Set()
  private connectionCallbacks: Set<(peerId: string) => void> = new Set()
  private disconnectionCallbacks: Set<(peerId: string) => void> = new Set()
  private isInitialized = false
  private signalingUrl: string
  private maxPeers: number

  constructor(options: P2PNetworkOptions = {}) {
    this.peerId = options.peerId || crypto.randomUUID()
    this.signalingUrl = options.signalingUrl || DEFAULT_SIGNALING_URL
    this.maxPeers = options.maxPeers || DEFAULT_MAX_PEERS
  }

  async init(options?: Partial<P2PNetworkOptions>): Promise<void> {
    if (options) {
      if (options.signalingUrl) this.signalingUrl = options.signalingUrl
      if (options.peerId) this.peerId = options.peerId
      if (options.maxPeers) this.maxPeers = options.maxPeers
    }
    this.isInitialized = true
    window.addEventListener('online', () => this.handleNetworkChange(true))
    window.addEventListener('offline', () => this.handleNetworkChange(false))
  }

  private handleNetworkChange(_online: boolean): void {
    for (const transport of this.transports.values()) {
      transport.connect().catch(() => {})
    }
  }

  async connect(peerId: string): Promise<void> {
    if (this.transports.has(peerId)) return

    if (this.peers.size >= this.maxPeers) {
      throw new Error(`Max peers (${this.maxPeers}) reached`)
    }

    this.peers.set(peerId, {
      peerId,
      connected: false,
      lastSeen: Date.now(),
    })

    const transport = new P2PTransport({
      signalingUrl: this.signalingUrl,
      localPublicKey: this.peerId,
      onMessage: (data: string) => {
        const msg: BroadcastMessage = {
          senderId: peerId,
          data,
          timestamp: Date.now(),
          messageId: crypto.randomUUID(),
        }
        this.messageHandlers.forEach((h) => h(msg))
      },
      onConnected: (id: string) => {
        const peer = this.peers.get(id)
        if (peer) {
          peer.connected = true
          peer.lastSeen = Date.now()
        }
        this.connectionCallbacks.forEach((cb) => cb(id))
      },
      onDisconnected: (id: string) => {
        const peer = this.peers.get(id)
        if (peer) {
          peer.connected = false
        }
        this.disconnectionCallbacks.forEach((cb) => cb(id))
      },
    })

    try {
      await transport.connect()
      await transport.call(peerId)
      this.transports.set(peerId, transport)
    } catch (err) {
      this.peers.delete(peerId)
      transport.disconnect()
      throw err
    }
  }

  disconnect(peerId: string): void {
    const transport = this.transports.get(peerId)
    if (transport) {
      transport.disconnect()
      this.transports.delete(peerId)
    }
    this.peers.delete(peerId)
    this.disconnectionCallbacks.forEach((cb) => cb(peerId))
  }

  broadcast(data: any): void {
    if (!this.isInitialized) {
      throw new Error('Network not initialized. Call init() first.')
    }

    const msg: BroadcastMessage = {
      senderId: this.peerId,
      data,
      timestamp: Date.now(),
      messageId: crypto.randomUUID(),
    }

    for (const [peerId, transport] of this.transports) {
      try {
        transport.send(JSON.stringify(msg))
      } catch (err) {
        console.error(`[P2PNetwork] Failed to send to ${peerId}:`, err)
      }
    }
  }

  onMessage(handler: (msg: BroadcastMessage) => void): void {
    this.messageHandlers.add(handler)
  }

  onConnection(callback: (peerId: string) => void): void {
    this.connectionCallbacks.add(callback)
  }

  onDisconnection(callback: (peerId: string) => void): void {
    this.disconnectionCallbacks.add(callback)
  }

  getPeers(): PeerConnection[] {
    return Array.from(this.peers.values())
  }

  getPeerCount(): number {
    return this.peers.size
  }

  isConnected(peerId: string): boolean {
    return this.peers.get(peerId)?.connected || false
  }

  getMetrics(): {
    peerCount: number
    connectedPeers: number
    totalMessagesSent: number
    totalMessagesReceived: number
  } {
    let connectedPeers = 0
    for (const peer of this.peers.values()) {
      if (peer.connected) connectedPeers++
    }
    return {
      peerCount: this.peers.size,
      connectedPeers,
      totalMessagesSent: 0,
      totalMessagesReceived: 0,
    }
  }
}

export const p2pNetwork = new P2PNetwork()
