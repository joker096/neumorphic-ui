import type { P2PNetworkInternals } from './p2pNetworkInternals';
import type { PeerConnection } from './p2pNetworkTypes';
import { createNetworkTransport } from './p2pNetworkTransport';

/**
 * Peer-table lifecycle: outbound dialing, inbound offer acceptance, disconnect
 * and the peer diagnostics getters.
 */

/**
 * Connect to a peer.
 * In a Kadabra network, this involves:
 * 1. Looking up the peer in the DHT
 * 2. Establishing a direct WebRTC connection
 * 3. Adding the peer to the routing table
 */
export const connectToPeer = async (self: P2PNetworkInternals, peerId: string): Promise<void> => {
  if (self.transports.has(peerId)) return;

  if (self.peers.size >= self.maxPeers) {
    throw new Error(`Max peers (${self.maxPeers}) reached`);
  }

  const transport = await createNetworkTransport(self, peerId);

  try {
    await transport.connect();
    await transport.call(peerId);
    self.transports.set(peerId, transport);
  } catch (err) {
    self.peers.delete(peerId);
    self.router.removeDirectPeer(peerId);
    transport.disconnect();
    throw err;
  }
};

/** Inbound dial-back: an offer for us arrived on the main signaling WS. Create
 * and connect a transport under our identity key (ownership-challenge register
 * when our main WS already holds the key), then answer the received offer —
 * no new offer, so no glare. Silently ignores peers we already dialed/own. */
export const acceptInboundOffer = async (
  self: P2PNetworkInternals,
  peerId: string,
  frame: any,
): Promise<void> => {
  if (self.transports.has(peerId)) return;
  if (self.dialingInbound.has(peerId)) return;
  self.dialingInbound.add(peerId);
  try {
    if (self.peers.size >= self.maxPeers) return;
    const transport = await createNetworkTransport(self, peerId);
    try {
      await transport.connect();
      await transport.acceptOffer(peerId, frame);
      self.transports.set(peerId, transport);
    } catch (err) {
      self.peers.delete(peerId);
      self.router.removeDirectPeer(peerId);
      transport.disconnect();
    }
  } finally {
    self.dialingInbound.delete(peerId);
  }
};

/** Tear down a peer: disconnect + drop from the transport, peer and router tables. */
export const disconnectPeer = (self: P2PNetworkInternals, peerId: string): void => {
  const transport = self.transports.get(peerId);
  if (transport) {
    transport.disconnect();
    self.transports.delete(peerId);
  }
  self.peers.delete(peerId);
  self.router.removeDirectPeer(peerId);
  self.disconnectionCallbacks.forEach((cb) => cb(peerId));
};

export const getPeers = (self: P2PNetworkInternals): PeerConnection[] =>
  Array.from(self.peers.values());

export const getPeerCount = (self: P2PNetworkInternals): number => self.peers.size;

export const getNetworkMetrics = (
  self: P2PNetworkInternals,
): {
  peerCount: number;
  connectedPeers: number;
  totalMessagesSent: number;
  totalMessagesReceived: number;
} => {
  let connectedPeers = 0;
  for (const peer of self.peers.values()) {
    if (peer.connected) connectedPeers++;
  }
  return {
    peerCount: self.peers.size,
    connectedPeers,
    totalMessagesSent: 0,
    totalMessagesReceived: 0,
  };
};