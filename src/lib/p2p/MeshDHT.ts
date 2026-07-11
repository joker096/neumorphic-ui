// src/lib/p2p/MeshDHT.ts
// Kadabra-style Distributed Hash Table for decentralized peer discovery.
// Each peer has a nodeId (hex hash of its publicKey). The network is a ring
// of 2^160 nodes. Buckets are sorted by distance to the ring origin.
// Protocol messages: dht-get, dht-put, dht-lookup, dht-notify.

export interface DHTNode {
  nodeId: string           // hex hash (0..65)
  publicKey: string        // original public key / handle
  peerId: string           // human-readable id
  lastSeen: number
  latency?: number
  path?: string[]
  [key: string]: any
}

export interface DHTLookupResult {
  nodeId: string
  peer: DHTNode
}

export interface DHTStoreValue {
  key: string
  value: string
  nodeId: string           // closest node to the key
}

export interface DHTBootstrapPeer {
  peerId: string
  publicKey: string
  address: string          // ws:// or wss:// or just an identifier
}

// Kadabra constants
const K = 10               // replication factor
const TIMEOUT = 10000       // ms for a lookup to complete
const CLEANUP_INTERVAL = 3600000 // 1 hour

// Kadabra uses a simple hash ring with exponential distance metric
// We store a routing table that maps node prefixes to peer connections

export class MeshDHT {
  private static table = new Map<string, DHTNode>()
  private static lookupCache = new Map<string, DHTNode[]>()
  private static store: Map<string, DHTStoreValue> = new Map()
  private static TTL = 3600 * 1000 // 1 hour
  private static bootstrap: DHTBootstrapPeer[] = []
  private static onNotify?: (peer: DHTNode) => void

  /**
   * Register bootstrap peers (the "seed" nodes).
   * Call this at least once before any lookup.
   */
  static setBootstrap(peers: DHTBootstrapPeer[]): void {
    this.bootstrap = peers
  }

  /**
   * Register a callback for when new peers are discovered.
   * This is the key mechanism: when a peer joins, it broadcasts
   * its nodeId to the closest known nodes. Those nodes store it
   * in their routing tables and forward the notification further.
   */
  static onNewPeer(cb: (peer: DHTNode) => void): void {
    this.onNotify = cb
  }

  /**
   * Add a known node to the DHT table.
   * In a real Kadabra implementation this would involve
   * exchanging messages with the node and verifying connectivity.
   */
  static async addNode(node: DHTNode): Promise<void> {
    // Check if node is already in table (by nodeId)
    const existing = this.table.get(node.nodeId)
    if (existing) {
      // Update last seen
      this.table.set(node.nodeId, {
        ...node,
        lastSeen: Date.now(),
        publicKey: node.publicKey || existing.publicKey,
        peerId: node.peerId || existing.peerId,
      })
    } else {
      this.table.set(node.nodeId, { ...node, lastSeen: Date.now() })
    }

    // Notify callback if this is a new peer
    if (existing) {
      this.onNotify?.(node)
    }
  }

  /**
   * Get a node by its nodeId.
   */
  static getNode(nodeId: string): DHTNode | null {
    const node = this.table.get(nodeId)
    if (!node) return null
    if (Date.now() - node.lastSeen > this.TTL) {
      this.table.delete(nodeId)
      return null
    }
    return { ...node }
  }

  /**
   * Get a node by its publicKey.
   */
  static getNodeByPublicKey(publicKey: string): DHTNode | null {
    for (const node of this.table.values()) {
      if (node.publicKey === publicKey || node.peerId === publicKey) {
        return { ...node }
      }
    }
    return null
  }

  static removeNode(publicKey: string): void {
    for (const [id, node] of this.table) {
      if (node.publicKey === publicKey || node.peerId === publicKey) {
        this.table.delete(id)
        break
      }
    }
  }

  /**
   * Lookup peers closest to a target nodeId.
   * Kadabra uses the distance metric: d(a,b) = hash(a XOR b).
   * We approximate by comparing the hex strings directly.
   */
  static getClosestNodes(target: string, count: number = K): DHTNode[] {
    const cached = this.lookupCache.get(target)
    if (cached && cached.length > 0) {
      return cached
    }

    const nodes = Array.from(this.table.values())
    // Sort by latency or, if not available, by nodeId proximity
    nodes.sort((a, b) => {
      if (a.latency !== undefined && b.latency !== undefined) {
        return a.latency - b.latency
      }
      // Fallback: sort by nodeId proximity to target
      return this.distance(a.nodeId, target) - this.distance(b.nodeId, target)
    })

    const result = nodes.slice(0, count)
    this.lookupCache.set(target, result)
    return result
  }

