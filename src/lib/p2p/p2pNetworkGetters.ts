// Getters and utility methods for P2PNetwork - extracted to keep the main class <300 lines
import type { P2PNetworkInternals } from './p2pNetworkInternals';
import type { PeerConnection } from './p2pNetworkTypes';
import { getPeers, getNetworkMetrics } from './p2pNetworkPeers';
import { isPeerConnected } from './p2pNetworkDelivery';
import {
  getDHTTable as getDHTTableFromRouter,
  getMeshRoutes as getMeshRoutesFromRouter,
} from './p2pNetworkRouter';
import { MeshRouterCore } from './MeshRouter';
import { MeshDHT } from './MeshDHT';

/** Live transport for a peer, if one is established. */
export function getTransport(network: P2PNetworkInternals, peerId: string): any {
  return network.transports?.get(peerId) ?? null;
}

/** All known peers. */
export function getPeersList(network: P2PNetworkInternals): PeerConnection[] {
  return getPeers(network);
}

/** Local peer id. */
export function getPeerId(network: P2PNetworkInternals): string {
  return network.peerId;
}

/** Total peer count. */
export function getPeerCount(network: P2PNetworkInternals): number {
  return network.peers?.size ?? 0;
}

/** Check if a specific peer is connected (has active transport). */
export function isConnected(network: P2PNetworkInternals, peerId: string): boolean {
  return isPeerConnected(network, peerId);
}

/** Aggregate network metrics. */
export function getMetrics(network: P2PNetworkInternals): {
  peerCount: number;
  connectedPeers: number;
  totalMessagesSent: number;
  totalMessagesReceived: number;
} {
  return getNetworkMetrics(network);
}

/** DHT routing table. */
export function getDHTTable(): Map<string, any> {
  return getDHTTableFromRouter();
}

/** Mesh routing table. */
export function getMeshRoutes(network: P2PNetworkInternals): any[] {
  return getMeshRoutesFromRouter(network);
}

/** Mesh router instance. */
export function getRouter(network: P2PNetworkInternals): MeshRouterCore {
  return network.router;
}

/** Clean up and disconnect all. */
export function cleanup(network: P2PNetworkInternals): void {
  for (const transport of network.transports?.values() ?? []) {
    transport.disconnect();
  }
  network.transports?.clear();
  network.peers?.clear();
  network.router?.stop();
  MeshDHT.cleanup();
}