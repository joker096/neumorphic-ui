import { MeshRouter } from './MeshRouter';

const K = 20;

export class KBucket {
  private peers: Map<string, { peerId: string; address: string; lastSeen: number }> = new Map();
  private capacity: number;

  constructor(capacity: number = K) {
    this.capacity = capacity;
  }

  add(peerId: string, address: string): boolean {
    if (this.peers.has(peerId)) {
      const entry = this.peers.get(peerId)!;
      entry.lastSeen = Date.now();
      return true;
    }
    if (this.peers.size >= this.capacity) return false;
    this.peers.set(peerId, { peerId, address, lastSeen: Date.now() });
    return true;
  }

  remove(peerId: string): void { this.peers.delete(peerId); }

  find(peerId: string): string | null {
    const entry = this.peers.get(peerId);
    return entry ? entry.address : null;
  }

  getAll(): string[] { return Array.from(this.peers.keys()); }
  size(): number { return this.peers.size; }
}

interface StoredValue { key: string; value: string; timestamp: number; }

export class DHTNode {
  nodeId: string;
  private buckets: KBucket[] = [];
  private store: Map<string, StoredValue> = new Map();
  private router: MeshRouter | null = null;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
    for (let i = 0; i < 160; i++) {
      this.buckets.push(new KBucket(K));
    }
  }

  attachRouter(router: MeshRouter): void {
    this.router = router;
    router.onForward((msg) => {
      if ((msg as any).type === 'dht-find-node') this.handleFindNode(msg as any);
      if ((msg as any).type === 'dht-store') this.handleStore(msg as any);
    });
  }

  addPeer(peerId: string): void {
    const bucketIndex = this.bucketIndex(peerId);
    if (bucketIndex >= 0 && bucketIndex < this.buckets.length) {
      this.buckets[bucketIndex].add(peerId, 'p2p:' + peerId);
    }
  }

  removePeer(peerId: string): void {
    const bucketIndex = this.bucketIndex(peerId);
    if (bucketIndex >= 0 && bucketIndex < this.buckets.length) {
      this.buckets[bucketIndex].remove(peerId);
    }
  }

  findNode(targetId: string): string[] {
    const bucketIndex = this.bucketIndex(targetId);
    if (bucketIndex >= 0 && bucketIndex < this.buckets.length) {
      return this.buckets[bucketIndex].getAll();
    }
    return [];
  }

  storeValue(key: string, value: string): void {
    this.store.set(key, { key, value, timestamp: Date.now() });
  }

  findValue(key: string): string | null {
    return this.store.get(key)?.value ?? null;
  }

  getKnownPeers(): string[] {
    const peers: Set<string> = new Set();
    for (const bucket of this.buckets) {
      for (const peer of bucket.getAll()) peers.add(peer);
    }
    return Array.from(peers);
  }

  private bucketIndex(peerId: string): number {
    return this.simpleHash(peerId) % 160;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private handleFindNode(msg: any): void {
    const peers = this.findNode(msg.targetId);
    if (this.router) {
      const response = { type: 'dht-nodes', from: this.nodeId, to: msg.from, nodes: peers };
      (this.router as any).broadcastFn?.(JSON.stringify(response));
    }
  }

  private handleStore(msg: any): void {
    this.storeValue(msg.key, msg.value);
  }
}

export function createDHTNode(peerId: string): DHTNode {
  return new DHTNode(peerId);
}
