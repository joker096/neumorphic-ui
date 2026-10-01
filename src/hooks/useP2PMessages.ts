import { useEffect, useState } from "react";
import { FTR_MAGIC, ALBUM_MAGIC, parseFrame, parseAlbumManifest, base64ToBytes, type FtrFrame, type TransferMeta, type AlbumManifest } from "../lib/fileTransfer/frames";
import { MSG_MAGIC, CALL_MAGIC, encodeChatDeliveryAck, nextFrameSeq, parseCallSignal, parseChatDeliveryAck, parseChatReadReceipt, parseChatEdit, parseChatText, parseChatAudioMeta, parseChatAudioChunk, parseChatAudioEnd, parseChatLocation, parseChatArticle, formatDurationStr, VOICE_P2P_MAX_SIZE, VOICE_P2P_MAX_CHUNKS, type ChatAudioMetaFrame } from "../lib/p2p/chatFrame";
import { saveVoiceBlob } from "../lib/voiceStore";
import { resolveInboundSelfDestruct } from "../lib/selfDestruct";
import {
  saveTransferMeta, saveChunk, getTransferBlob, pruneAbandonedTransfers,
  pruneCompletedTransfers, enforceFileTransferBudget, canAcceptFileTransfer,
  listTransfers, MAX_CONCURRENT_INCOMING_TRANSFERS,
} from "../lib/fileTransfer/fileStore";
import { sha256Hex } from "../lib/fileTransfer/integrity";
import { p2pNetwork, type BroadcastMessage } from "../lib/p2p/network";
import { useAppStore } from "../store";
import { formatClockTime } from "../utils/chatUtils";

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
/** Album state: manifest per albumId + the chat each album transferId belongs to
 * (their per-file meta frames must NOT render as separate single-file bubbles, and
 * they are authorized against the same chat the manifest was authorized for). */
const incomingAlbums = new Map<string, AlbumManifest>();
const albumChatByTransferId = new Map<string, any>();
const ALBUM_STATE_LIMIT = 500;

function mimeToType(mime: string): "image" | "video" | "file" {
  return mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : "file";
}

/** Resolve the local direct chat an inbound frame is addressed to, if any. */
function resolveInboundDirectChat(chatId: string, chatName: string): any | null {
  const { chats } = useAppStore.getState();
  const list = (chats || []) as any[];
  const byId = list.find((c: any) => String(c.id) === String(chatId) && c.type === "direct");
  if (byId) return byId;
  if (!chatName) return null;
  return list.find((c: any) => c.name === chatName && c.type === "direct") || null;
}

