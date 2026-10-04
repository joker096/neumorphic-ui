import { FTR_MAGIC, type AlbumManifest } from "../../fileTransfer/frames";
import { encodeChatDeliveryAck, nextFrameSeq } from "../chatFrame";
import { p2pNetwork } from "../network";
import { resolveInboundSelfDestruct } from "../../selfDestruct";
import { formatClockTime } from "../../../utils/chatUtils";
import { authorizeInboundChatFrame } from "./inboundGate";
import { appendIncomingToDmChat } from "./inboundChatStore";
import { ALBUM_STATE_LIMIT, albumChatByTransferId, incomingAlbums } from "./inboundTransferState";

/**
 * Album manifest: authorizes the chat once, remembers which chat each entry's
 * transferId belongs to (so per-file meta frames do not render as separate
 * single-file bubbles) and appends one album bubble.
 */
export const handleAlbumManifest = (manifest: AlbumManifest, senderId: string) => {
  const chat = authorizeInboundChatFrame(manifest.chatId, manifest.chatName, senderId, "album");
  if (!chat) return;
  if (incomingAlbums.has(manifest.albumId)) return;
  for (const e of manifest.entries) albumChatByTransferId.set(e.transferId, chat);
  incomingAlbums.set(manifest.albumId, manifest);
  if (incomingAlbums.size > ALBUM_STATE_LIMIT) incomingAlbums.clear();
  if (albumChatByTransferId.size > ALBUM_STATE_LIMIT) albumChatByTransferId.clear();
  appendIncomingToDmChat(chat, {
    id: manifest.messageId,
    sender: chat.name,
    text: "",
    type: "image",
    attachment: FTR_MAGIC + manifest.entries[0].transferId,
    fileName: manifest.entries[0].name,
    fileSize: manifest.entries[0].size,
    fileTransferId: manifest.entries[0].transferId,
    album: manifest.entries.map((e) => ({ url: FTR_MAGIC + e.transferId, fileName: e.name, fileSize: e.size })),
    ts: manifest.timestamp,
    time: formatClockTime(manifest.timestamp),
    status: "delivered",
    silent: manifest.silent ?? false,
    selfDestructAt: resolveInboundSelfDestruct(manifest.ttlMs),
  });
  void p2pNetwork.sendAddressed(senderId, encodeChatDeliveryAck({
    type: "chat-ack",
    seq: nextFrameSeq(),
    messageId: String(manifest.messageId),
    chatId: manifest.chatId,
    timestamp: Date.now(),
  })).catch(() => {});
};