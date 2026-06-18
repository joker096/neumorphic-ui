export interface RouteEntry {
  peerId: string
  nextHop: string
  hops: number
  lastSeen: number
  ttl: number
}

export interface PeerGraph {
  [peerId: string]: string[]
}

export interface MeshForwardMessage {
  type: 'mesh-forward'
  from: string
  to: string
  senderId: string
  payload: string
  messageId: string
  ttl: number
  path: string[]
}

export interface MeshRouteAdvert {
  type: 'mesh-route-advert'
  from: string
  knownPeers: string[]
  timestamp: number
}

const MAX_TTL = 7
const ROUTE_TIMEOUT = 5 * 60 * 1000
const ADVERT_INTERVAL = 30 * 1000

export class MeshRouter {
  private routes: Map<string, RouteEntry> = new Map()
  private peerId: string
  private directPeers: Set<string> = new Set()
  private forwardCallbacks: Set<(msg: MeshForwardMessage) => void> = new Set()
  private routeChangeCallbacks: Set<() => void> = new Set()
  private advertTimer: ReturnType<typeof setInterval> | null = null
  private broadcastFn: ((data: string) => void) | null = null

  constructor(peerId: string) {
    this.peerId = peerId
  }

  start(broadcast: (data: string) => void): void {
    this.broadcastFn = broadcast
    this.advertTimer = setInterval(() => this.advertise(), ADVERT_INTERVAL)
    this.advertise()
  }

  stop(): void {
    if (this.advertTimer) {
      clearInterval(this.advertTimer)
      this.advertTimer = null
    }
    this.broadcastFn = null
  }

  addDirectPeer(peerId: string): void {
    this.directPeers.add(peerId)
    this.updateRoute(peerId, peerId, 1)
    this.notifyRouteChange()
  }

  removeDirectPeer(peerId: string): void {
    this.directPeers.delete(peerId)
    this.routes.delete(peerId)
    this.pruneRoutesThrough(peerId)
    this.notifyRouteChange()
  }

  private pruneRoutesThrough(peerId: string): void {
    for (const [id, route] of this.routes) {
      if (route.nextHop === peerId) {
        this.routes.delete(id)
      }
    }
  }

  private updateRoute(peerId: string, nextHop: string, hops: number): void {
    const existing = this.routes.get(peerId)
    if (!existing || existing.hops > hops || (existing.hops === hops && existing.nextHop === nextHop)) {
      this.routes.set(peerId, {
        peerId,
        nextHop,
        hops,
        lastSeen: Date.now(),
        ttl: ROUTE_TIMEOUT,
      })
    }
  }

  getRoute(targetPeer: string): string | null {
    const now = Date.now()
    if (this.directPeers.has(targetPeer)) return targetPeer

    const route = this.routes.get(targetPeer)
    if (!route) return null
    if (now - route.lastSeen > route.ttl) {
      this.routes.delete(targetPeer)
      return null
    }
    return route.nextHop
  }

  isDirectlyConnected(peerId: string): boolean {
    return this.directPeers.has(peerId)
  }

  canRouteTo(peerId: string): boolean {
    return this.directPeers.has(peerId) || this.routes.has(peerId)
  }

  getRoutingTable(): RouteEntry[] {
    const now = Date.now()
    const valid: RouteEntry[] = []
    for (const route of this.routes.values()) {
      if (now - route.lastSeen <= route.ttl) {
        valid.push(route)
      }
    }
    return valid
  }

  getDirectPeers(): string[] {
    return Array.from(this.directPeers)
  }

  getReachablePeers(): string[] {
    const peers = new Set(this.directPeers)
    for (const [id] of this.routes) {
      if (id !== this.peerId) peers.add(id)
    }
    return Array.from(peers)
  }

  handleRouteAdvert(msg: MeshRouteAdvert): void {
    if (msg.from === this.peerId) return
    if (!this.directPeers.has(msg.from)) return

    for (const peer of msg.knownPeers) {
      if (peer === this.peerId) continue
      this.updateRoute(peer, msg.from, 2)
    }
    this.notifyRouteChange()
  }

  handleForward(msg: MeshForwardMessage, sendDirect: (peerId: string, data: string) => void): void {
    if (msg.to === this.peerId) {
      this.forwardCallbacks.forEach(cb => cb(msg))
      return
    }

    if (msg.ttl <= 0) {
      console.warn('[MeshRouter] TTL expired for message', msg.messageId)
      return
    }

    const nextHop = this.getRoute(msg.to)
    if (!nextHop) {
      console.warn('[MeshRouter] No route to', msg.to, '- message queued')
      return
    }

    const forwarded: MeshForwardMessage = {
      ...msg,
      ttl: msg.ttl - 1,
      path: [...(msg.path || []), this.peerId],
    }

    sendDirect(nextHop, JSON.stringify(forwarded))
  }

  private advertise(): void {
    if (!this.broadcastFn) return
    const advert: MeshRouteAdvert = {
      type: 'mesh-route-advert',
      from: this.peerId,
      knownPeers: Array.from(this.directPeers),
      timestamp: Date.now(),
    }
    this.broadcastFn(JSON.stringify(advert))
  }

  onForward(callback: (msg: MeshForwardMessage) => void): () => void {
    this.forwardCallbacks.add(callback)
    return () => this.forwardCallbacks.delete(callback)
  }

  onRouteChange(callback: () => void): () => void {
    this.routeChangeCallbacks.add(callback)
    return () => this.routeChangeCallbacks.delete(callback)
  }

  private notifyRouteChange(): void {
    this.routeChangeCallbacks.forEach(cb => cb())
  }

  static createForwardMessage(from: string, to: string, senderId: string, payload: string): MeshForwardMessage {
    return {
      type: 'mesh-forward',
      from,
      to,
      senderId,
      payload,
      messageId: crypto.randomUUID(),
      ttl: MAX_TTL,
      path: [from],
    }
  }
}
