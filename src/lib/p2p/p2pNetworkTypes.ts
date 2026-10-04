import type { DHTBootstrapPeer } from './MeshDHT';

/**
 * Shared network-level types (public API of `network.ts`, re-exported there so
 * existing import sites keep working).
 */

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

export type P2PConnectionCallback = (peerId: string) => void;