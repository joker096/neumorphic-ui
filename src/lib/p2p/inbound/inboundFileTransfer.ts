import { FTR_MAGIC, base64ToBytes, type FtrFrame, type TransferMeta } from "../../fileTransfer/frames";
import {
  saveTransferMeta, saveChunk, getTransferBlob,
  canAcceptFileTransfer, listTransfers, MAX_CONCURRENT_INCOMING_TRANSFERS,
} from "../../fileTransfer/fileStore";
import { sha256Hex } from "../../fileTransfer/integrity";
import { resolveInboundSelfDestruct } from "../../selfDestruct";
import { formatClockTime } from "../../../utils/chatUtils";
import { authorizeInboundChatFrame, mimeToType } from "./inboundGate";
import { appendIncomingToDmChat } from "./inboundChatStore";
import { albumChatByTransferId, incomingChunkIndices, incomingMetas } from "./inboundTransferState";

type SetReceiveProgress = (
  updater: (prev: Record<string, number>) => Record<string, number>,
) => void;

/**
 * `ftr1:` receive path: meta (authorize + persist + append the bubble), chunk
 * (dedupe + persist + progress) and end (reassemble + verify sha256 + complete).
 */
export const createFileFrameHandler = (setReceiveProgress: SetReceiveProgress) =>
  async (frame: FtrFrame, senderId: string) => {
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