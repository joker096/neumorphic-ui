import { useEffect, useState } from "react";
import { FTR_MAGIC, ALBUM_MAGIC, parseFrame, parseAlbumManifest, base64ToBytes, type FtrFrame, type TransferMeta, type AlbumManifest } from "../lib/fileTransfer/frames";
import { MSG_MAGIC, CALL_MAGIC, encodeChatDeliveryAck, nextFrameSeq, parseCallSignal, parseChatDeliveryAck, parseChatReadReceipt, parseChatText, parseChatAudioMeta, parseChatAudioChunk, parseChatAudioEnd, parseChatLocation, parseChatArticle, formatDurationStr, VOICE_P2P_MAX_SIZE, VOICE_P2P_MAX_CHUNKS, type ChatAudioMetaFrame } from "../lib/p2p/chatFrame";
import { saveVoiceBlob } from "../lib/voiceStore";
import {
  saveTransferMeta, saveChunk, getTransferBlob, pruneAbandonedTransfers,
  pruneCompletedTransfers, enforceFileTransferBudget, canAcceptFileTransfer,
  listTransfers, MAX_CONCURRENT_INCOMING_TRANSFERS,
} from "../lib/fileTransfer/fileStore";
import { sha256Hex } from "../lib/fileTransfer/integrity";
import { p2pNetwork, type BroadcastMessage } from "../lib/p2p/network";
import { useAppStore } from "../store";

/**
 * Module-level dedupe: `p2pNetwork.onMessage` has no unsubscribe, so StrictMode
 * double-mounts and multi-transport delivery can invoke handlers repeatedly.
 * Each wire `messageId` is processed exactly once per page.
 */
const processedMessageIds = new Set<string>();
const PROCESSED_ID_LIMIT = 1000;

/** In-memory transfer state for incoming files (meta → received chunk indices). */
const incomingMetas = new Map<string, TransferMeta>();
const incomingChunkIndices = new Map<string, Set<number>>();
const incomingAudioMetas = new Map<string, ChatAudioMetaFrame>();
const incomingAudioChunks = new Map<string, Map<number, Uint8Array>>();
/** Album state: manifest per albumId + the set of transferIds that belong to an album
 * (their per-file meta frames must NOT render as separate single-file bubbles). */
const incomingAlbums = new Map<string, AlbumManifest>();
const albumTransferIds = new Set<string>();
const ALBUM_STATE_LIMIT = 500;

function mimeToType(mime: string): "image" | "video" | "file" {
  return mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : "file";
}

function appendIncomingToDmChat(chatId: string, chatName: string, newMessage: any) {
  const { setChats } = useAppStore.getState();
  setChats((prevChats: any[]) => {
    const chats = prevChats || [];
    const chat = chats.find((c: any) => String(c.id) === chatId && c.type === "direct")
      || chats.find((c: any) => c.name === chatName && c.type === "direct");
    if (!chat) return chats;
    return chats.map((c: any) =>
      c.id === chat.id ? { ...c, history: insertBySendTime(c.history || [], newMessage) } : c,
    );
  });
}

/**
 * Incoming frames carry the sender's message id (Date.now() at send time), so a
 * late arrival (e.g. an ACK-pipeline retransmit) must land in send-time order
 * instead of blindly appending after already-rendered newer messages.
 */
function insertBySendTime(history: any[], message: any): any[] {
  const ts = Number(message.id) || Number(message.timestamp) || 0;
  const idx = history.findIndex((m) => (Number(m.id) || 0) > ts);
  if (idx === -1) return [...history, message];
  return [...history.slice(0, idx), message, ...history.slice(idx)];
}

function markOutgoingStatus(ack: { messageId: string; chatId: string } | null, status: "delivered" | "read") {
  if (!ack) return;
  const { setChats } = useAppStore.getState();
  setChats((prevChats: any[]) => (prevChats || []).map((chat: any) => {
    if (String(chat.id) !== ack.chatId) return chat;
    return {
      ...chat,
      history: (chat.history || []).map((message: any) =>
        String(message.id) === ack.messageId && message.sender === "me"
          ? { ...message, status }
          : message,
      ),
    };
  }));
}

/**
 * P2P receive: handles `ftr1:` file frames (meta/chunk/end) and `msg1:` chat text
 * frames broadcast by other peers. Incoming messages land in the name-matched
 * DM chat (skipped when no matching chat exists). Exposes per-transfer progress.
 */
