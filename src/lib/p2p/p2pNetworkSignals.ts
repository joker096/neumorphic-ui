import type { P2PTransport } from './P2PTransport';
import type { P2PNetworkInternals } from './p2pNetworkInternals';

/**
 * Typing-indicator and online-presence metadata: inbound dispatch, outbound
 * broadcast and observer registration.
 */

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

/** Dispatch a peer's metadata signals to the typing / presence subscribers. */
export const observeMetadataSignals = (
  self: P2PNetworkInternals,
  peerId: string,
  transport: P2PTransport,
): void => {
  transport.onMetadataSignal((type, data) => {
    if (type === 'typing-indicator') {
      const parsed = typeof data === 'string' ? safeParseTyping(data) : '';
      if (!parsed) return;
      const name = self.peerNames.get(peerId) || peerId.slice(0, 8);
      self.typingHandlers.forEach((h) => h(name, parsed.isTyping === true));
    } else if (type === 'online-status') {
      const parsed = typeof data === 'string' ? safeParsePresence(data) : null;
      if (!parsed) return;
      self.presenceObservers.forEach((h) => h(peerId, parsed.online !== false));
    }
  });
};

/**
 * Subscribe to incoming typing-indicator signals from any connected peer.
 * Handler receives the sending contact's `name` and the typing state.
 * Returns an unsubscribe function.
 */
export const onTypingIndicator = (
  self: P2PNetworkInternals,
  callback: (name: string, isTyping: boolean) => void,
): (() => void) => {
  self.typingHandlers.add(callback);
  return () => self.typingHandlers.delete(callback);
};

/**
 * Broadcast a typing-indicator signal to every connected peer.
 * Payload carries only `{isTyping}` — no display name (privacy; receivers
 * resolve the name from their own chat↔peer binding).
 */
export const sendTypingIndicator = (
  self: P2PNetworkInternals,
  name: string,
  isTyping: boolean,
): void => {
  if (!name) return;
  sendMetadataToAll(self, 'typing-indicator', JSON.stringify({ isTyping }));
};

/**
 * Broadcast our online status to every connected peer. Presence is symmetric:
 * each side derives the other's liveness from its own transport events too, so
 * this signal is a best-effort extra that also wakes peers whose transport
 * event window was missed (e.g. backgrounded tabs).
 */
export const sendPresenceSignal = (self: P2PNetworkInternals, online: boolean): void => {
  sendMetadataToAll(self, 'online-status', JSON.stringify({ online }));
};

/**
 * Subscribe to incoming `online-status` metadata signals from peers.
 * Handler receives the peer id and whether they reported online.
 * Returns an unsubscribe function.
 */
export const onPresence = (
  self: P2PNetworkInternals,
  callback: (peerId: string, online: boolean) => void,
): (() => void) => {
  self.presenceObservers.add(callback);
  return () => self.presenceObservers.delete(callback);
};

const sendMetadataToAll = (
  self: P2PNetworkInternals,
  type: 'typing-indicator' | 'online-status',
  payload: string,
): void => {
  for (const transport of self.transports.values()) {
    try {
      transport.sendMetadataSignal(type, payload);
    } catch {
      /* transport not ready — ignore */
    }
  }
};