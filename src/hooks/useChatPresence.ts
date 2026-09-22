// src/hooks/useChatPresence.ts
// Wires P2P transport liveness into chat online-status, so the green presence
// dot in the chat list / headers actually reflects a connected peer instead of
// the static `online: false` factory default.
//
// Sources (belt and braces):
//  - transport onConnected/onDisconnected (authoritative socket state)
//  - inbound `online-status` metadata signals from peers (best-effort extra)
//
// Symmetric: every client runs this same hook, so each side marks the other's
// chats online when their transports link up.

import { useEffect } from "react";
import { p2pNetwork } from "../lib/p2p/network";
import { useAppStore } from "../store";

const markChatsForPeer = (peerId: string, online: boolean) => {
  const state = useAppStore.getState();
  const chats = state.chats || [];
  const affected: Array<string | number> = [];

  for (const chat of chats) {
    const peerForChatId = p2pNetwork.peerForChat(chat.id);
    const peerForChatName = p2pNetwork.peerForChatName(chat.name);
    if (
      (peerForChatId && String(peerForChatId) === String(peerId)) ||
      (peerForChatName && String(peerForChatName) === String(peerId))
    ) {
      affected.push(chat.id);
    }
  }

  if (affected.length === 0) return;

  state.setChats((prev: any[]) =>
    (prev || []).map((c) => {
      if (!affected.includes(c.id)) return c;
      if (online && c.online) return c;
      return {
        ...c,
        online,
        ...(online ? {} : { lastSeen: Date.now() }),
      };
    })
  );
};

/**
 * Keeps `chat.online` in sync with actual P2P peer liveness. Mount once near
 * boot (App-level); the network is a module singleton so a single subscription
 * covers the whole app. Also re-sends our presence on every new connection so
 * recently-peered chat owners pick us up even if event delivery raced.
 */
export function useChatPresence() {
  useEffect(() => {
    const onConn = (peerId: string) => {
      if (useAppStore.getState().onlineStatus) {
        p2pNetwork.sendPresenceSignal(true);
      }
      markChatsForPeer(peerId, true);
    };
    const onDisconn = (peerId: string) => markChatsForPeer(peerId, false);
    const onSignal = (peerId: string, online: boolean) => markChatsForPeer(peerId, online);

    const offConn = p2pNetwork.onConnection(onConn);
    const offDisconn = p2pNetwork.onDisconnection(onDisconn);
    const offPresence = p2pNetwork.onPresence(onSignal);

    for (const peer of p2pNetwork.getPeers()) {
      if (peer.connected) onConn(peer.peerId);
    }

    return () => {
      offConn();
      offDisconn();
      offPresence();
    };
  }, []);
}