// src/lib/p2p/network.ts
// Kadabra-style P2P network that uses DHT for peer discovery
// instead of a central signaling server.

import type { P2PTransport } from './P2PTransport';
import { MeshDHT, DHTBootstrapPeer } from './MeshDHT';
import { MeshRouterCore, MeshRouterSingleton } from './MeshRouter';
import { useAppStore } from '../../store';

export interface PeerConnection {
  peerId: string;
  nodeId: string;
  connected: boolean;
  lastSeen: number;
  latency?: number;
  bandwidth?: number;
}

export interface BroadcastMessage {
  senderId: string;
  data: any;
  timestamp: number;
  messageId: string;
}

export interface P2PNetworkOptions {
  peerId?: string;
  peerPublicKey?: string;
  bootstrapPeers?: DHTBootstrapPeer[];
  maxPeers?: number;
}

const DEFAULT_MAX_PEERS = 10;
const DEFAULT_PEER_ID = crypto.randomUUID();

export type P2PConnectionCallback = (peerId: string) => void;

export class P2PNetwork {
  private peerId: string;
  private peerPublicKey: string;
  private peers: Map<string, PeerConnection> = new Map();
  private transports: Map<string, P2PTransport> = new Map();
  private messageHandlers: Set<(msg: BroadcastMessage) => void> = new Set();
  private typingHandlers: Set<(name: string, isTyping: boolean) => void> = new Set();
  private connectionCallbacks: Set<(peerId: string) => void> = new Set();
  private disconnectionCallbacks: Set<(peerId: string) => void> = new Set();
  private isInitialized = false;
  private maxPeers: number;
  private router: MeshRouterCore;
  private dht: typeof MeshDHT;

  constructor(options: P2PNetworkOptions = {}) {
    this.peerId = options.peerId || DEFAULT_PEER_ID;
    this.peerPublicKey = options.peerPublicKey || this.peerId;
    this.maxPeers = options.maxPeers || DEFAULT_MAX_PEERS;
    this.router = new MeshRouterCore(this.peerId);
    this.dht = MeshDHT;

    // Register bootstrap peers if provided
    if (options.bootstrapPeers && options.bootstrapPeers.length > 0) {
      MeshDHT.setBootstrap(options.bootstrapPeers);
    }

    // Listen for new peer discoveries
    MeshDHT.onNewPeer((peer) => {
      // Try to connect to this peer
      this.connectToPeer(peer.peerId).catch(() => {});
    });
  }

  /**
   * Initialize the network.
   */
  async init(options?: Partial<P2PNetworkOptions>): Promise<void> {
    if (options) {
      if (options.bootstrapPeers) {
        MeshDHT.setBootstrap(options.bootstrapPeers);
      }
      if (options.peerId) {
        this.peerId = options.peerId;
        this.router = new MeshRouterCore(this.peerId);
      }
      if (options.maxPeers) {
        this.maxPeers = options.maxPeers;
      }
    }
    this.isInitialized = true;

    // Start the mesh router
    const broadcastFn = (data: string) => {
      this.broadcastRaw(data);
    };
    this.router.start(broadcastFn);

    // Register our node in the DHT
    MeshDHT.addNode({
      nodeId: this.peerId,
      publicKey: this.peerPublicKey,
      peerId: this.peerId,
      lastSeen: Date.now(),
      path: [this.peerId],
    });

    // Handle network changes
    const onOnline = () => this.handleNetworkChange(true);
    const onOffline = () => this.handleNetworkChange(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    if (typeof window !== 'undefined') {
      (this as any).__cleanupOnline = onOnline;
      (this as any).__cleanupOffline = onOffline;
    }
  }

  private broadcastRaw(data: string): void {
    // This is called by the router when it needs to broadcast
    // In a real Kadabra implementation, this would send data
    // to all direct peers via WebRTC data channels.
  }

  private handleNetworkChange(_online: boolean): void {
    for (const transport of this.transports.values()) {
      transport.connect().catch(() => {});
    }
  }

  /**
   * Connect to a peer.
   * In a Kadabra network, this involves:
   * 1. Looking up the peer in the DHT
   * 2. Establishing a direct WebRTC connection
   * 3. Adding the peer to the routing table
   */
  async connect(peerId: string): Promise<void> {
    return this.connectToPeer(peerId);
  }

  private async connectToPeer(peerId: string): Promise<void> {
    if (this.transports.has(peerId)) return;

    if (this.peers.size >= this.maxPeers) {
      throw new Error(`Max peers (${this.maxPeers}) reached`);
    }

    // Register peer in our local table
    this.peers.set(peerId, {
      peerId,
      nodeId: peerId,
      connected: false,
      lastSeen: Date.now(),
    });

    // Add to mesh router
    this.router.addDirectPeer(peerId);

    // Add to DHT
    await MeshDHT.addNode({
      nodeId: peerId,
      publicKey: peerId,
      peerId,
      lastSeen: Date.now(),
      path: [peerId],
    });

    // Create transport (this would use WebRTC in production)
    const obfuscationEnabled = useAppStore.getState().obfuscationEnabled;
    const { P2PTransport: Transport } = await import('./P2PTransport');
    const { getMasterKeySet } = await import('../identity/masterKey');
    const identity = await getMasterKeySet().catch(() => null);
    const transport = new Transport({
      signalingUrl: '', // No signaling URL needed in Kadabra
      localPublicKey: this.peerPublicKey,
      obfuscationEnabled,
      identitySecretKey: identity?.ed25519Secret,
      identityPublicKey: identity?.ed25519Public,
      onMessage: (data: string) => {
        const msg: BroadcastMessage = {
          senderId: peerId,
          data,
          timestamp: Date.now(),
          messageId: crypto.randomUUID(),
        };
        this.messageHandlers.forEach((h) => h(msg));
      },
      onConnected: (id: string) => {
        const peer = this.peers.get(id);
        if (peer) {
          peer.connected = true;
          peer.lastSeen = Date.now();
        }
        this.connectionCallbacks.forEach((cb) => cb(id));
      },
      onDisconnected: (id: string) => {
        const peer = this.peers.get(id);
        if (peer) {
          peer.connected = false;
        }
        this.disconnectionCallbacks.forEach((cb) => cb(id));
      },
    });

    transport.onMetadataSignal((type, data) => {
      if (type === 'typing-indicator') {
        const name = typeof data?.name === 'string' ? data.name : String(data?.name ?? '');
        if (name) this.typingHandlers.forEach((h) => h(name, !!data?.isTyping));
      }
    });

    try {
      await transport.connect();
      await transport.call(peerId);
      this.transports.set(peerId, transport);
    } catch (err) {
      this.peers.delete(peerId);
      this.router.removeDirectPeer(peerId);
      transport.disconnect();
      throw err;
    }
  }

  disconnect(peerId: string): void {
    const transport = this.transports.get(peerId);
    if (transport) {
      transport.disconnect();
      this.transports.delete(peerId);
    }
    this.peers.delete(peerId);
    this.router.removeDirectPeer(peerId);
    this.disconnectionCallbacks.forEach((cb) => cb(peerId));
  }

  async broadcast(data: any): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Network not initialized. Call init() first.');
    }

