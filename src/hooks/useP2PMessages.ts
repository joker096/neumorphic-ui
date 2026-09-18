import { useEffect, useState } from "react";
import { FTR_MAGIC, parseFrame, base64ToBytes, type FtrFrame, type TransferMeta } from "../lib/fileTransfer/frames";
import { MSG_MAGIC, CALL_MAGIC, encodeChatDeliveryAck, nextFrameSeq, parseCallSignal, parseChatDeliveryAck, parseChatReadReceipt, parseChatText } from "../lib/p2p/chatFrame";
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
      if (raw.startsWith(MSG_MAGIC)) {
        const ack = parseChatDeliveryAck(raw);
        const read = parseChatReadReceipt(raw);
        if (ack) markOutgoingStatus(ack, "delivered");
        else if (read) markOutgoingStatus(read, "read");
        else {
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
