import { useCallback, useEffect } from "react";
import {
  encodeChatAudioChunk, encodeChatAudioEnd, encodeChatAudioMeta, encodeChatText,
  nextFrameSeq, parseDurationStr, VOICE_P2P_CHUNK_SIZE, VOICE_P2P_MAX_CHUNKS, VOICE_P2P_MAX_SIZE,
} from "../lib/p2p/chatFrame";
import { p2pNetwork } from "../lib/p2p/network";
import { wireSelfDestructTtl } from "../lib/selfDestruct";
import { getVoiceBlob } from "../lib/voiceStore";
import { sha256Hex } from "../lib/fileTransfer/integrity";
import { bytesToBase64 } from "../lib/fileTransfer/frames";
import {
  getPendingMessages, markMessageSent, pruneExpiredQueuedMessages,
  retryMessage, removeQueuedMessage, queueBackoffMs, MAX_QUEUE_RETRIES,
} from "../lib/messageQueue";
import { useAppStore } from "../store";
import { executeEditMessage } from "../lib/chatEdit";

interface MessageWireArgs {
  activeChat: any;
  setChats: (updater: any) => void;
  setActiveChat: (updater: any) => void;
  /**
   * Own the offline-queue flush (mount + online + 30s retry). Secondary mounts
   * (e.g. `useScheduledMessages`) only need the send primitives and must leave
   * the single flush loop to the primary mount in `useMessageActions` — two
   * flush loops would read the same pending batch and dispatch it twice.
   */
  flushQueue?: boolean;
}

