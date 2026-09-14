import { useEffect, useState } from "react";
import { FTR_MAGIC, parseFrame, base64ToBytes, type FtrFrame, type TransferMeta } from "../lib/fileTransfer/frames";
import { MSG_MAGIC, parseChatText } from "../lib/p2p/chatFrame";
import { saveTransferMeta, saveChunk } from "../lib/fileTransfer/fileStore";
import { p2pNetwork, type BroadcastMessage } from "../lib/p2p/network";
import { useAppStore } from "../store";

/**
 * Module-level dedupe: `p2pNetwork.onMessage` has no unsubscribe, so StrictMode
 * double-mounts and multi-transport delivery can invoke handlers repeatedly.
 * Each wire `messageId` is processed exactly once per page.
 */
const processedMessageIds = new Set<string>();
const PROCESSED_ID_LIMIT = 1000;

/** In-memory transfer state for incoming files (meta → chunk count). */
const incomingMetas = new Map<string, TransferMeta>();
const incomingChunkCounts = new Map<string, number>();

function mimeToType(mime: string): "image" | "video" | "file" {
  return mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : "file";
}

function appendIncomingToDmChat(chatName: string, newMessage: any) {
  const { setChats } = useAppStore.getState();
  setChats((prevChats: any[]) => {
    const chats = prevChats || [];
    const chat = chats.find((c: any) => c.name === chatName && c.type === "direct");
    if (!chat) return chats;
    return chats.map((c: any) =>
      c.id === chat.id ? { ...c, history: [...(c.history || []), newMessage] } : c,
    );
  });
}

/**
 * P2P receive: handles `ftr1:` file frames (meta/chunk/end) and `msg1:` chat text
 * frames broadcast by other peers. Incoming messages land in the name-matched
 * DM chat (skipped when no matching chat exists). Exposes per-transfer progress.
 */
export function useP2PMessages() {
  const [receiveProgress, setReceiveProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const handleFileFrame = async (frame: FtrFrame) => {
      if (frame.type === "meta") {
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
        incomingChunkCounts.set(frame.transferId, 0);
        setReceiveProgress((prev) => ({ ...prev, [frame.transferId]: 0 }));
        await saveTransferMeta({ ...meta, receivedChunks: 0 });
        appendIncomingToDmChat(meta.senderName, {
          id: Date.now(),
          sender: meta.senderName,
          text: "",
          type: mimeToType(meta.mime),
          attachment: FTR_MAGIC + frame.transferId,
          fileName: meta.name,
          fileSize: meta.size,
          fileTransferId: frame.transferId,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "delivered",
          silent: false,
        });
      } else if (frame.type === "chunk") {
        const bytes = base64ToBytes(frame.data);
        await saveChunk(frame.transferId, frame.index, bytes.buffer as ArrayBuffer);
        const count = (incomingChunkCounts.get(frame.transferId) ?? 0) + 1;
        incomingChunkCounts.set(frame.transferId, count);
        const meta = incomingMetas.get(frame.transferId);
        if (meta) {
          const percent = Math.min(100, Math.round((count / meta.totalChunks) * 100));
          setReceiveProgress((prev) => ({ ...prev, [frame.transferId]: percent }));
        }
      } else {
        // end
        const meta = incomingMetas.get(frame.transferId);
        if (meta) {
          await saveTransferMeta({ ...meta, receivedChunks: meta.totalChunks, completed: true });
        }
        incomingChunkCounts.delete(frame.transferId);
        setReceiveProgress((prev) => ({ ...prev, [frame.transferId]: 100 }));
      }
    };

    const handleChatText = (frame: ReturnType<typeof parseChatText>) => {
      if (!frame) return;
      appendIncomingToDmChat(frame.chatName, {
        id: frame.timestamp,
        sender: frame.senderName,
        text: frame.text,
        type: "text",
        time: new Date(frame.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "delivered",
        silent: frame.silent,
      });
    };

    const handleMessage = (msg: BroadcastMessage) => {
      if (msg.senderId === p2pNetwork.getPeerId()) return;
      if (processedMessageIds.has(msg.messageId)) return;
      processedMessageIds.add(msg.messageId);
      if (processedMessageIds.size > PROCESSED_ID_LIMIT) processedMessageIds.clear();

      const raw = typeof msg.data === "string" ? msg.data : "";
      if (raw.startsWith(FTR_MAGIC)) {
        const frame = parseFrame(raw);
        if (frame) void handleFileFrame(frame).catch(() => {});
        return;
      }
      if (raw.startsWith(MSG_MAGIC)) {
        handleChatText(parseChatText(raw));
      }
    };

    p2pNetwork.onMessage(handleMessage);
  }, []);

  return { receiveProgress };
}
