/**
 * Decentralized Peer Discovery — DHT + DNS-based + Bootstrap fallbacks
 * Allows peer discovery even when all central servers are blocked.
 */

export type BootstrapPeer = {
  nodeId: string;
  address: string;
  publicKey: string;
};

export type DiscoveredPeer = {
  peerId: string;
  publicKey: string;
  lastSeen: number;
  latency: number;
  path: string[];
  capabilities: string[];
};

const DHT_TABLE_KEY = 'mess_dht_table';
const PEER_HEARTBEAT_TTL = 60 * 60 * 1000; // 1 hour

// Public bootstrap peers — fallbacks if all else fails
// These should be replaced with actual bootstrap nodes in production
const DEFAULT_BOOTSTRAP_PEERS: BootstrapPeer[] = [];

/**
 * Returns a list of bootstrap peers.
 * In production, this should come from a trusted source.
 */
export function getBootstrapPeers(): BootstrapPeer[] {
  // If no custom peers are configured, return an empty list
  if (DEFAULT_BOOTSTRAP_PEERS.length === 0) {
    return []
  }
  return [...DEFAULT_BOOTSTRAP_PEERS]
}

class PeerDiscovery {
  private dhtTable: Map<string, DiscoveredPeer> = new Map();
  private bootstrapPeers: BootstrapPeer[] = [];
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private onPeerFound: ((peer: DiscoveredPeer) => void) | null = null;

  constructor() {
    this.bootstrapPeers = [...DEFAULT_BOOTSTRAP_PEERS];
    this.loadSavedPeers();
  }

  /**
   * Set custom bootstrap peers (e.g., from user config or admin panel)
   */
  setBootstrapPeers(peers: BootstrapPeer[]): void {
    this.bootstrapPeers = [...peers];
    this.savePeers();
  }

  /**
   * Set callback for discovered peers
   */
  onPeerDiscovered(callback: (peer: DiscoveredPeer) => void): void {
    this.onPeerFound = callback;
  }

  /**
   * Start DHT-based peer discovery
   */
  start(): void {
    this.loadSavedPeers();

    // Periodic heartbeat to keep peers alive
    this.heartbeatInterval = setInterval(() => {
      this.cleanup();
    }, 30000); // every 30s

    // Try to ping all known peers
    this.pingPeers();
  }

  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Discover peers using multiple methods:
   * 1. DHT lookup
   * 2. DNS-based discovery
   * 3. Bootstrap peer ping
   */
  async discoverPeers(): Promise<DiscoveredPeer[]> {
    const discovered: DiscoveredPeer[] = [];

    // Method 1: DHT lookup
    const dhtPeers = await this.dhtLookup();
    discovered.push(...dhtPeers);

    // Method 2: DNS-based discovery (if available)
    const dnsPeers = await this.dnsDiscovery();
    discovered.push(...dnsPeers);

    // Method 3: Bootstrap peers
    const bootPeers = await this.bootstrapDiscovery();
    discovered.push(...bootPeers);

    // Deduplicate
    const unique = new Map<string, DiscoveredPeer>();
    for (const peer of discovered) {
      unique.set(peer.peerId, peer);
    }

    return Array.from(unique.values());
  }

  /**
   * DHT-based peer lookup
   */
  private async dhtLookup(): Promise<DiscoveredPeer[]> {
    const results: DiscoveredPeer[] = [];
    const saved = localStorage.getItem(DHT_TABLE_KEY);
    if (saved) {
      try {
        const table = JSON.parse(saved);
        for (const [peerId, peer] of Object.entries(table)) {
          const p = peer as DiscoveredPeer;
          if (Date.now() - p.lastSeen < PEER_HEARTBEAT_TTL) {
            results.push(p);
          }
        }
      } catch {
        /* ignore */
      }
    }
    return results;
  }