    const msg: BroadcastMessage = {
      senderId: this.peerId,
      data,
      timestamp: Date.now(),
      messageId: crypto.randomUUID(),
    };

    const promises = Array.from(this.transports.entries()).map(([peerId, transport]) => {
      try {
        return transport.send(JSON.stringify(msg));
      } catch (err) {
        console.error(`[P2PNetwork] Failed to send to ${peerId}:`, err);
      }
    });
    await Promise.allSettled(promises);
  }

  onMessage(handler: (msg: BroadcastMessage) => void): void {
    this.messageHandlers.add(handler);
  }

  onConnection(callback: P2PConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  onDisconnection(callback: P2PConnectionCallback): () => void {
    this.disconnectionCallbacks.add(callback);
    return () => this.disconnectionCallbacks.delete(callback);
  }

  /**
   * Subscribe to incoming typing-indicator signals from any connected peer.
   * Handler receives the sending contact's `name` and the typing state.
   * Returns an unsubscribe function.
   */
  onTypingIndicator(callback: (name: string, isTyping: boolean) => void): () => void {
    this.typingHandlers.add(callback);
    return () => this.typingHandlers.delete(callback);
  }

  /**
   * Broadcast a typing-indicator signal to every connected peer.
   * The local contact `name` is included so receivers can map it to a chat.
   */
  sendTypingIndicator(name: string, isTyping: boolean): void {
    if (!name) return;
    for (const transport of this.transports.values()) {
      try {
        transport.sendMetadataSignal('typing-indicator', { isTyping, name });
      } catch {
        /* transport not ready — ignore */
      }
    }
  }

  getPeers(): PeerConnection[] {
    return Array.from(this.peers.values());
  }

  getPeerCount(): number {
    return this.peers.size;
  }

  isConnected(peerId: string): boolean {
    return this.peers.get(peerId)?.connected || false;
  }

  getMetrics(): {
    peerCount: number;
    connectedPeers: number;
    totalMessagesSent: number;
    totalMessagesReceived: number;
  } {
    let connectedPeers = 0;
    for (const peer of this.peers.values()) {
      if (peer.connected) connectedPeers++;
    }
    return {
      peerCount: this.peers.size,
      connectedPeers,
      totalMessagesSent: 0,
      totalMessagesReceived: 0,
    };
  }

  /**
   * Get the DHT routing table.
   */
  getDHTTable(): Map<string, any> {
    return MeshDHT.getTable();
  }

  /**
   * Get the mesh routing table.
   */
  getMeshRoutes(): any[] {
    return this.router.getRoutingTable();
  }

  /**
   * Get the mesh router instance.
   */
  getRouter(): MeshRouterCore {
    return this.router;
  }

  /**
   * Clean up and disconnect.
   */
  cleanup(): void {
    for (const transport of this.transports.values()) {
      transport.disconnect();
    }
    this.transports.clear();
    this.peers.clear();
    this.router.stop();
    MeshDHT.cleanup();
  }
}

export const p2pNetwork = new P2PNetwork();