import { MeshDHT } from './MeshDHT';
import type { P2PNetworkInternals } from './p2pNetworkInternals';
import type { BroadcastMessage } from './p2pNetworkTypes';

/**
 * Mesh router plumbing: inbound multi-hop forwards, online/offline reconnect and
 * the routing-table getters.
 */

/**
 * Incoming mesh-forward frames (multi-hop) are delivered to the same handlers as
 * direct messages.
 */
export const rebindRouterForward = (self: P2PNetworkInternals): void => {
  self.router.onForward((fwd) => {
    const msg: BroadcastMessage = {
      senderId: fwd.senderId,
      data: fwd.payload,
      timestamp: Date.now(),
      messageId: fwd.messageId,
    };
    self.messageHandlers.forEach((h) => h(msg));
  });
};

/** Reconnect live transports after an online/offline transition. */
export const handleNetworkChange = (self: P2PNetworkInternals, _online: boolean): void => {
  for (const transport of self.transports.values()) {
    transport.connect().catch(() => {});
  }
};

/** DHT routing table (diagnostics / network view). */
export const getDHTTable = (): Map<string, any> => MeshDHT.getTable();

/** Mesh routing table (diagnostics / network view). */
export const getMeshRoutes = (self: P2PNetworkInternals): any[] =>
  self.router.getRoutingTable();