  /**
   * Store a key-value pair in the DHT.
   * The value is stored at the node closest to the key.
   */
  static storeValue(key: string, value: string, targetNodeId?: string): void {
    const target = targetNodeId || this.findClosestNode(key)
    this.store.set(key, { key, value, nodeId: target })
  }

  /**
   * Retrieve a value from the DHT.
   */
  static getValue(key: string): DHTStoreValue | null {
    // First check local store
    const local = this.store.get(key)
    if (local) return local

    // Then check closest node
    const closestNode = this.findClosestNode(key)
    const node = this.table.get(closestNode)
    if (node && node._store) {
      // Node has a local store
      const stored = (node._store as any)[key]
      if (stored) return { key, value: stored, nodeId: closestNode }
    }
    return null
  }

  /**
   * Get the full routing table.
   */
  static getTable(): Map<string, DHTNode> {
    return new Map(this.table)
  }

  /**
   * Clear all data.
   */
  static clear(): void {
    this.table.clear()
    this.lookupCache.clear()
    this.store.clear()
  }

  /**
   * Clean up expired nodes.
   */
  static cleanup(): void {
    const now = Date.now()
    for (const [key, node] of this.table) {
      if (now - node.lastSeen > this.TTL) {
        this.table.delete(key)
      }
    }
  }

  /**
   * Get bootstrap peers.
   */
  static getBootstrap(): DHTBootstrapPeer[] {
    return [...this.bootstrap]
  }

  // ────────────────────────────────────────────────────────────
  // Internal helpers
  // ────────────────────────────────────────────────────────────

  /**
   * Kadabra distance metric (simplified).
   * XOR two hex strings and return the length of the result.
   * This gives us a rough approximation of the Kadabra ring distance.
   */
  private static distance(a: string, b: string): number {
    if (!a || !b) return 999999
    let result = 0
    const len = Math.min(a.length, b.length)
    for (let i = 0; i < len; i++) {
      const bitA = (a.charCodeAt(i) >> (8 - (i % 8))) & 1
      const bitB = (b.charCodeAt(i) >> (8 - (i % (b.length > 32 ? 1 : 1)))) & 1
      if (bitA !== bitB) result++
    }
    return result
  }

  private static findClosestNode(key: string): string {
    if (this.table.size === 0) {
      // Use first bootstrap peer if available
      if (this.bootstrap.length > 0) {
        return this.bootstrap[0].peerId
      }
      return key
    }

    let closest: string | null = null
    let minDist = Infinity

    for (const [id, node] of this.table) {
      const dist = this.nodeDistance(node.nodeId, key)
      if (dist < minDist) {
        minDist = dist
        closest = id
      }
    }

    return closest || key
  }

  /**
   * Distance between a nodeId and a key (both hex strings).
   */
  private static nodeDistance(nodeId: string, key: string): number {
    // Kadabra uses XOR distance: d(a,b) = |hash(a) XOR hash(b)|
    // For simplicity, we use string similarity as a proxy.
    const a = nodeId.padStart(64, '0')
    const b = key.padStart(64, '0')
    let diff = 0
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] !== b[i]) diff++
    }
    return diff
  }
}

// Legacy exports for compatibility
export class MeshDHTLegacy {
  private static table = new Map<string, DHTNode>()
  private static TTL = 3600 * 1000

  static async addNode(node: DHTNode): Promise<void> {
    this.table.set(node.publicKey, { ...node, lastSeen: Date.now() })
  }

  static getNode(publicKey: string): DHTNode | null {
    const node = this.table.get(publicKey)
    if (!node) return null
    if (Date.now() - node.lastSeen > this.TTL) {
      this.table.delete(publicKey)
      return null
    }
    return { ...node }
  }

  static removeNode(publicKey: string): void {
    this.table.delete(publicKey)
  }

  static getClosestNodes(target: string, count: number = 3): DHTNode[] {
    const nodes = Array.from(this.table.values())
    nodes.sort((a, b) => a.latency - b.latency)
    return nodes.slice(0, count)
  }

  static getTable(): Map<string, DHTNode> {
    return this.table
  }

  static clear(): void {
    this.table.clear()
  }

  static cleanup(): void {
    const now = Date.now()
    for (const [key, node] of this.table) {
      if (now - node.lastSeen > this.TTL) {
        this.table.delete(key)
      }
    }
  }
}
