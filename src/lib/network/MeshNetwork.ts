// src/lib/network/MeshNetwork.ts
export interface MeshNodeInfo {
  publicKey: string
  address: string
  capabilities: string[]
  lastSeen: number
  latency: number
}

export interface MeshPeer {
  id: string
  connected: boolean
  latency: number
  path: string[]
}

export class MeshNetwork {
  private static peers: Map<string, MeshPeer> = new Map()
  private static nodeInfo: Map<string, MeshNodeInfo> = new Map()
  private static TTL = 3600 * 1000

  static addPeer(peer: MeshPeer): void {
    this.peers.set(peer.id, peer)
  }

  static removePeer(id: string): void {
    this.peers.delete(id)
  }

  static getPeer(id: string): MeshPeer | null {
    return this.peers.get(id) || null
  }

  static getPeers(): Map<string, MeshPeer> {
    return this.peers
  }

  static setNodeInfo(publicKey: string, info: MeshNodeInfo): void {
    this.nodeInfo.set(publicKey, { ...info, lastSeen: Date.now() })
  }

  static getNodeInfo(publicKey: string): MeshNodeInfo | null {
    const info = this.nodeInfo.get(publicKey)
    if (!info) return null
    if (Date.now() - info.lastSeen > this.TTL) {
      this.nodeInfo.delete(publicKey)
      return null
    }
    return info
  }

  static getConnectedPeers(): MeshPeer[] {
    return Array.from(this.peers.values()).filter((p) => p.connected)
  }

  static getPeerCount(): number {
    return this.peers.size
  }

  static getConnectedCount(): number {
    return this.getConnectedPeers().length
  }

  static clear(): void {
    this.peers.clear()
    this.nodeInfo.clear()
  }

  static cleanup(): void {
    const now = Date.now()
    for (const [key, info] of this.nodeInfo) {
      if (now - info.lastSeen > this.TTL) {
        this.nodeInfo.delete(key)
      }
    }
  }

  static hasPeer(id: string): boolean {
    return this.peers.has(id)
  }

  static hasNodeInfo(publicKey: string): boolean {
    return this.nodeInfo.has(publicKey)
  }
}
