import { encodeChatDelete, nextFrameSeq } from './chatFrame';
import { p2pNetwork } from './network';
import { useAppStore } from '../../store';

/**
 * Best-effort propagation of "delete for everyone" to a direct chat's peer.
 *
 * The local store write is the source of truth (already applied by the caller);
 * this only mirrors the retraction to the remote side. It is a no-op when the
 * chat is not a direct chat or no peer is currently bound — group/channel
 * deletion stays local, and inbound `chat-delete` frames are dropped by
 * `authorizeInboundChatFrame` for anything but direct chats anyway.
 */
export function sendChatDelete(chat: any, messageId: string | number): void {
  if (!chat) return;
  if (chat.type && chat.type !== "direct") return;
  const peer = p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name);
  if (!peer) return;
  const sender = useAppStore.getState().userProfile;
  void p2pNetwork.sendAddressed(peer, encodeChatDelete({
    type: "chat-delete",
    seq: nextFrameSeq(),
    messageId: String(messageId),
    chatId: String(chat.id),
    chatName: String(chat.name || ""),
    senderName: sender?.name || sender?.username || "User",
    timestamp: Date.now(),
  })).catch(() => {});
}
