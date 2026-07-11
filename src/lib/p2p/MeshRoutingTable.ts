// src/lib/p2p/MeshRoutingTable.ts
// Kadabra-style routing table that stores peer information
// discovered through the DHT.

export interface MeshNode {
  nodeId: string;
  publicKey: string;
  peerId: string;
  lastSeen: number;
  hops: number;
  path: string[];
  latency?: number;
  [key: string]: any;
}

export class MeshRoutingTable {
  private static table = new Map<string, MeshNode>();
  private static TTL = 3600 * 1000; // 1 hour
  private static lookupCache = new Map<string, MeshNode[]>();

  static addNode(node: MeshNode): void {
    // Update by nodeId (primary key)
    this.table.set(node.nodeId, {
      ...node,
      lastSeen: Date.now(),
      publicKey: node.publicKey || node.peerId,
      peerId: node.peerId,
    });
  }

  static getNode(nodeId: string): MeshNode | null {
    const node = this.table.get(nodeId);
    if (!node) return null;
    if (Date.now() - node.lastSeen > this.TTL) {
      this.table.delete(nodeId);
      return null;
    }
    return { ...node };
  }

  static getNodeByPeerId(peerId: string): MeshNode | null {
    for (const node of this.table.values()) {
      if (node.peerId === peerId || node.publicKey === peerId) {
        return { ...node };
      }
    }
    return null;
  }

  static removeNode(publicKey: string): void {
    for (const [key, node] of this.table) {
      if (node.publicKey === publicKey || node.peerId === publicKey) {
        this.table.delete(key);
        break;
      }
    }
  }

  /**
   * Get nodes closest to a target nodeId.
   * Uses Kadabra-style distance metric (XOR of hex strings).
   */
  static getClosestNodes(target: string, count: number = 3): MeshNode[] {
    const cached = this.lookupCache.get(target);
    if (cached && cached.length > 0) return cached;

    const nodes = Array.from(this.table.values());
    nodes.sort((a, b) => {
      if (a.latency !== undefined && b.latency !== undefined) {
        return a.latency - b.latency;
      }
      return this.distance(a.nodeId, target) - this.distance(b.nodeId, target);
    });

    const result = nodes.slice(0, count);
    this.lookupCache.set(target, result);
    return result;
  }

  /**
   * Kadabra distance metric: XOR of hex strings.
   */
  private static distance(a: string, b: string): number {
    if (!a || !b) return 999999;
    const len = Math.max(a.length, b.length);
    let diff = 0;
    for (let i = 0; i < len; i++) {
      const ca = i < a.length ? a.charCodeAt(i) : 0;
      const cb = i < b.length ? b.charCodeAt(i) : 0;
      diff += Math.abs(ca - cb);
    }
    return diff;
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [key, node] of this.table) {
      if (now - node.lastSeen > this.TTL) {
        this.table.delete(key);
      }
    }
  }

  static clear(): void {
    this.table.clear();
    this.lookupCache.clear();
  }

  static getTable(): Map<string, MeshNode> {
    return new Map(this.table);
  }
}