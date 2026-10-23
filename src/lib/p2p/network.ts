// src/lib/p2p/network.ts
// Kadabra-style P2P network that uses DHT for peer discovery
// instead of a central signaling server.
//
// Thin façade: state stays flat on the instance (regression tests read it
// directly); every concern is implemented in a sibling module —
// p2pNetworkIdentity, p2pNetworkPeers, p2pNetworkTransport,
// p2pNetworkDelivery, p2pNetworkSignals, p2pNetworkChatBindings and
// p2pNetworkRouter.

import type { P2PTransport } from './P2PTransport';
import { MeshDHT } from './MeshDHT';
import { MeshRouterCore } from './MeshRouter';
import type { P2PNetworkInternals } from './p2pNetworkInternals';
import type {
  BroadcastMessage,
  P2PConnectionCallback,
  P2PNetworkOptions,
  PeerConnection,
} from './p2pNetworkTypes';
import { initNetwork } from './p2pNetworkIdentity';
import {
  acceptInboundOffer,
  connectToPeer,
  disconnectPeer,
} from './p2pNetworkPeers';
import {
  broadcastMessage,
  broadcastRawFrame,
  sendAddressed,
  sendToPeer,
} from './p2pNetworkDelivery';
import {
  chatForPeer,
  getPeerName,
  peerForChat,
  peerForChatName,
  rememberChatPeer,
  rememberPeer,
} from './p2pNetworkChatBindings';
import {
  onPresence,
  onTypingIndicator,
  sendPresenceSignal,
  sendTypingIndicator,
} from './p2pNetworkSignals';
import { rebindRouterForward } from './p2pNetworkRouter';
import {
  getTransport,
  getPeersList,
  getPeerId,
  getPeerCount,
  isConnected,
  getMetrics,
  getDHTTable as getDHTTableFn,
  getMeshRoutes as getMeshRoutesFn,
  getRouter,
  cleanup as cleanupFn,
} from './p2pNetworkGetters';

export type {
  BroadcastMessage,
  P2PConnectionCallback,
  P2PNetworkOptions,
  PeerConnection,
} from './p2pNetworkTypes';

const DEFAULT_MAX_PEERS = 10;
const DEFAULT_PEER_ID = crypto.randomUUID();

export class P2PNetwork implements P2PNetworkInternals {
  peerId: string;
  peerPublicKey: string;
  peers: Map<string, PeerConnection> = new Map();
  transports: Map<string, P2PTransport> = new Map();
  // In-flight inbound dial-backs: dedupes duplicate offers (main WS + transport
  // both deliver the same frame while the dial-back transport is being created).
  dialingInbound: Set<string> = new Set();
  messageHandlers: Set<(msg: BroadcastMessage) => void> = new Set();
  typingHandlers: Set<(name: string, isTyping: boolean) => void> = new Set();
  presenceObservers: Set<(peerId: string, online: boolean) => void> = new Set();
  connectionCallbacks: Set<(peerId: string) => void> = new Set();
  disconnectionCallbacks: Set<(peerId: string) => void> = new Set();
  isInitialized = false;
  maxPeers: number;
  router: MeshRouterCore;
  peerNames = new Map<string, string>();
  chatPeers = new Map<string, string>();
  chatNamePeers = new Map<string, string>();
  /** Reverse binding: transport peer id → the local chat id it owns. */
  peerChats = new Map<string, string>();

  constructor(options: P2PNetworkOptions = {}) {
    this.peerId = options.peerId || DEFAULT_PEER_ID;
    this.peerPublicKey = options.peerPublicKey || this.peerId;
    this.maxPeers = options.maxPeers || DEFAULT_MAX_PEERS;
    this.router = new MeshRouterCore(this.peerId);

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
    return initNetwork(this, options);
  }

  private rebindRouterForward(): void {
    rebindRouterForward(this);
  }

  /** Raw-frame fan-out (mesh route advertisements reach the mesh through it). */
  private broadcastRaw(data: string): void {
    broadcastRawFrame(this, data);
  }

