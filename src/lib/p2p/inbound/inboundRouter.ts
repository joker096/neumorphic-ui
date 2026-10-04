import { FTR_MAGIC, ALBUM_MAGIC, parseFrame, parseAlbumManifest, type FtrFrame } from "../../fileTransfer/frames";
import {
  CALL_MAGIC, MSG_MAGIC, parseCallSignal, parseChatDeliveryAck, parseChatReadReceipt,
  parseChatAudioMeta, parseChatAudioChunk, parseChatAudioEnd,
  parseChatEdit, parseChatText,
} from "../chatFrame";
import { parseChatLocation, parseChatArticle } from "../chatRichFrames";
import { p2pNetwork, type BroadcastMessage } from "../network";
import { handleAlbumManifest } from "./inboundAlbum";
import { handleChatEdit, handleChatText } from "./inboundChatFrames";
import { handleChatArticle, handleChatLocation } from "./inboundRichFrames";
import { markOutgoingStatus } from "./inboundChatStore";
import { handleAudioChunk, handleAudioEnd, handleAudioMeta } from "./inboundVoice";
import { PROCESSED_ID_LIMIT, processedMessageIds } from "./inboundTransferState";

/**
 * Wire dispatcher: dedupes by wire `messageId`, skips our own frames, then routes
 * by magic prefix. Parse order inside `msg1:` is significant — each parser
 * recognises its own sub-frame, and a recognized payload returns immediately.
 */
export const createInboundMessageHandler = (
  handleFileFrame: (frame: FtrFrame, senderId: string) => Promise<void>,
) => (msg: BroadcastMessage) => {
  if (msg.senderId === p2pNetwork.getPeerId()) return;
  if (processedMessageIds.has(msg.messageId)) return;
  processedMessageIds.add(msg.messageId);
  if (processedMessageIds.size > PROCESSED_ID_LIMIT) processedMessageIds.clear();

  const raw = typeof msg.data === "string" ? msg.data : "";
  if (raw.startsWith(CALL_MAGIC)) {
    const callSig = parseCallSignal(raw);
    if (callSig) void import("../../call/CallManager").then(({ callManager }) => callManager.handleRemoteCallSignal(msg.senderId, callSig));
    return;
  }
  if (raw.startsWith(FTR_MAGIC)) {
    const frame = parseFrame(raw);
    if (frame) void handleFileFrame(frame, msg.senderId).catch(() => {});
    return;
  }
  if (raw.startsWith(ALBUM_MAGIC)) {
    const manifest = parseAlbumManifest(raw);
    if (manifest) handleAlbumManifest(manifest, msg.senderId);
    return;
  }
  if (raw.startsWith(MSG_MAGIC)) {
    const ack = parseChatDeliveryAck(raw);
    const read = parseChatReadReceipt(raw);
    if (ack) markOutgoingStatus(ack, "delivered");
    else if (read) markOutgoingStatus(read, "read");
    else {
      const audioMeta = parseChatAudioMeta(raw);
      if (audioMeta) {
        handleAudioMeta(audioMeta, msg.senderId);
        return;
      }
      const audioChunk = parseChatAudioChunk(raw);
      if (audioChunk) {
        void handleAudioChunk(audioChunk).catch(() => {});
        return;
      }
      const audioEnd = parseChatAudioEnd(raw);
      if (audioEnd) {
        void handleAudioEnd(audioEnd).catch(() => {});
        return;
      }
      const location = parseChatLocation(raw);
      if (location) {
        handleChatLocation(location, msg.senderId);
        return;
      }
      const article = parseChatArticle(raw);
      if (article) {
        handleChatArticle(article, msg.senderId);
        return;
      }
      const text = parseChatText(raw);
      const edit = parseChatEdit(raw);
      if (edit) {
        handleChatEdit(edit, msg.senderId);
        return;
      }
      handleChatText(text, msg.senderId);
    }
  }
};