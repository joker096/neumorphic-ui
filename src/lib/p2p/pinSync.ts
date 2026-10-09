import { encodeChatPin, nextFrameSeq } from "./chatFrame";
import { p2pNetwork } from "./network";
import { useAppStore } from "../../store";

/**
 * Best-effort propagation of a pin/unpin to the chat's P2P peer.
 *
 * The local store write is the source of truth (already applied by the caller);
 * this only mirrors the delta to the remote side. It is a no-op when the chat
 * is not a direct chat or no peer is currently bound — group/channel pinning is
 * local-only, and inbound `chat-pin` frames are dropped by
 * `authorizeInboundChatFrame` for anything but direct chats anyway.
 */
export function sendChatPin(chat: any, messageId: string | number, op: "pin" | "unpin"): void {
  if (!chat) return;
  if (chat.type && chat.type !== "direct") return;
  const peer = p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name);
  if (!peer) return;
  const sender = useAppStore.getState().userProfile;
  void p2pNetwork.sendAddressed(peer, encodeChatPin({
    type: "chat-pin",
    seq: nextFrameSeq(),
    messageId: String(messageId),
    chatId: String(chat.id),
    chatName: String(chat.name || ""),
    senderName: sender?.name || sender?.username || "User",
    op,
    timestamp: Date.now(),
  })).catch(() => {});
}
