import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "../lib/i18n";
import { getAttachmentLimit } from "../config/premium";
import { isAllowedFileType } from "../config/allowedFileTypes";
import { FTR_MAGIC, encodeFrame, nextFileSeq, bytesToBase64, type FtrFrame } from "../lib/fileTransfer/frames";
import { chunkSizeForFileSize, sliceFileChunks } from "../lib/fileTransfer/chunker";
import { sha256Hex } from "../lib/fileTransfer/integrity";
import { saveTransferMeta, saveChunk, type StoredTransfer } from "../lib/fileTransfer/fileStore";
import { p2pNetwork } from "../lib/p2p/network";
import { useAppStore } from "../store";

export interface FileSendProgress {
  transferId: string;
  percent: number;
}

export interface UseFileSendDeps {
  setChats: (updater: any) => void;
  setActiveChat?: (updater: any) => void;
  onUpdateChat?: (chat: any) => void;
}

/**
 * P2P file send: hashes the file, persists chunks locally (so the sender's own
 * `ftr:` message can render) and streams meta/chunk/end frames over `p2pNetwork.broadcast()`.
 * Offline send keeps the message "queued" and skips broadcast (best-effort, accepted limitation).
 */
export function useFileSend(chat: any, deps: UseFileSendDeps) {
  const { setChats, setActiveChat, onUpdateChat } = deps;
  const { t } = useI18n();
  const [progress, setProgress] = useState<FileSendProgress | null>(null);
  const sendingRef = useRef(false);

  const appendMessage = useCallback((newMessage: any) => {
    setChats((prevChats: any[]) => (prevChats || []).map((c: any) =>
      c.id === chat?.id ? { ...c, history: [...(c.history || []), newMessage] } : c,
    ));
    if (setActiveChat) {
      setActiveChat((prev: any) => {
        if (!prev) return prev;
        return { ...prev, history: [...(prev.history || []), newMessage] };
      });
    }
    if (onUpdateChat) onUpdateChat({ ...chat, history: [...(chat.history || []), newMessage] });
  }, [chat, setChats, setActiveChat, onUpdateChat]);

  const updateMessageStatus = useCallback((msgId: number, status: string) => {
    setChats((prevChats: any[]) => (prevChats || []).map((c: any) =>
      c.id === chat?.id && c.history
        ? { ...c, history: c.history.map((m: any) => (m.id === msgId ? { ...m, status } : m)) }
        : c,
    ));
    if (setActiveChat) {
      setActiveChat((prev: any) => {
        if (!prev) return prev;
        return { ...prev, history: (prev.history || []).map((m: any) => (m.id === msgId ? { ...m, status } : m)) };
      });
    }
    if (onUpdateChat) {
      onUpdateChat({ ...chat, history: (chat.history || []).map((m: any) => (m.id === msgId ? { ...m, status } : m)) });
    }
  }, [chat, setChats, setActiveChat, onUpdateChat]);

  const sendFile = useCallback(async (file: File, opts: { silent?: boolean } = {}) => {
    if (!chat || !file || sendingRef.current) return;
    const premium = useAppStore.getState().premiumEntitlement?.premium ?? false;
    if (file.size > getAttachmentLimit(premium)) {
      toast(t("premium.fileTooLarge", { limit: `${Math.round(getAttachmentLimit(premium) / (1024 * 1024))} MB` }));
      return;
    }
    if (!isAllowedFileType(file)) {
      toast(t("premium.fileTypeInvalid", "File type not allowed"));
      return;
    }

    sendingRef.current = true;
    const profile = useAppStore.getState().userProfile;
    const senderName = profile?.name || (profile?.username ? `@${profile.username}` : "User");
    const mime = file.type || "application/octet-stream";
    const type: "image" | "video" | "file" = mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : "file";
    const chunkSize = chunkSizeForFileSize(file.size);
    const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
    const transferId = crypto.randomUUID();
    const online = navigator.onLine;
    const msgId = Date.now();
    const newMessage: any = {
      id: msgId,
      sender: "me",
      text: "",
      type,
      attachment: FTR_MAGIC + transferId,
      fileName: file.name,
      fileSize: file.size,
      fileTransferId: transferId,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "queued",
      silent: opts.silent ?? false,
    };
    appendMessage(newMessage);

    const safeSend = (frame: FtrFrame) => p2pNetwork.sendAddressed(p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name), encodeFrame(frame));

    try {
      const sha256 = await sha256Hex(await file.arrayBuffer());
      const meta: StoredTransfer = {
        transferId,
        name: file.name,
        mime,
        size: file.size,
        chunkSize,
        totalChunks,
        sha256,
        senderPeerId: p2pNetwork.getPeerId(),
        senderName,
        receivedChunks: 0,
      };
      await saveTransferMeta(meta);
      if (online) {
        await safeSend({ type: "meta", seq: nextFileSeq(), ...meta });
        for await (const chunk of sliceFileChunks(file)) {
          await saveChunk(transferId, chunk.index, chunk.data);
          await safeSend({ type: "chunk", seq: nextFileSeq(), transferId, index: chunk.index, data: bytesToBase64(new Uint8Array(chunk.data)) });
          setProgress({ transferId, percent: Math.round(((chunk.index + 1) / totalChunks) * 100) });
        }
        await safeSend({ type: "end", seq: nextFileSeq(), transferId });
        await saveTransferMeta({ ...meta, receivedChunks: totalChunks, completed: true });
        updateMessageStatus(msgId, "sent");
      }
    } catch {
      updateMessageStatus(msgId, "failed");
      toast(t("fileTransfer.sendFailed", "File transfer failed"));
    } finally {
      sendingRef.current = false;
      setProgress(null);
    }
  }, [chat, appendMessage, updateMessageStatus, t]);

  return { sendFile, progress };
}
