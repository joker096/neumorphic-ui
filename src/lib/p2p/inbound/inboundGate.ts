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
 * How an inbound frame resolved its chat.
 *
 * `bound` = the transport-authenticated peer already owns this chat (learned
 * from an earlier frame, where the display name was checked). `id` = the frame
 * named a local chat id. `name` = the bootstrap path: the frame named a local
 * chat by display name.
 */
export type InboundChatResolution = "bound" | "id" | "name";

/**
 * Resolve the local chat an inbound frame belongs to, strongest key first.
 *
 * 1. the chat the transport-authenticated peer already owns (`chatForPeer`).
 *    That binding is written only after the display name of an earlier frame
 *    was checked, so it is trustworthy - and it survives a rename of the
 *    contact, which is exactly what the display name does not;
 * 2. the local chat id the frame names (ids are device-local, so this only
 *    hits when both sides happen to use the same id);
 * 3. the local chat whose name matches (the bootstrap path - the display name
 *    is the only cross-device key the protocol has today).
 */
export function resolveInboundChat(
  chatId: string,
  chatName: string,
  senderId: string,
): { chat: any; via: InboundChatResolution } | null {
  const boundId = senderId ? p2pNetwork.chatForPeer(senderId) : undefined;
  if (boundId !== undefined) {
    const bound = resolveInboundDirectChat(boundId, "");
    if (bound) return { chat: bound, via: "bound" };
  }
  const byId = resolveInboundDirectChat(chatId, "");
  if (byId) return { chat: byId, via: "id" };
  const byName = chatName ? resolveInboundDirectChat("", chatName) : null;
  if (byName) return { chat: byName, via: "name" };
  return null;
}

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
 * agree with the resolved chat (no id/name mixing) - unless the chat was
 * resolved through the peer binding, which the transport already authenticated;
 * and the chat must not already be bound to a different peer. Returns the
 * resolved chat, or null when the frame must be dropped.
 */
export function authorizeInboundChatFrame(
  chatId: string,
  chatName: string,
  senderId: string,
  kind: string,
): any | null {
  const resolved = resolveInboundChat(chatId, chatName, senderId);
  if (!resolved) return null;
  const chat = resolved.chat;
  if (resolved.via !== "bound" && chatName && normName(chat.name) !== normName(chatName)) return null;
  if (!p2pNetwork.rememberChatPeer(chat.id, chat.name, senderId)) {
    console.warn(`[p2p] dropped ${kind} frame: chat "${chat.name}" is already bound to another peer`);
    return null;
  }
  p2pNetwork.rememberPeer(senderId, chat.name);
  return chat;
}