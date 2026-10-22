import type { P2PNetworkInternals } from './p2pNetworkInternals';

/**
 * Chat↔peer bindings, learned from inbound chat frames. Bindings are
 * **first-write-wins** — see `rememberChatPeer`.
 */

/** Map a transport peer id to a display name (learned from inbound chat frames). */
export const rememberPeer = (self: P2PNetworkInternals, peerId: string, name: string): void => {
  if (peerId && name) self.peerNames.set(peerId, name);
};

export const getPeerName = (self: P2PNetworkInternals, peerId: string): string | undefined =>
  self.peerNames.get(peerId);

/**
 * Learn the peer that owns a chat (chatId primary, chatName fallback).
 *
 * Bindings are **first-write-wins**. `chatId`/`chatName` inside an inbound
 * frame are sender-asserted, and every outbound send resolves its target
 * through `peerForChat`/`peerForChatName`, so an unconditional overwrite let a
 * malicious peer re-point the victim's delivery at itself just by sending a
 * frame with someone else's chat id. A conflicting claim is refused instead
 * (returns false) so the caller can drop the frame.
 *
 * The check is atomic: both keys are validated before either is written, so a
 * claim that conflicts on the name cannot leave a half-applied id binding.
 */
export const rememberChatPeer = (
  self: P2PNetworkInternals,
  chatId: string | number,
  chatName: string,
  peerId: string,
): boolean => {
  if (!peerId) return false;
  const idKey =
    chatId !== undefined && chatId !== null && chatId !== '' ? String(chatId) : undefined;
  const nameKey = chatName ? String(chatName) : undefined;
  if (!idKey && !nameKey) return false;

  if (idKey !== undefined) {
    const existing = self.chatPeers.get(idKey);
    if (existing !== undefined && existing !== peerId) return false;
  }
  if (nameKey !== undefined) {
    const existing = self.chatNamePeers.get(nameKey);
    if (existing !== undefined && existing !== peerId) return false;
  }

  if (idKey !== undefined) self.chatPeers.set(idKey, peerId);
  if (nameKey !== undefined) self.chatNamePeers.set(nameKey, peerId);
  // Reverse binding (peer → chat), also first-write-wins: a peer that already
  // owns a chat keeps it, so a later frame cannot re-point the routing.
  const chatKey = idKey ?? nameKey;
  if (chatKey !== undefined && !self.peerChats.has(peerId)) self.peerChats.set(peerId, chatKey);
  return true;
};

/**
 * The local chat a transport peer owns (learned from inbound frames).
 *
 * This is the strong routing key: the binding exists only because the peer
 * passed the display-name check of a previous frame, so the peer is
 * transport-authenticated and the chat is already his. The display name is
 * only needed for the very first frame of a conversation.
 */
export const chatForPeer = (
  self: P2PNetworkInternals,
  peerId: string,
): string | undefined => (peerId ? self.peerChats.get(peerId) : undefined);

/** Peer bound to a specific chat id (learned from inbound frames). */
export const peerForChat = (
  self: P2PNetworkInternals,
  chatId: string | number,
): string | undefined => self.chatPeers.get(String(chatId));

/** Peer bound to a chat name (last-learned wins; used when ids don't match). */
export const peerForChatName = (
  self: P2PNetworkInternals,
  chatName: string,
): string | undefined => (chatName ? self.chatNamePeers.get(String(chatName)) : undefined);