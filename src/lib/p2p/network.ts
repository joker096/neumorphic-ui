// src/lib/p2p/network.ts
// Kadabra-style P2P network that uses DHT for peer discovery
// instead of a central signaling server.

import type { P2PTransport } from './P2PTransport';
import { MeshDHT, DHTBootstrapPeer } from './MeshDHT';
import { MeshRouterCore, MeshRouterSingleton } from './MeshRouter';
import { useAppStore } from '../../store';
import { SIGNALING_SEED_URLS } from '../../config/signalling';

const safeParseTyping = (raw: string): { isTyping?: boolean } | null => {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const safeParsePresence = (raw: string): { online?: boolean } | null => {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

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
  private presenceObservers: Set<(peerId: string, online: boolean) => void> = new Set();
  private connectionCallbacks: Set<(peerId: string) => void> = new Set();
  private disconnectionCallbacks: Set<(peerId: string) => void> = new Set();
  private isInitialized = false;
  private maxPeers: number;
  private router: MeshRouterCore;
  private dht: typeof MeshDHT;
  private peerNames = new Map<string, string>();
  private chatPeers = new Map<string, string>();
  private chatNamePeers = new Map<string, string>();

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
      if (!peer || peer.peerId === this.peerId) return; // never dial ourselves
      if (this.peers.has(peer.peerId) || this.transports.has(peer.peerId)) return; // already dialing/connected
      // Try to connect to this peer
      this.connectToPeer(peer.peerId).catch(() => {});
    });

    // Incoming mesh-forward frames (multi-hop) are delivered to the same
    // handlers as direct messages.
    this.rebindRouterForward();
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
        this.rebindRouterForward();
      }
      if (options.maxPeers) {
        this.maxPeers = options.maxPeers;
      }
    }

    // Bind the network node to the persistent Ed25519 identity so peers can
    // route to us by a stable key: the signaling server registers clients by
    // publicKey, so an ephemeral random peerId would make us unreachable.
    try {
      const { getMasterKeySet } = await import('../identity/masterKey');
      const identity = await getMasterKeySet().catch(() => null);
      if (identity?.ed25519Public) {
        const { buf2hex } = await import('../crypto/cryptoCore');
        const idHex = buf2hex(identity.ed25519Public);
        this.peerId = idHex;
        this.peerPublicKey = idHex;
        this.router = new MeshRouterCore(this.peerId);
        this.rebindRouterForward();
      }
    } catch {
      /* offline / first run — fall back to the random ephemeral peerId */
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

  private rebindRouterForward(): void {
    this.router.onForward((fwd) => {
      const msg: BroadcastMessage = {
        senderId: fwd.senderId,
        data: fwd.payload,
        timestamp: Date.now(),
        messageId: fwd.messageId,
      };
      this.messageHandlers.forEach((h) => h(msg));
    });
  }

  private broadcastRaw(data: string): void {
    // Fan out raw frames (e.g. mesh route advertisements) to every connected
    // direct peer using the standard envelope — this is what makes router
    // route propagation actually reach the mesh.
    const msg: BroadcastMessage = {
      senderId: this.peerId,
      data,
      timestamp: Date.now(),
      messageId: crypto.randomUUID(),
    };
    const serialized = JSON.stringify(msg);
    for (const [id, transport] of this.transports) {
      if (this.isConnected(id)) {
        transport.send(serialized).catch(() => {});
      }
    }
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
    const { turnServerUrl, turnServerUser, turnServerPass } = useAppStore.getState();
    const iceServers: RTCIceServer[] = [];
    if (turnServerUrl.trim()) {
      iceServers.push({
        urls: turnServerUrl.trim(),
        ...(turnServerUser ? { username: turnServerUser } : {}),
        ...(turnServerPass ? { credential: turnServerPass } : {}),
      });
    }
    const { P2PTransport: Transport } = await import('./P2PTransport');
    const { getMasterKeySet } = await import('../identity/masterKey');
    const identity = await getMasterKeySet().catch(() => null);
    const transport = new Transport({
      signalingUrl: SIGNALING_SEED_URLS[0] || '',
      localPublicKey: this.peerPublicKey,
      obfuscationEnabled,
      iceServers: iceServers.length ? iceServers : undefined,
      identitySecretKey: identity?.ed25519Secret,
      identityPublicKey: identity?.ed25519Public,
      onMessage: (data: string) => {
        // Mesh router frames (route advertisements / multi-hop forwards) are
        // consumed by the router, not delivered as chat messages.
        try {
          const parsed = JSON.parse(data);
          if (parsed && typeof parsed === 'object') {
            if (parsed.type === 'mesh-route-advert') {
              this.router.handleRouteAdvert(parsed);
              return;
            }
            if (parsed.type === 'mesh-forward') {
              this.router.handleForward(parsed, (nextHop: string, raw: string) => {
                this.sendTo(nextHop, raw).catch(() => {});
              });
              return;
            }
          }
        } catch {
          /* not a router frame — treat as a chat message below */
        }
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
        const parsed = typeof data === 'string' ? safeParseTyping(data) : '';
        if (!parsed) return;
        const name = this.getPeerName(peerId) || peerId.slice(0, 8);
        this.typingHandlers.forEach((h) => h(name, parsed.isTyping === true));
      } else if (type === 'online-status') {
        const parsed = typeof data === 'string' ? safeParsePresence(data) : null;
        if (!parsed) return;
        this.presenceObservers.forEach((h) => h(peerId, parsed.online !== false));
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

    const connected = Array.from(this.transports.entries()).filter(([peerId]) => this.isConnected(peerId));
    if (connected.length === 0) throw new Error('No connected P2P peers');
    await Promise.all(connected.map(([, transport]) => transport.send(JSON.stringify(msg))));
  }

  onMessage(handler: (msg: BroadcastMessage) => void): void {
    this.messageHandlers.add(handler);
  }

  /** True once `init()` completed (the network only operates after boot). */
  isReady(): boolean {
    return this.isInitialized;
  }

  /** Live transport for a peer, if one is established. */
  getTransport(peerId: string): P2PTransport | null {
    return this.transports.get(peerId) ?? null;
  }

  /** Addressed delivery: send to a single connected peer instead of broadcasting to the mesh. */
  async sendTo(peerId: string, data: any): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Network not initialized. Call init() first.');
    }
    const transport = this.transports.get(peerId);
    if (!transport || !this.isConnected(peerId)) {
      throw new Error('No connected P2P transport for target peer');
    }
    const msg: BroadcastMessage = {
      senderId: this.peerId,
      data,
      timestamp: Date.now(),
      messageId: crypto.randomUUID(),
    };
    await transport.send(JSON.stringify(msg));
  }

  /** Map a transport peer id to a display name (learned from inbound chat frames). */
  rememberPeer(peerId: string, name: string): void {
    if (peerId && name) this.peerNames.set(peerId, name);
  }

  getPeerName(peerId: string): string | undefined {
    return this.peerNames.get(peerId);
  }

  /** Learn the peer that owns a chat (chatId primary, chatName fallback). */
  rememberChatPeer(chatId: string | number, chatName: string, peerId: string): void {
    if (!peerId) return;
    if (chatId !== undefined && chatId !== null && chatId !== "") this.chatPeers.set(String(chatId), peerId);
    if (chatName) this.chatNamePeers.set(String(chatName), peerId);
  }

  /** Peer bound to a specific chat id (learned from inbound frames). */
  peerForChat(chatId: string | number): string | undefined {
    return this.chatPeers.get(String(chatId));
  }

  /** Peer bound to a chat name (last-learned wins; used when ids don't match). */
  peerForChatName(chatName: string): string | undefined {
    return chatName ? this.chatNamePeers.get(String(chatName)) : undefined;
  }

  /**
   * Addressed delivery with broadcast fallback: when a target peer is known and
   * connected the frame goes to that peer only; otherwise it fans out to the
   * connected mesh (legacy behaviour). Returns true when addressed.
   */
  async sendAddressed(target: string | undefined, data: any): Promise<boolean> {
    if (target && this.isConnected(target)) {
      await this.sendTo(target, data);
      return true;
    }
    await this.broadcast(data);
    return false;
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
   * Payload carries only `{isTyping}` — no display name (privacy; receivers
   * resolve the name from their own chat↔peer binding).
   */
  sendTypingIndicator(name: string, isTyping: boolean): void {
    if (!name) return;
    const payload = JSON.stringify({ isTyping });
    for (const transport of this.transports.values()) {
      try {
        transport.sendMetadataSignal('typing-indicator', payload);
      } catch {
        /* transport not ready — ignore */
      }
    }
  }

  /**
   * Broadcast our online status to every connected peer. Presence is symmetric:
   * each side derives the other's liveness from its own transport events too, so
   * this signal is a best-effort extra that also wakes peers whose transport
   * event window was missed (e.g. backgrounded tabs).
   */
  sendPresenceSignal(online: boolean): void {
    const payload = JSON.stringify({ online });
    for (const transport of this.transports.values()) {
      try {
        transport.sendMetadataSignal('online-status', payload);
      } catch {
        /* transport not ready — ignore */
      }
    }
  }

  /**
   * Subscribe to incoming `online-status` metadata signals from peers.
   * Handler receives the peer id and whether they reported online.
   * Returns an unsubscribe function.
   */
  onPresence(callback: (peerId: string, online: boolean) => void): () => void {
    this.presenceObservers.add(callback);
    return () => this.presenceObservers.delete(callback);
  }

  getPeers(): PeerConnection[] {
    return Array.from(this.peers.values());
  }

  getPeerId(): string {
    return this.peerId;
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