  /** Connect to a peer (DHT lookup + WebRTC + routing table). */
  async connect(peerId: string): Promise<void> {
    return this.connectToPeer(peerId);
  }

  private connectToPeer(peerId: string): Promise<void> {
    return connectToPeer(this, peerId);
  }

  /** Inbound dial-back: answer an offer from the signaling WS. */
  acceptInboundOffer(peerId: string, frame: any): Promise<void> {
    return acceptInboundOffer(this, peerId, frame);
  }

  disconnect(peerId: string): void {
    disconnectPeer(this, peerId);
  }

  broadcast(data: any): Promise<void> {
    return broadcastMessage(this, data);
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
    return getTransport(this, peerId);
  }

  /** Addressed delivery: send to a single connected peer instead of broadcasting to the mesh. */
  sendTo(peerId: string, data: any): Promise<void> {
    return sendToPeer(this, peerId, data);
  }

  /** Map a transport peer id to a display name (learned from inbound chat frames). */
  rememberPeer(peerId: string, name: string): void {
    rememberPeer(this, peerId, name);
  }

  getPeerName(peerId: string): string | undefined {
    return getPeerName(this, peerId);
  }

  /** Learn the peer owning a chat (id primary, name fallback). First-write-wins. */
  rememberChatPeer(chatId: string | number, chatName: string, peerId: string): boolean {
    return rememberChatPeer(this, chatId, chatName, peerId);
  }

  /** Peer bound to a specific chat id (learned from inbound frames). */
  peerForChat(chatId: string | number): string | undefined {
    return peerForChat(this, chatId);
  }

  /** Peer bound to a chat name (last-learned wins; used when ids don't match). */
  peerForChatName(chatName: string): string | undefined {
    return peerForChatName(this, chatName);
  }

  /** The local chat a transport peer owns (learned from inbound frames). */
  chatForPeer(peerId: string): string | undefined {
    return chatForPeer(this, peerId);
  }

  /** Addressed delivery with broadcast fallback (returns true when addressed). */
  sendAddressed(target: string | undefined, data: any): Promise<boolean> {
    return sendAddressed(this, target, data);
  }

  onConnection(callback: P2PConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  onDisconnection(callback: P2PConnectionCallback): () => void {
    this.disconnectionCallbacks.add(callback);
    return () => this.disconnectionCallbacks.delete(callback);
  }

  /** Subscribe to typing-indicator signals; handler gets `name` + typing state. */
  onTypingIndicator(callback: (name: string, isTyping: boolean) => void): () => void {
    return onTypingIndicator(this, callback);
  }

  /** Broadcast a typing-indicator signal to every connected peer. */
  sendTypingIndicator(name: string, isTyping: boolean): void {
    sendTypingIndicator(this, name, isTyping);
  }

  /** Broadcast our online status to every connected peer. */
  sendPresenceSignal(online: boolean): void {
    sendPresenceSignal(this, online);
  }

  /** Subscribe to `online-status` signals; handler gets peer id + online state. */
  onPresence(callback: (peerId: string, online: boolean) => void): () => void {
    return onPresence(this, callback);
  }

  getPeers(): PeerConnection[] {
    return getPeersList(this);
  }

  getPeerId(): string {
    return getPeerId(this);
  }

  getPeerCount(): number {
    return getPeerCount(this);
  }

  isConnected(peerId: string): boolean {
    return isConnected(this, peerId);
  }

  getMetrics(): {
    peerCount: number;
    connectedPeers: number;
    totalMessagesSent: number;
    totalMessagesReceived: number;
  } {
    return getMetrics(this);
  }

  /** DHT routing table. */
  getDHTTable(): Map<string, any> {
    return getDHTTableFn();
  }

  /** Mesh routing table. */
  getMeshRoutes(): any[] {
    return getMeshRoutesFn(this);
  }

  /** Mesh router instance. */
  getRouter(): MeshRouterCore {
    return getRouter(this);
  }

  /** Clean up and disconnect. */
  cleanup(): void {
    cleanupFn(this);
  }
}

export const p2pNetwork = new P2PNetwork();