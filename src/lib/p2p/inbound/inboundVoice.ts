import { base64ToBytes } from "../../fileTransfer/frames";
import {
  encodeChatDeliveryAck, nextFrameSeq, formatDurationStr,
  VOICE_P2P_MAX_SIZE, VOICE_P2P_MAX_CHUNKS,
  type ChatAudioMetaFrame, type ChatAudioChunkFrame, type ChatAudioEndFrame,
} from "../chatFrame";
import { sha256Hex } from "../../fileTransfer/integrity";
import { saveVoiceBlob } from "../../voiceStore";
import { resolveInboundSelfDestruct } from "../../selfDestruct";
import { formatClockTime } from "../../../utils/chatUtils";
import { p2pNetwork } from "../network";
import { authorizeInboundChatFrame, normName, resolveInboundDirectChat } from "./inboundGate";
import { appendIncomingToDmChat } from "./inboundChatStore";
import { incomingAudioChunks, incomingAudioMetas } from "./inboundTransferState";

/** Voice meta: authorize, then fail closed on oversized/oversharded payloads. */
export const handleAudioMeta = (frame: ChatAudioMetaFrame, senderId: string) => {
  if (!frame) return;
  if (!authorizeInboundChatFrame(frame.chatId, frame.chatName, senderId, "voice")) return;
  if (frame.size <= 0 || frame.size > VOICE_P2P_MAX_SIZE) return;
  if (frame.totalChunks < 1 || frame.totalChunks > VOICE_P2P_MAX_CHUNKS) return;
  if (frame.chunkSize * frame.totalChunks < frame.size) return;
  if (incomingAudioMetas.has(frame.messageId)) return;
  incomingAudioMetas.set(frame.messageId, frame);
  incomingAudioChunks.set(frame.messageId, new Map());
};

export const handleAudioChunk = async (frame: ChatAudioChunkFrame) => {
  if (!frame) return;
  const meta = incomingAudioMetas.get(frame.messageId);
  if (!meta) return;
  if (frame.index < 0 || frame.index >= meta.totalChunks) return;
  const chunks = incomingAudioChunks.get(frame.messageId);
  if (!chunks || chunks.has(frame.index)) return;
  chunks.set(frame.index, base64ToBytes(frame.data));
};

export const handleAudioEnd = async (frame: ChatAudioEndFrame) => {
  if (!frame) return;
  const meta = incomingAudioMetas.get(frame.messageId);
  const chunks = incomingAudioChunks.get(frame.messageId);
  if (!meta || !chunks) return;
  try {
    if (chunks.size !== meta.totalChunks) return;
    const bytes = new Uint8Array(meta.size);
    let offset = 0;
    for (let index = 0; index < meta.totalChunks; index++) {
      const chunk = chunks.get(index);
      if (!chunk) return;
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    if (offset !== meta.size) return;
    const digest = await sha256Hex(bytes);
    if (digest.toLowerCase() !== meta.sha256.toLowerCase()) return;
    const blob = new Blob([bytes.buffer], { type: meta.mime });
    await saveVoiceBlob(meta.messageId, blob);
    let audioUrl = "";
    try {
      audioUrl = URL.createObjectURL(blob);
    } catch {
      // jsdom/undici lack createObjectURL; UI falls back to the IDB-blob URL.
    }
    const messageId = meta.messageId;
    // The meta frame was authorized on arrival; re-resolve (and re-check the
    // asserted name) so the appended bubble carries the local contact name.
    const chat = resolveInboundDirectChat(meta.chatId, meta.chatName);
    if (!chat) return;
    if (normName(chat.name) !== normName(meta.chatName)) return;
    appendIncomingToDmChat(chat, {
      id: messageId,
      sender: chat.name,
      text: "",
      type: "audio",
      voiceId: meta.messageId,
      audioUrl: audioUrl || undefined,
      duration: formatDurationStr(meta.duration),
      mime: meta.mime,
      ts: meta.timestamp,
      time: formatClockTime(meta.timestamp),
      status: "delivered",
      silent: false,
      // Timer starts when the note is playable, not when the meta frame
      // arrived: charging the transfer against the TTL would make long
      // voice notes expire before they ever render.
      selfDestructAt: resolveInboundSelfDestruct(meta.ttlMs),
    });
    try {
      await p2pNetwork.sendAddressed(
        p2pNetwork.peerForChat(meta.chatId) ?? p2pNetwork.peerForChatName(meta.chatName),
        encodeChatDeliveryAck({
          type: "chat-ack",
          seq: nextFrameSeq(),
          messageId,
          chatId: meta.chatId,
          timestamp: Date.now(),
        }),
      );
    } catch {
      // Ack is best-effort; the message is already delivered.
    }
  } finally {
    incomingAudioMetas.delete(frame.messageId);
    incomingAudioChunks.delete(frame.messageId);
  }
};