export function useMessageWire({ activeChat, setChats, setActiveChat, flushQueue = true }: MessageWireArgs) {
  const updateMessageStatus = useCallback((msgId: number, status: string) => {
    setChats((prevChats: any[]) => prevChats.map((c: any) => {
      if (!c.history) return c;
      return { ...c, history: c.history.map((m: any) => m.id === msgId ? { ...m, status } : m) };
    }));
    setActiveChat((prev: any) => {
      if (!prev) return prev;
      return { ...prev, history: prev.history.map((m: any) => m.id === msgId ? { ...m, status } : m) };
    });
  }, [setChats, setActiveChat]);

  const sendTextOverP2P = useCallback(async (message: any, chat: any) => {
    const sender = useAppStore.getState().userProfile;
    const frame = encodeChatText({
      type: "chat-text",
      seq: nextFrameSeq(),
      messageId: String(message.id),
      chatId: String(chat.id),
      chatName: String(chat.name || ""),
      senderName: sender?.name || sender?.username || "User",
      text: String(message.text || ""),
      silent: !!message.silent,
      timestamp: Number(message.id) || Date.now(),
      ttlMs: wireSelfDestructTtl(message.selfDestructAt),
    });
    await p2pNetwork.sendAddressed(p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name), frame);
    updateMessageStatus(message.id, "sent");
  }, [updateMessageStatus]);

  const sendVoiceOverP2P = useCallback(async (message: any, chat: any) => {
    const sender = useAppStore.getState().userProfile;
    const voiceId = String(message.voiceId ?? message.id);
    const blob = await getVoiceBlob(voiceId);
    if (!blob) throw new Error("Voice blob unavailable");
    if (blob.size > VOICE_P2P_MAX_SIZE) throw new Error("Voice message too large");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (bytes.length > VOICE_P2P_MAX_SIZE) throw new Error("Voice message too large");

    const totalChunks = Math.max(1, Math.ceil(bytes.length / VOICE_P2P_CHUNK_SIZE));
    if (totalChunks > VOICE_P2P_MAX_CHUNKS) throw new Error("Voice message too large");

    const duration = parseDurationStr(String(message.duration || "0:00"));
    const sha256 = await sha256Hex(bytes);
    const target = p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name);

    const metaFrame = encodeChatAudioMeta({
      type: "chat-audio-meta",
      seq: nextFrameSeq(),
      messageId: voiceId,
      chatId: String(chat.id),
      chatName: String(chat.name || ""),
      senderName: sender?.name || sender?.username || "User",
      duration,
      mime: blob.type || "audio/webm",
      size: bytes.length,
      chunkSize: VOICE_P2P_CHUNK_SIZE,
      totalChunks,
      sha256,
      timestamp: Number(message.id) || Date.now(),
      ttlMs: wireSelfDestructTtl(message.selfDestructAt),
    });
    await p2pNetwork.sendAddressed(target, metaFrame);

    for (let index = 0; index < totalChunks; index++) {
      const slice = bytes.subarray(index * VOICE_P2P_CHUNK_SIZE, (index + 1) * VOICE_P2P_CHUNK_SIZE);
      const chunkFrame = encodeChatAudioChunk({
        type: "chat-audio-chunk",
        seq: nextFrameSeq(),
        messageId: voiceId,
        index,
        data: bytesToBase64(slice),
      });
      await p2pNetwork.sendAddressed(target, chunkFrame);
    }

    const endFrame = encodeChatAudioEnd({
      type: "chat-audio-end",
      seq: nextFrameSeq(),
      messageId: voiceId,
    });
    await p2pNetwork.sendAddressed(target, endFrame);
    updateMessageStatus(message.id, "sent");
  }, [updateMessageStatus]);

  useEffect(() => {
    if (!flushQueue) return;
    const attempt = async (item: any): Promise<void> => {
      const chatContext = { id: item.data.chatId, name: item.data.chatName };
      try {
        if (item.data?.type === "audio") {
          await sendVoiceOverP2P(item.data, chatContext);
        } else {
          await sendTextOverP2P(item.data, chatContext);
        }
        await markMessageSent(item.id);
      } catch {
        // Honest failure: there is no server-side queue, so a frame that never
        // left the device stays queued and is retried with exponential
        // backoff. Only after MAX_QUEUE_RETRIES do we evict it and surface a
        // failed bubble (with a manual retry affordance).
        const retryCount = (item.retryCount || 0) + 1;
        if (retryCount >= MAX_QUEUE_RETRIES) {
          await removeQueuedMessage(item.id).catch(() => {});
          if (item.data?.id !== undefined) updateMessageStatus(item.data.id, "failed");
        } else {
          await retryMessage(item).catch(() => {});
        }
      }
    };

    const flush = async () => {
      if (!navigator.onLine) return;
      const pending = await getPendingMessages().catch(() => []);
      for (const item of pending) {
        // Text, sticker, and audio messages have wire representations; image
        // and video media still use their own local-only sync path.
        const type = item.data?.type;
        const isDeliverable = type === undefined || type === "sticker" || type === "audio";
        if (!isDeliverable) continue;
        // Exponential backoff between failed attempts for the same item.
        const lastRetry = item.lastRetry || 0;
        if (lastRetry && Date.now() - lastRetry < queueBackoffMs(item.retryCount || 0)) continue;
        // One failed message must not abort the rest of the queue.
        await attempt(item);
      }
    };

    const prune = async () => {
      if (!navigator.onLine) return;
      await pruneExpiredQueuedMessages().catch(() => {});
      await flush();
    };

    void prune();
    window.addEventListener("online", prune);
    // Periodic retry so queued messages recover without a connectivity toggle.
    const retryTimer = window.setInterval(() => void flush(), 30_000);
    return () => {
      window.removeEventListener("online", prune);
      window.clearInterval(retryTimer);
    };
  }, [sendTextOverP2P, sendVoiceOverP2P, updateMessageStatus, flushQueue]);

  const editMessage = useCallback((messageId: number, newText: string) => {
    executeEditMessage(messageId, newText, activeChat);
  }, [activeChat]);

  return { updateMessageStatus, sendTextOverP2P, sendVoiceOverP2P, editMessage };
}
