import { p2pNetwork } from "../network";
import { useAppStore } from "../../../store";

export function mimeToType(mime: string): "image" | "video" | "file" {
  return mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : "file";
}

/** Resolve the local direct chat an inbound frame is addressed to, if any. */
export function resolveInboundDirectChat(chatId: string, chatName: string): any | null {
  const { chats } = useAppStore.getState();
  const list = (chats || []) as any[];
  const byId = list.find((c: any) => String(c.id) === String(chatId) && c.type === "direct");
  if (byId) return byId;
  if (!chatName) return null;
  return list.find((c: any) => c.name === chatName && c.type === "direct") || null;
}

export const normName = (v: unknown): string => String(v ?? "").trim().toLowerCase();

/**
 * Authorization gate for every inbound chat frame.
 *
 * A frame's `chatId`, `chatName` and `senderName` are asserted by the sender.
 * Without this check a peer could (a) insert a message into any of the
 * victim's direct chats, (b) have it displayed under a name the victim never
 * associated with that peer, and (c) poison the chat→peer map so the victim's
 * *outgoing* messages get addressed to the attacker (`sendAddressed` resolves
 * its target through `peerForChat`).
 *
 * Rules: the frame must resolve to a local direct chat; the asserted name must
 * agree with the resolved chat (no id/name mixing); and the chat must not
 * already be bound to a different peer. Returns the resolved chat, or null when
 * the frame must be dropped.
 */
export function authorizeInboundChatFrame(
  chatId: string,
  chatName: string,
  senderId: string,
  kind: string,
): any | null {
  const chat = resolveInboundDirectChat(chatId, chatName);
  if (!chat) return null;
  if (chatName && normName(chat.name) !== normName(chatName)) return null;
  if (!p2pNetwork.rememberChatPeer(chat.id, chat.name, senderId)) {
    console.warn(`[p2p] dropped ${kind} frame: chat "${chat.name}" is already bound to another peer`);
    return null;
  }
  p2pNetwork.rememberPeer(senderId, chat.name);
  return chat;
}