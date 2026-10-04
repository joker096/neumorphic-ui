import type { P2PTransport } from './P2PTransport';
import type { MeshRouterCore } from './MeshRouter';
import type { BroadcastMessage, PeerConnection } from './p2pNetworkTypes';

/**
 * Shared mutable state of a live `P2PNetwork`. Boot/dialing/transport/signal
 * logic lives in sibling modules and operates on this object, so the network
 * class stays a thin façade. Fields stay flat on the instance (regression tests
 * read them directly, e.g. `(net as any).transports`).
 */
export interface P2PNetworkInternals {
  peerId: string;
  peerPublicKey: string;
  peers: Map<string, PeerConnection>;
  transports: Map<string, P2PTransport>;
  /** In-flight inbound dial-backs: dedupes duplicate offers (main WS + transport
   * both deliver the same frame while the dial-back transport is being created). */
  dialingInbound: Set<string>;
  messageHandlers: Set<(msg: BroadcastMessage) => void>;
  typingHandlers: Set<(name: string, isTyping: boolean) => void>;
  presenceObservers: Set<(peerId: string, online: boolean) => void>;
  connectionCallbacks: Set<(peerId: string) => void>;
  disconnectionCallbacks: Set<(peerId: string) => void>;
  isInitialized: boolean;
  maxPeers: number;
  router: MeshRouterCore;
  peerNames: Map<string, string>;
  chatPeers: Map<string, string>;
  chatNamePeers: Map<string, string>;
}