  /**
   * DNS-based peer discovery (using DNS-over-HTTPS)
   * Uses DNS TXT records to discover peer addresses
   */
  private async dnsDiscovery(): Promise<DiscoveredPeer[]> {
    if (!('fetch' in window)) return [];

    const results: DiscoveredPeer[] = [];
    const domains = [
      '_mess.peer',
      '_mess-bootstrap.peer',
    ];

    for (const domain of domains) {
      try {
        const response = await fetch(`https://dns.google/dns-query?name=${domain}&type=TXT`);
        if (response.ok) {
          const data = await response.text();
          // Parse TXT records for peer addresses
          const lines = data.split('\n');
          for (const line of lines) {
            if (line.includes('v=mess1')) {
              // Extract peer address from TXT record
              const addressMatch = line.match(/addr=([^;]+)/);
              if (addressMatch) {
                results.push({
                  peerId: crypto.randomUUID(),
                  publicKey: '',
                  lastSeen: Date.now(),
                  latency: 0,
                  path: [addressMatch[1]],
                  capabilities: ['message', 'call'],
                });
              }
            }
          }
        }
      } catch {
        /* DNS discovery failed, continue */
      }
    }

    return results;
  }

  /**
   * Bootstrap discovery — ping known bootstrap servers
   */
  private async bootstrapDiscovery(): Promise<DiscoveredPeer[]> {
    const results: DiscoveredPeer[] = [];

    for (const peer of this.bootstrapPeers) {
      try {
        const ws = new WebSocket(peer.address);
        const connection = new Promise<void>((resolve, reject) => {
          ws.onopen = () => {
            ws.close();
            resolve();
          };
          ws.onerror = () => reject(new Error('Bootstrap peer unreachable'));
          setTimeout(() => {
            ws.close();
            reject(new Error('Bootstrap peer timeout'));
          }, 5000);
        });

        await connection;
        results.push({
          peerId: peer.nodeId,
          publicKey: peer.publicKey,
          lastSeen: Date.now(),
          latency: 0,
          path: [peer.address],
          capabilities: ['bootstrap'],
        });
      } catch {
        /* Bootstrap peer unreachable */
      }
    }

    return results;
  }

  /**
   * Save discovered peers to localStorage for offline use
   */
  private savePeers(): void {
    try {
      const table: Record<string, any> = {};
      for (const [peerId, peer] of this.dhtTable.entries()) {
        table[peerId] = { ...peer };
      }
      localStorage.setItem(DHT_TABLE_KEY, JSON.stringify(table));
    } catch {
      /* ignore */
    }
  }

  /**
   * Load saved peers from localStorage
   */
  private loadSavedPeers(): void {
    try {
      const saved = localStorage.getItem(DHT_TABLE_KEY);
      if (saved) {
        const table = JSON.parse(saved);
        for (const [peerId, peer] of Object.entries(table)) {
          const p = peer as DiscoveredPeer;
          if (Date.now() - p.lastSeen < PEER_HEARTBEAT_TTL) {
            this.dhtTable.set(peerId, p);
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  /**
   * Add a discovered peer to the table
   */
  addPeer(peer: DiscoveredPeer): void {
    this.dhtTable.set(peer.peerId, {
      ...peer,
      lastSeen: Date.now(),
    });
    this.savePeers();

    if (this.onPeerFound) {
      this.onPeerFound(peer);
    }
  }

  /**
   * Remove a peer from the table
   */
  removePeer(peerId: string): void {
    this.dhtTable.delete(peerId);
    this.savePeers();
  }

  /**
   * Clean up stale peers
   */
  private cleanup(): void {
    const now = Date.now();
    let changed = false;
    for (const [peerId, peer] of this.dhtTable.entries()) {
      if (now - peer.lastSeen > PEER_HEARTBEAT_TTL) {
        this.dhtTable.delete(peerId);
        changed = true;
      }
    }
    if (changed) {
      this.savePeers();
    }
  }

  /**
   * Ping all known peers to verify connectivity
   */
  private async pingPeers(): Promise<void> {
    for (const [, peer] of this.dhtTable.entries()) {
      try {
        const start = Date.now();
        const ws = new WebSocket(peer.path[0]);
        await new Promise<void>((resolve, reject) => {
          ws.onopen = () => {
            ws.close();
            resolve();
          };
          ws.onerror = () => reject(new Error('Peer unreachable'));
          setTimeout(() => {
            ws.close();
            reject(new Error('Peer timeout'));
          }, 3000);
        });
        peer.latency = Date.now() - start;
        peer.lastSeen = Date.now();
      } catch {
        this.removePeer(peer.peerId);
      }
    }
  }

  /**
   * Get all known peers
   */
  getPeers(): DiscoveredPeer[] {
    return Array.from(this.dhtTable.values());
  }

  /**
   * Reset discovery state
   */
  reset(): void {
    this.dhtTable.clear();
    this.savePeers();
  }
}

export const peerDiscovery = new PeerDiscovery();