export function useP2PMessages() {
  const [receiveProgress, setReceiveProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    // Storage GC at mount: abandoned incomplete transfers, stale completed transfers,
    // and byte-budget eviction (oldest first) keep the IDB file-transfer store bounded.
    void (async () => {
      await pruneAbandonedTransfers();
      await pruneCompletedTransfers();
      await enforceFileTransferBudget();
    })().catch(() => {});

    const handleFileFrame = async (frame: FtrFrame) => {
      if (frame.type === "meta") {
        // Reject incoming files when too many transfers are in flight or the
        // persisted byte budget would be exceeded (fail closed on scan errors).
        const [incompleteMetas, withinBudget] = await Promise.all([
          listTransfers(),
          canAcceptFileTransfer(frame.size),
        ]);
        if (incompleteMetas.filter((m) => !m.completed).length >= MAX_CONCURRENT_INCOMING_TRANSFERS) return;
        if (!withinBudget) return;
        const meta: TransferMeta = {
          transferId: frame.transferId,
          name: frame.name,
          mime: frame.mime,
          size: frame.size,
          chunkSize: frame.chunkSize,
          totalChunks: frame.totalChunks,
          sha256: frame.sha256,
          senderPeerId: frame.senderPeerId,
          senderName: frame.senderName,
        };
        incomingMetas.set(frame.transferId, meta);
        incomingChunkIndices.set(frame.transferId, new Set());
        setReceiveProgress((prev) => ({ ...prev, [frame.transferId]: 0 }));
        // receivedAt is touched on every chunk so abandoned transfers can be pruned by inactivity.
        await saveTransferMeta({ ...meta, receivedAt: Date.now(), receivedChunks: 0 });
        if (albumTransferIds.has(frame.transferId)) return;
        appendIncomingToDmChat("", meta.senderName, {
          id: Date.now(),
          sender: meta.senderName,
          text: "",
          type: mimeToType(meta.mime),
          attachment: FTR_MAGIC + frame.transferId,
          fileName: meta.name,
          fileSize: meta.size,
          fileTransferId: frame.transferId,
          ts: Date.now(),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "delivered",
          silent: false,
        });
      } else if (frame.type === "chunk") {
        const transferId = frame.transferId;
        const meta = incomingMetas.get(transferId);
        // Out-of-range chunk (unknown transfer / index beyond totalChunks) or a duplicate index → drop.
        if (!meta || frame.index >= meta.totalChunks) return;
        const indices = incomingChunkIndices.get(transferId)!;
        if (indices.has(frame.index)) return;
        indices.add(frame.index);
        const bytes = base64ToBytes(frame.data);
        await saveChunk(transferId, frame.index, bytes.buffer as ArrayBuffer);
        // Persist progress + touch receivedAt per chunk (same write cadence as saveChunk).
        await saveTransferMeta({ ...meta, receivedAt: Date.now(), receivedChunks: indices.size });
        const percent = Math.min(100, Math.round((indices.size / meta.totalChunks) * 100));
        setReceiveProgress((prev) => ({ ...prev, [transferId]: percent }));
      } else {
        // end: reassemble and verify the declared sha256 before marking completed.
        const meta = incomingMetas.get(frame.transferId);
        let completed = false;
        let integrityError: boolean | undefined;
        if (meta) {
          const blob = await getTransferBlob(frame.transferId, meta.totalChunks);
          if (blob) {
            const digest = await sha256Hex(new Uint8Array(await blob.arrayBuffer()));
            completed = digest.toLowerCase() === meta.sha256.toLowerCase();
            if (!completed) integrityError = true;
          }
          await saveTransferMeta({ ...meta, receivedChunks: meta.totalChunks, completed, integrityError });
        }
        incomingMetas.delete(frame.transferId);
        incomingChunkIndices.delete(frame.transferId);
        setReceiveProgress((prev) => ({ ...prev, [frame.transferId]: completed ? 100 : 0 }));
      }
    };

    const handleAlbumManifest = (manifest: AlbumManifest, senderId: string) => {
      p2pNetwork.rememberPeer(senderId, manifest.senderName);
      p2pNetwork.rememberChatPeer(manifest.chatId, manifest.chatName, senderId);
      if (incomingAlbums.has(manifest.albumId)) return;
      for (const e of manifest.entries) albumTransferIds.add(e.transferId);
      incomingAlbums.set(manifest.albumId, manifest);
      if (incomingAlbums.size > ALBUM_STATE_LIMIT) incomingAlbums.clear();
      if (albumTransferIds.size > ALBUM_STATE_LIMIT) albumTransferIds.clear();
      appendIncomingToDmChat(manifest.chatId, manifest.chatName, {
        id: manifest.messageId,
        sender: manifest.senderName,
        text: "",
        type: "image",
        attachment: FTR_MAGIC + manifest.entries[0].transferId,
        fileName: manifest.entries[0].name,
        fileSize: manifest.entries[0].size,
        fileTransferId: manifest.entries[0].transferId,
        album: manifest.entries.map((e) => ({ url: FTR_MAGIC + e.transferId, fileName: e.name, fileSize: e.size })),
        ts: manifest.timestamp,
        time: new Date(manifest.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "delivered",
        silent: manifest.silent ?? false,
      });
      void p2pNetwork.sendAddressed(senderId, encodeChatDeliveryAck({
        type: "chat-ack",
        seq: nextFrameSeq(),
        messageId: String(manifest.messageId),
        chatId: manifest.chatId,
        timestamp: Date.now(),
      })).catch(() => {});
    };

    const handleChatText = (frame: ReturnType<typeof parseChatText>, senderId: string) => {
      if (!frame) return;
      const messageId = frame.messageId || String(frame.timestamp);
      appendIncomingToDmChat(frame.chatId, frame.chatName, {
        id: messageId,
        sender: frame.senderName,
        text: frame.text,
        type: "text",
        ts: frame.timestamp,
        time: new Date(frame.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "delivered",
        silent: frame.silent,
      });
      void p2pNetwork.sendAddressed(senderId, encodeChatDeliveryAck({
        type: "chat-ack",
        seq: nextFrameSeq(),
        messageId,
        chatId: frame.chatId,
        timestamp: Date.now(),
      })).catch(() => {});
    };

    const handleAudioMeta = (frame: ChatAudioMetaFrame, senderId: string) => {
      if (!frame) return;
      p2pNetwork.rememberPeer(senderId, frame.senderName);
      p2pNetwork.rememberChatPeer(frame.chatId, frame.chatName, senderId);
      // Fail closed on oversized/oversharded voice payloads.
      if (frame.size <= 0 || frame.size > VOICE_P2P_MAX_SIZE) return;
      if (frame.totalChunks < 1 || frame.totalChunks > VOICE_P2P_MAX_CHUNKS) return;
      if (frame.chunkSize * frame.totalChunks < frame.size) return;
      if (incomingAudioMetas.has(frame.messageId)) return;
      incomingAudioMetas.set(frame.messageId, frame);
      incomingAudioChunks.set(frame.messageId, new Map());
    };

    const handleAudioChunk = async (frame: ReturnType<typeof parseChatAudioChunk>) => {
      if (!frame) return;
      const meta = incomingAudioMetas.get(frame.messageId);
      if (!meta) return;
      if (frame.index < 0 || frame.index >= meta.totalChunks) return;
      const chunks = incomingAudioChunks.get(frame.messageId);
      if (!chunks || chunks.has(frame.index)) return;
      chunks.set(frame.index, base64ToBytes(frame.data));
    };

    const handleAudioEnd = async (frame: ReturnType<typeof parseChatAudioEnd>) => {
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
        appendIncomingToDmChat(meta.chatId, meta.chatName, {
          id: messageId,
          sender: meta.senderName,
          text: "",
          type: "audio",
          voiceId: meta.messageId,
          audioUrl: audioUrl || undefined,
          duration: formatDurationStr(meta.duration),
          mime: meta.mime,
          ts: meta.timestamp,
          time: new Date(meta.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "delivered",
          silent: false,
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

    const handleMessage = (msg: BroadcastMessage) => {
      if (msg.senderId === p2pNetwork.getPeerId()) return;
      if (processedMessageIds.has(msg.messageId)) return;
      processedMessageIds.add(msg.messageId);
      if (processedMessageIds.size > PROCESSED_ID_LIMIT) processedMessageIds.clear();

      const raw = typeof msg.data === "string" ? msg.data : "";
      if (raw.startsWith(CALL_MAGIC)) {
        const callSig = parseCallSignal(raw);
        if (callSig) void import("../lib/call/CallManager").then(({ callManager }) => callManager.handleRemoteCallSignal(msg.senderId, callSig));
        return;
      }
      if (raw.startsWith(FTR_MAGIC)) {
        const frame = parseFrame(raw);
        if (frame) void handleFileFrame(frame).catch(() => {});
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
            p2pNetwork.rememberPeer(msg.senderId, location.senderName);
            p2pNetwork.rememberChatPeer(location.chatId, location.chatName, msg.senderId);
            appendIncomingToDmChat(location.chatId, location.chatName, {
              id: location.messageId,
              sender: location.senderName,
              type: "location",
              lat: location.lat,
              lng: location.lng,
              text: "",
              ts: location.timestamp,
              time: new Date(location.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              status: "delivered",
              silent: location.silent,
            });
            void p2pNetwork.sendAddressed(msg.senderId, encodeChatDeliveryAck({
              type: "chat-ack",
              seq: nextFrameSeq(),
              messageId: location.messageId,
              chatId: location.chatId,
              timestamp: Date.now(),
            })).catch(() => {});
            return;
          }
          const article = parseChatArticle(raw);
          if (article) {
            p2pNetwork.rememberPeer(msg.senderId, article.senderName);
            p2pNetwork.rememberChatPeer(article.chatId, article.chatName, msg.senderId);
            appendIncomingToDmChat(article.chatId, article.chatName, {
              id: article.messageId,
              sender: article.senderName,
              type: "article",
              url: article.url,
              title: article.title || "",
              text: "",
              ts: article.timestamp,
              time: new Date(article.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              status: "delivered",
              silent: article.silent,
            });
            void p2pNetwork.sendAddressed(msg.senderId, encodeChatDeliveryAck({
              type: "chat-ack",
              seq: nextFrameSeq(),
              messageId: article.messageId,
              chatId: article.chatId,
              timestamp: Date.now(),
            })).catch(() => {});
            return;
          }
          const text = parseChatText(raw);
          if (text) {
            p2pNetwork.rememberPeer(msg.senderId, text.senderName);
            p2pNetwork.rememberChatPeer(text.chatId, text.chatName, msg.senderId);
          }
          handleChatText(text, msg.senderId);
        }
      }
    };

    p2pNetwork.onMessage(handleMessage);
  }, []);

  return { receiveProgress };
}