const normName = (v: unknown): string => String(v ?? "").trim().toLowerCase();

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
function authorizeInboundChatFrame(
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

function appendIncomingToDmChat(chat: any, newMessage: any) {
  const { setChats } = useAppStore.getState();
  setChats((prevChats: any[]) => {
    const chats = prevChats || [];
    if (!chats.some((c: any) => c.id === chat.id)) return chats;
    return chats.map((c: any) =>
      c.id === chat.id ? { ...c, history: insertBySendTime(c.history || [], newMessage) } : c,
    );
  });
}

/**
 * Send time of a bubble, for ordering.
 *
 * `ts` is the canonical send time. `id` is only a fallback because most
 * senders use `Date.now()` for both, but live-location ids are strings
 * (`live_<chat>_<ts>`) and `Number("live_…")` is `NaN`, which collapsed to 0
 * and pushed a freshly started share to the top of the chat.
 */
const sendTimeOf = (m: any): number =>
  Number(m?.ts) || Number(m?.id) || Number(m?.timestamp) || 0;

/**
 * Incoming frames carry the sender's message id (Date.now() at send time), so a
 * late arrival (e.g. an ACK-pipeline retransmit) must land in send-time order
 * instead of blindly appending after already-rendered newer messages.
 */
function insertBySendTime(history: any[], message: any): any[] {
  const ts = sendTimeOf(message);
  const idx = history.findIndex((m) => sendTimeOf(m) > ts);
  if (idx === -1) return [...history, message];
  return [...history.slice(0, idx), message, ...history.slice(idx)];
}

/**
 * Upsert variant used by live-location updates: a stream reuses one
 * `messageId`, so the frame must patch the existing bubble rather than append
 * a duplicate. Returns whether the bubble was created by this call, so the
 * caller can acknowledge only the first frame of a stream instead of every
 * GPS fix.
 */
function upsertIncomingToDmChat(chat: any, newMessage: any): { created: boolean } {
  const { setChats } = useAppStore.getState();
  let created = false;
  setChats((prevChats: any[]) => {
    const chats = prevChats || [];
    if (!chats.some((c: any) => c.id === chat.id)) return chats;
    return chats.map((c: any) => {
      if (c.id !== chat.id) return c;
      const history = c.history || [];
      const idx = history.findIndex((m: any) => String(m.id) === String(newMessage.id));
      if (idx === -1) {
        created = true;
        return { ...c, history: insertBySendTime(history, newMessage) };
      }
      // Keep the original send time: a moving bubble must not jump to the top
      // of the chat on every fix.
      const previous = history[idx];
      return {
        ...c,
        history: [
          ...history.slice(0, idx),
          { ...previous, ...newMessage, id: previous.id, ts: previous.ts ?? newMessage.ts },
          ...history.slice(idx + 1),
        ],
      };
    });
  });
  return { created };
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

    const handleFileFrame = async (frame: FtrFrame, senderId: string) => {
      if (frame.type === "meta") {
        // Reject incoming files when too many transfers are in flight or the
        // persisted byte budget would be exceeded (fail closed on scan errors).
        const [incompleteMetas, withinBudget] = await Promise.all([
          listTransfers(),
          canAcceptFileTransfer(frame.size),
        ]);
        if (incompleteMetas.filter((m) => !m.completed).length >= MAX_CONCURRENT_INCOMING_TRANSFERS) return;
        if (!withinBudget) return;
        // File frames carry no chat id, only a sender name, so the chat is
        // resolved by name and the transport-authenticated peer (not the
        // sender-asserted `senderPeerId`) must own it. Album entries inherit the
        // chat their manifest was authorized for. Authorization happens before
        // any state is touched, so a foreign peer cannot persist transfer state.
        const albumChat = albumChatByTransferId.get(frame.transferId);
        const chat = albumChat ?? authorizeInboundChatFrame("", frame.senderName, senderId, "file");
        if (!chat) return;
        const meta: TransferMeta = {
          transferId: frame.transferId,
          name: frame.name,
          mime: frame.mime,
          size: frame.size,
          chunkSize: frame.chunkSize,
          totalChunks: frame.totalChunks,
          sha256: frame.sha256,
          senderPeerId: senderId,
          senderName: chat.name,
        };
        const selfDestructAt = resolveInboundSelfDestruct(frame.ttlMs);
        incomingMetas.set(frame.transferId, meta);
        incomingChunkIndices.set(frame.transferId, new Set());
        setReceiveProgress((prev) => ({ ...prev, [frame.transferId]: 0 }));
        // receivedAt is touched on every chunk so abandoned transfers can be pruned by inactivity.
        await saveTransferMeta({ ...meta, receivedAt: Date.now(), receivedChunks: 0 });
        if (albumChat) return;
        appendIncomingToDmChat(chat, {
          id: Date.now(),
          sender: chat.name,
          text: "",
          type: mimeToType(meta.mime),
          attachment: FTR_MAGIC + frame.transferId,
          fileName: meta.name,
          fileSize: meta.size,
          fileTransferId: frame.transferId,
          videoNote: frame.videoNote ?? false,
          ts: Date.now(),
          time: formatClockTime(Date.now()),
          status: "delivered",
          silent: false,
          selfDestructAt,
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

    const handleChatText = (frame: ReturnType<typeof parseChatText>, senderId: string) => {
      if (!frame) return;
      const messageId = frame.messageId || String(frame.timestamp);
      // `sender` is the local contact name, never the sender-asserted one.
      const chat = authorizeInboundChatFrame(frame.chatId, frame.chatName, senderId, "chat-text");
      if (!chat) return;
      appendIncomingToDmChat(chat, {
        id: messageId,
        sender: chat.name,
        text: frame.text,
        type: "text",
        ts: frame.timestamp,
        time: formatClockTime(frame.timestamp),
        status: "delivered",
        silent: frame.silent,
        selfDestructAt: resolveInboundSelfDestruct(frame.ttlMs),
      });
      void p2pNetwork.sendAddressed(senderId, encodeChatDeliveryAck({
        type: "chat-ack",
        seq: nextFrameSeq(),
        messageId,
        chatId: frame.chatId,
        timestamp: Date.now(),
      })).catch(() => {});
    };

    const handleChatEdit = (frame: ReturnType<typeof parseChatEdit>, senderId: string) => {
      if (!frame) return;
      const chat = authorizeInboundChatFrame(frame.chatId, frame.chatName, senderId, "chat-edit");
      if (!chat) return;
      const { setChats } = useAppStore.getState();
      setChats((prevChats: any[]) => {
        const chats = prevChats || [];
        if (!chats.some((c: any) => c.id === chat.id)) return chats;
        return chats.map((c: any) =>
          c.id === chat.id
            ? {
                ...c,
                history: (c.history || []).map((m: any) =>
                  String(m.id) === frame.messageId ? { ...m, text: frame.text, edited: true } : m,
                ),
              }
            : c,
        );
      });
    };

    const handleAudioMeta = (frame: ChatAudioMetaFrame, senderId: string) => {
      if (!frame) return;
      if (!authorizeInboundChatFrame(frame.chatId, frame.chatName, senderId, "voice")) return;
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
            const chat = authorizeInboundChatFrame(location.chatId, location.chatName, msg.senderId, "location");
            if (!chat) return;
            // A live share expires on an absolute clock rather than relying on a
            // final "stop" frame arriving. If it never does, the receiver must
            // still stop treating the bubble as live — so an already-expired
            // frame is demoted to a static pin here.
            const isLive = location.live === true
              && location.expiresAt !== undefined
              && location.expiresAt > Date.now();
            const { created } = upsertIncomingToDmChat(chat, {
              id: location.messageId,
              sender: chat.name,
              type: "location",
              lat: location.lat,
              lng: location.lng,
              accuracy: location.accuracy,
              approximate: location.approximate,
              isLive,
              expiresAt: location.expiresAt,
              text: "",
              ts: location.timestamp,
              time: formatClockTime(location.timestamp),
              status: "delivered",
              silent: location.silent,
              selfDestructAt: resolveInboundSelfDestruct(location.ttlMs),
            });
            // Acknowledging every GPS fix would flood the wire, so only the
            // frame that actually created the bubble is confirmed.
            if (!created && typeof location.live === 'boolean') return;
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
            const chat = authorizeInboundChatFrame(article.chatId, article.chatName, msg.senderId, "article");
            if (!chat) return;
            appendIncomingToDmChat(chat, {
              id: article.messageId,
              sender: chat.name,
              type: "article",
              url: article.url,
              title: article.title || "",
              text: "",
              ts: article.timestamp,
              time: formatClockTime(article.timestamp),
              status: "delivered",
              silent: article.silent,
              selfDestructAt: resolveInboundSelfDestruct(article.ttlMs),
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
          const edit = parseChatEdit(raw);
          if (edit) {
            handleChatEdit(edit, msg.senderId);
            return;
          }
          handleChatText(text, msg.senderId);
        }
      }
    };

    p2pNetwork.onMessage(handleMessage);
  }, []);

  return { receiveProgress };
}
