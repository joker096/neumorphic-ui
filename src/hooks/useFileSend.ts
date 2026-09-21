import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "../lib/i18n";
import { getAttachmentLimit } from "../config/premium";
import { isAllowedFileType } from "../config/allowedFileTypes";
import { FTR_MAGIC, encodeFrame, encodeAlbumManifest, nextFileSeq, bytesToBase64, type FtrFrame, type AlbumManifest } from "../lib/fileTransfer/frames";
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
 * P2P file send: hashes the file, persists chunks + completed meta locally always
 * (so the sender's own `ftr:` message renders without waiting for a peer), then streams
 * meta/chunk/end frames over `p2pNetwork.sendAddressed()` when online. Wire delivery is
 * best-effort — errors (e.g. no connected peer) are swallowed, the locally-persisted
 * message stays "sent"; offline sends remain "queued".
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
    } else if (onUpdateChat) {
      onUpdateChat({ ...chat, history: [...(chat.history || []), newMessage] });
    }
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
      return;
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
      ts: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: online ? "sent" : "queued",
      silent: opts.silent ?? false,
    };
    appendMessage(newMessage);

    const safeSend = (frame: FtrFrame) =>
      p2pNetwork
        .sendAddressed(p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name), encodeFrame(frame))
        .catch(() => false);

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
      for await (const chunk of sliceFileChunks(file)) {
        await saveChunk(transferId, chunk.index, chunk.data);
        setProgress({ transferId, percent: Math.round(((chunk.index + 1) / totalChunks) * 100) });
      }
      await saveTransferMeta({ ...meta, receivedChunks: totalChunks, completed: true });
      if (online) {
        await safeSend({ type: "meta", seq: nextFileSeq(), ...meta });
        for await (const chunk of sliceFileChunks(file)) {
          await safeSend({ type: "chunk", seq: nextFileSeq(), transferId, index: chunk.index, data: bytesToBase64(new Uint8Array(chunk.data)) });
        }
        await safeSend({ type: "end", seq: nextFileSeq(), transferId });
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

  const sendFiles = useCallback(async (files: File[], opts: { silent?: boolean } = {}) => {
    if (!chat || !files || files.length === 0 || sendingRef.current) return;
    if (files.length === 1) {
      await sendFile(files[0], opts);
      return;
    }

    const premium = useAppStore.getState().premiumEntitlement?.premium ?? false;
    const limit = getAttachmentLimit(premium);
    const usable = files.slice(0, 10).filter((f) => {
      if (f.size > limit) {
        toast(t("premium.fileTooLarge", { limit: `${Math.round(limit / (1024 * 1024))} MB` }));
        return false;
      }
      if (!isAllowedFileType(f)) {
        toast(t("premium.fileTypeInvalid", "File type not allowed"));
        return false;
      }
      return true;
    });
    if (usable.length === 0) return;

    sendingRef.current = true;
    const profile = useAppStore.getState().userProfile;
    const senderName = profile?.name || (profile?.username ? `@${profile.username}` : "User");
    const entries = usable.map((f) => {
      const mime = f.type || "application/octet-stream";
      return { file: f, name: f.name, size: f.size, mime, transferId: crypto.randomUUID() };
    });
    const online = navigator.onLine;
    const msgId = Date.now();
    const newMessage: any = {
      id: msgId,
      sender: "me",
      text: "",
      type: "image",
      attachment: FTR_MAGIC + entries[0].transferId,
      fileName: entries[0].name,
      fileSize: entries[0].size,
      fileTransferId: entries[0].transferId,
      album: entries.map((e) => ({ url: FTR_MAGIC + e.transferId, fileName: e.name, fileSize: e.size })),
      ts: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: online ? "sent" : "queued",
      silent: opts.silent ?? false,
    };
    appendMessage(newMessage);

    const safeSend = (frame: FtrFrame) =>
      p2pNetwork
        .sendAddressed(p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name), encodeFrame(frame))
        .catch(() => false);
    const safeSendRaw = (payload: string) =>
      p2pNetwork
        .sendAddressed(p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name), payload)
        .catch(() => false);

    try {
      if (online) {
        const manifest: AlbumManifest = {
          albumId: String(msgId),
          messageId: msgId,
          chatId: chat.id,
          chatName: chat.name,
          senderName,
          timestamp: Date.now(),
          silent: opts.silent ?? false,
          entries: entries.map((e) => ({ transferId: e.transferId, name: e.name, mime: e.mime, size: e.size })),
        };
        // Manifest FIRST: the receiver marks these transferIds as album entries so
        // the per-file meta frames do not render duplicate single-file bubbles.
        await safeSendRaw(encodeAlbumManifest(manifest));
      }
      for (const e of entries) {
        const sha256 = await sha256Hex(await e.file.arrayBuffer());
        const chunkSize = chunkSizeForFileSize(e.size);
        const totalChunks = Math.max(1, Math.ceil(e.size / chunkSize));
        const meta: StoredTransfer = {
          transferId: e.transferId,
          name: e.name,
          mime: e.mime,
          size: e.size,
          chunkSize,
          totalChunks,
          sha256,
          senderPeerId: p2pNetwork.getPeerId(),
          senderName,
          receivedChunks: 0,
        };
        await saveTransferMeta(meta);
        for await (const chunk of sliceFileChunks(e.file)) {
          await saveChunk(e.transferId, chunk.index, chunk.data);
          setProgress({ transferId: e.transferId, percent: Math.round(((chunk.index + 1) / totalChunks) * 100) });
        }
        await saveTransferMeta({ ...meta, receivedChunks: totalChunks, completed: true });
        if (online) {
          await safeSend({ type: "meta", seq: nextFileSeq(), ...meta });
          for await (const chunk of sliceFileChunks(e.file)) {
            await safeSend({ type: "chunk", seq: nextFileSeq(), transferId: e.transferId, index: chunk.index, data: bytesToBase64(new Uint8Array(chunk.data)) });
          }
          await safeSend({ type: "end", seq: nextFileSeq(), transferId: e.transferId });
        }
      }
      if (online) {
        updateMessageStatus(msgId, "sent");
      }
    } catch {
      updateMessageStatus(msgId, "failed");
      toast(t("fileTransfer.sendFailed", "File transfer failed"));
    } finally {
      sendingRef.current = false;
      setProgress(null);
    }
  }, [chat, sendFile, appendMessage, updateMessageStatus, t]);

  return { sendFile, sendFiles, progress };
}
