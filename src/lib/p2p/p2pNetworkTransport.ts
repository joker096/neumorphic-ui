import type { P2PTransport } from './P2PTransport';
import { MeshDHT } from './MeshDHT';
import { useAppStore } from '../../store';
import { SIGNALING_SEED_URLS } from '../../config/signalling';
import type { P2PNetworkInternals } from './p2pNetworkInternals';
import type { BroadcastMessage } from './p2pNetworkTypes';
import { sendToPeer } from './p2pNetworkDelivery';
import { observeMetadataSignals } from './p2pNetworkSignals';

/** ICE servers from the persisted TURN settings (empty → transport default). */
const iceServersFromSettings = (): RTCIceServer[] | undefined => {
  const { turnServerUrl, turnServerUser, turnServerPass } = useAppStore.getState();
  const iceServers: RTCIceServer[] = [];
  if (turnServerUrl.trim()) {
    iceServers.push({
      urls: turnServerUrl.trim(),
      ...(turnServerUser ? { username: turnServerUser } : {}),
      ...(turnServerPass ? { credential: turnServerPass } : {}),
    });
  }
  return iceServers.length ? iceServers : undefined;
};

/** Route an inbound frame: mesh router frames go to the router, everything else
 * to the chat handlers. */
const deliverInbound = (self: P2PNetworkInternals, peerId: string, data: string): void => {
  // Mesh router frames (route advertisements / multi-hop forwards) are
  // consumed by the router, not delivered as chat messages.
  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === 'object') {
      if (parsed.type === 'mesh-route-advert') {
        self.router.handleRouteAdvert(parsed);
        return;
      }
      if (parsed.type === 'mesh-forward') {
        self.router.handleForward(parsed, (nextHop: string, raw: string) => {
          sendToPeer(self, nextHop, raw).catch(() => {});
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
  self.messageHandlers.forEach((h) => h(msg));
};

/**
 * Create a transport for one peer: register it in the local peer table, the mesh
 * router and the DHT, then wire transport callbacks (inbound frames, connect /
 * disconnect events, typing + presence metadata).
 */
export const createNetworkTransport = async (
  self: P2PNetworkInternals,
  peerId: string,
): Promise<P2PTransport> => {
  // Register peer in our local table
  self.peers.set(peerId, {
    peerId,
    nodeId: peerId,
    connected: false,
    lastSeen: Date.now(),
  });

  // Add to mesh router
  self.router.addDirectPeer(peerId);

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
  const iceServers = iceServersFromSettings();
  const { P2PTransport: Transport } = await import('./P2PTransport');
  const { getMasterKeySet } = await import('../identity/masterKey');
  const identity = await getMasterKeySet().catch(() => null);
  const transport = new Transport({
    signalingUrl: SIGNALING_SEED_URLS[0] || '',
    localPublicKey: self.peerPublicKey,
    obfuscationEnabled,
    iceServers,
    identitySecretKey: identity?.ed25519Secret,
    identityPublicKey: identity?.ed25519Public,
    onMessage: (data: string) => deliverInbound(self, peerId, data),
    onConnected: (id: string) => {
      const peer = self.peers.get(id);
      if (peer) {
        peer.connected = true;
        peer.lastSeen = Date.now();
      }
      self.connectionCallbacks.forEach((cb) => cb(id));
    },
    onDisconnected: (id: string) => {
      const peer = self.peers.get(id);
      if (peer) {
        peer.connected = false;
      }
      self.disconnectionCallbacks.forEach((cb) => cb(id));
    },
  });

  observeMetadataSignals(self, peerId, transport);

  return transport;
};