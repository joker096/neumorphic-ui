import type { P2PNetworkInternals } from './p2pNetworkInternals';
import type { BroadcastMessage } from './p2pNetworkTypes';

/**
 * Outbound frame delivery: raw router fan-out plus the broadcast / addressed send
 * paths. Pure over the shared state — no imports beyond types, so every module
 * may use it without creating a cycle.
 */

/** True when our peer table marks the peer as connected. */
export const isPeerConnected = (self: P2PNetworkInternals, peerId: string): boolean =>
  self.peers.get(peerId)?.connected || false;

/**
 * Fan out raw frames (e.g. mesh route advertisements) to every connected direct
 * peer using the standard envelope — this is what makes router route propagation
 * actually reach the mesh.
 */
export const broadcastRawFrame = (self: P2PNetworkInternals, data: string): void => {
  const msg: BroadcastMessage = {
    senderId: self.peerId,
    data,
    timestamp: Date.now(),
    messageId: crypto.randomUUID(),
  };
  const serialized = JSON.stringify(msg);
  for (const [id, transport] of self.transports) {
    if (isPeerConnected(self, id)) {
      transport.send(serialized).catch(() => {});
    }
  }
};

/** Broadcast a payload to every connected peer. */
export const broadcastMessage = async (
  self: P2PNetworkInternals,
  data: any,
): Promise<void> => {
  if (!self.isInitialized) {
    throw new Error('Network not initialized. Call init() first.');
  }

  const msg: BroadcastMessage = {
    senderId: self.peerId,
    data,
    timestamp: Date.now(),
    messageId: crypto.randomUUID(),
  };

  const connected = Array.from(self.transports.entries()).filter(([peerId]) =>
    isPeerConnected(self, peerId),
  );
  if (connected.length === 0) throw new Error('No connected P2P peers');
  await Promise.all(connected.map(([, transport]) => transport.send(JSON.stringify(msg))));
};

/** Addressed delivery: send to a single connected peer instead of broadcasting. */
export const sendToPeer = async (
  self: P2PNetworkInternals,
  peerId: string,
  data: any,
): Promise<void> => {
  if (!self.isInitialized) {
    throw new Error('Network not initialized. Call init() first.');
  }
  const transport = self.transports.get(peerId);
  if (!transport || !isPeerConnected(self, peerId)) {
    throw new Error('No connected P2P transport for target peer');
  }
  const msg: BroadcastMessage = {
    senderId: self.peerId,
    data,
    timestamp: Date.now(),
    messageId: crypto.randomUUID(),
  };
  await transport.send(JSON.stringify(msg));
};

/**
 * Addressed delivery with broadcast fallback: when a target peer is known and
 * connected the frame goes to that peer only; otherwise it fans out to the
 * connected mesh (legacy behaviour). Returns true when addressed.
 *
 * The fallback is required to bootstrap a first contact — before any inbound
 * frame has been seen, `peerForChat`/`peerForChatName` are empty, so a strict
 * send would silently drop the very first message. It is not a confidentiality
 * leak: `P2PTransport.send` encrypts per-peer with an ECDH session key, so only
 * the intended peer can decrypt the payload. Inbound authorization
 * (`rememberChatPeer`, first-write-wins) is what prevents a foreign peer from
 * re-pointing this routing.
 */
export const sendAddressed = async (
  self: P2PNetworkInternals,
  target: string | undefined,
  data: any,
): Promise<boolean> => {
  if (target && isPeerConnected(self, target)) {
    await sendToPeer(self, target, data);
    return true;
  }
  await broadcastMessage(self, data);
  return false;
};