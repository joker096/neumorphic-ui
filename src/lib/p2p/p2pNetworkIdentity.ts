import { MeshDHT } from './MeshDHT';
import type { P2PNetworkInternals } from './p2pNetworkInternals';
import { MeshRouterCore } from './MeshRouter';
import type { P2PNetworkOptions } from './p2pNetworkTypes';
import { broadcastRawFrame } from './p2pNetworkDelivery';
import { handleNetworkChange, rebindRouterForward } from './p2pNetworkRouter';

/** Re-create the mesh router after the peer id changed (identity binding). */
export const resetNetworkRouter = (self: P2PNetworkInternals): void => {
  self.router = new MeshRouterCore(self.peerId);
  rebindRouterForward(self);
};

/**
 * Bind the network node to the persistent Ed25519 identity so peers can route to
 * us by a stable key: the signaling server registers clients by publicKey, so an
 * ephemeral random peerId would make us unreachable. Offline / first run keeps
 * the random ephemeral peerId.
 */
const bindPersistentIdentity = async (self: P2PNetworkInternals): Promise<void> => {
  try {
    const { getMasterKeySet } = await import('../identity/masterKey');
    const identity = await getMasterKeySet().catch(() => null);
    if (identity?.ed25519Public) {
      const { buf2hex } = await import('../crypto/cryptoCore');
      const idHex = buf2hex(identity.ed25519Public);
      self.peerId = idHex;
      self.peerPublicKey = idHex;
      resetNetworkRouter(self);
    }
  } catch {
    /* offline / first run — fall back to the random ephemeral peerId */
  }
};

/** Apply the `init()` overrides (bootstrap peers, peer id, peer cap). */
export const applyNetworkInitOptions = (
  self: P2PNetworkInternals,
  options?: Partial<P2PNetworkOptions>,
): void => {
  if (!options) return;
  if (options.bootstrapPeers) {
    MeshDHT.setBootstrap(options.bootstrapPeers);
  }
  if (options.peerId) {
    self.peerId = options.peerId;
    resetNetworkRouter(self);
  }
  if (options.maxPeers) {
    self.maxPeers = options.maxPeers;
  }
};

/**
 * Initialize the network: apply overrides, bind the persistent identity, start
 * the mesh router, register our node in the DHT and watch online/offline so
 * transports reconnect after a network change.
 */
export const initNetwork = async (
  self: P2PNetworkInternals,
  options?: Partial<P2PNetworkOptions>,
): Promise<void> => {
  applyNetworkInitOptions(self, options);

  await bindPersistentIdentity(self);

  self.isInitialized = true;

  // Start the mesh router
  self.router.start((data: string) => broadcastRawFrame(self, data));

  // Register our node in the DHT
  MeshDHT.addNode({
    nodeId: self.peerId,
    publicKey: self.peerPublicKey,
    peerId: self.peerId,
    lastSeen: Date.now(),
    path: [self.peerId],
  });

  // Handle network changes
  const onOnline = () => handleNetworkChange(self, true);
  const onOffline = () => handleNetworkChange(self, false);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  if (typeof window !== 'undefined') {
    (self as any).__cleanupOnline = onOnline;
    (self as any).__cleanupOffline = onOffline;
  }
};