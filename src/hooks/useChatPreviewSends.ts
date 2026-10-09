import { useCallback, useState } from "react";
import { useAppStore } from "../store";
import { formatClockTime } from "../utils/chatUtils";
import { encodeMorse } from "../components/MorseDecoder";
import { queueMessage } from "../lib/messageQueue";
import { encodeChatReaction, encodeChatText, nextFrameSeq } from "../lib/p2p/chatFrame";
import { encodeChatLocation, encodeChatArticle } from "../lib/p2p/chatRichFrames";
import { p2pNetwork } from "../lib/p2p/network";
import { applyDefaultSelfDestruct, wireSelfDestructTtl, resolveSelfDestructTimer } from "../lib/selfDestruct";
import type { ChatPreviewDraft } from "./useChatPreviewDraft";

interface UseChatPreviewSendsArgs {
  chat: any;
  onUpdateChat?: (chat: any) => void;
  draft: ChatPreviewDraft;
  queueOffline: (message: any, onFail: () => void) => void;
  setChatsStore: (updater: any[] | ((prev: any[]) => any[])) => void;
  setChannels: (updater: any[] | ((prev: any[]) => any[])) => void;
  sendFile: (file: File, opts?: { silent?: boolean; videoNote?: boolean }) => Promise<unknown>;
  sendFiles: (files: File[], opts?: { silent?: boolean }) => Promise<unknown>;
}

/**
 * Stamp the self-destruct timer onto an outgoing message. Every send path
 * uses it, so the timer covers text, geo, article and attachments alike
 * instead of text only. A per-chat override wins over the global default.
 */
function applySelfDestruct(msg: any, chatId?: string | number): void {
  const s = useAppStore.getState();
  applyDefaultSelfDestruct(
    msg,
    resolveSelfDestructTimer(chatId, s.selfDestructDefault, s.chatSelfDestruct, s.premiumEntitlement?.premium ?? false),
  );
}

/**
 * Every outgoing path of the chat preview: text/morse, geo, article, file
 * attach and drop, video notes, the failed-message retry and reactions.
 */
export function useChatPreviewSends({ chat, onUpdateChat, draft, queueOffline, setChatsStore, setChannels, sendFile, sendFiles }: UseChatPreviewSendsArgs) {
  const [activeReactionPicker, setActiveReactionPicker] = useState<number | string | null>(null);

  const updateMsgStatusInChat = useCallback((chatArg: any, msgId: string | number, status: string) => {
    const updatedChat = {
      ...chatArg,
      history: (chatArg.history || []).map((m: any) => (m.id === msgId ? { ...m, status } : m)),
    };
    if (onUpdateChat) onUpdateChat(updatedChat);
    setChatsStore((prev: any[]) => prev.map((c: any) => (c.id === chatArg.id ? updatedChat : c)));
    if (chatArg.isChannel) {
      setChannels((prev: any[]) => prev.map((c: any) => (c.id === chatArg.id ? updatedChat : c)));
    }
  }, [onUpdateChat, setChatsStore, setChannels]);

  /**
   * Honest failure for a wire send that threw. When the offline queue is on the
   * message is already persisted for the shared flush loop, so it stays
   * `queued`; otherwise there is no retry path and the bubble is `failed`.
   */
  const markSendFailure = useCallback((chatArg: any, msgId: string | number) => {
    updateMsgStatusInChat(chatArg, msgId, useAppStore.getState().offlineMode ? "queued" : "failed");
  }, [updateMsgStatusInChat]);

  const sendMessage = (attachment?: { url: string; type: 'image' | 'video' } | Array<{ url: string; type: 'image' | 'video' }>) => {
    const textToSend = draft.eMorseMode ? encodeMorse(draft.eMsgText) : draft.eMsgText.trim();
    const attachments = Array.isArray(attachment) ? attachment : attachment ? [attachment] : [];
    const hasAttachment = attachments.length > 0;
    if (!textToSend && !hasAttachment) return;
    if (textToSend && textToSend.length > 20000) return;
    const newMessage: any = {
      id: Date.now(),
      sender: "me",
      text: textToSend,
      ts: Date.now(),
      time: formatClockTime(Date.now()),
      status: navigator.onLine ? "sent" : "queued",
      silent: draft.eSilentMode,
    };
    applySelfDestruct(newMessage, chat?.id);
    if (hasAttachment) {
      newMessage.type = attachments[0]!.type;
      newMessage.attachment = attachments[0]!.url;
      if (attachments.length > 1) {
        newMessage.album = attachments.map((a) => ({ url: a.url, type: a.type }));
      }
    } else {
      newMessage.type = draft.eMorseMode ? "morse" : undefined;
      newMessage.replyTo = draft.eReplyTarget ? {
        id: draft.eReplyTarget.id,
        sender: draft.eReplyTarget.sender,
        text: draft.eReplyTarget.text,
        type: draft.eReplyTarget.type,
        duration: draft.eReplyTarget.duration
      } : undefined;
    }
    queueOffline({ ...newMessage, chatId: chat.id, chatName: chat.name }, () =>
      updateMsgStatusInChat(chat, newMessage.id, "failed"),
    );
    const updatedChat = {
      ...chat,
      history: [...(chat.history || []), newMessage],
      ...(chat.isChannel
        ? { postCount: (chat.postCount ?? chat.history?.length ?? 0) + 1 }
        : {}),
    };
    if (onUpdateChat) onUpdateChat(updatedChat);
    if (chat.isChannel) {
      setChannels((prev: any[]) =>
        prev.map((c: any) =>
          c.id === chat.id
            ? { ...c, history: updatedChat.history, postCount: updatedChat.postCount }
            : c
        )
      );
    }
    if (!newMessage.type) {
      const sender = useAppStore.getState().userProfile;
      void p2pNetwork.sendAddressed(p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name), encodeChatText({
        type: "chat-text",
        seq: nextFrameSeq(),
        messageId: String(newMessage.id),
        chatId: String(chat.id),
        chatName: String(chat.name || ""),
        senderName: sender?.name || sender?.username || "User",
        text: String(newMessage.text || ""),
        silent: !!newMessage.silent,
        timestamp: Number(newMessage.id) || Date.now(),
        ttlMs: wireSelfDestructTtl(newMessage.selfDestructAt),
      })).then(() => updateMsgStatusInChat(updatedChat, newMessage.id, "sent")).catch(() => markSendFailure(updatedChat, newMessage.id));
    }
    draft.setMsgTextFn("");
    draft.setReplyTargetFn2(null);
    draft.setMorseModeFn2(false);
    draft.resetSilentDraft();
  };

  const sendGeoMessage = (lat: number, lng: number) => {
    if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const newMessage: any = {
      id: Date.now(),
      sender: "me",
      type: "location",
      lat,
      lng,
      text: "",
      ts: Date.now(),
      time: formatClockTime(Date.now()),
      status: navigator.onLine ? "sent" : "queued",
      silent: draft.eSilentMode,
    };
    applySelfDestruct(newMessage, chat?.id);
    queueOffline({ ...newMessage, chatId: chat.id, chatName: chat.name }, () =>
      updateMsgStatusInChat(chat, newMessage.id, "failed"),
    );
    const updatedChat = {
      ...chat,
      history: [...(chat.history || []), newMessage],
    };
    if (onUpdateChat) onUpdateChat(updatedChat);
    const sender = useAppStore.getState().userProfile;
    void p2pNetwork.sendAddressed(p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name), encodeChatLocation({
      type: "chat-location",
      seq: nextFrameSeq(),
      messageId: String(newMessage.id),
      chatId: String(chat.id),
      chatName: String(chat.name || ""),
      senderName: sender?.name || sender?.username || "User",
      lat,
      lng,
      silent: !!newMessage.silent,
      timestamp: Number(newMessage.id) || Date.now(),
      ttlMs: wireSelfDestructTtl(newMessage.selfDestructAt),
    })).then(() => updateMsgStatusInChat(updatedChat, newMessage.id, "sent")).catch(() => markSendFailure(updatedChat, newMessage.id));
  };

  const sendArticleMessage = (url: string, title?: string) => {
    const trimmed = String(url || "").trim();
    if (!/^https?:\/\//i.test(trimmed)) return;
    const newMessage: any = {
      id: Date.now(),
      sender: "me",
      type: "article",
      url: trimmed,
      title: typeof title === "string" ? title.trim() : "",
      text: "",
      ts: Date.now(),
      time: formatClockTime(Date.now()),
      status: navigator.onLine ? "sent" : "queued",
      silent: draft.eSilentMode,
    };
    applySelfDestruct(newMessage, chat?.id);
    queueOffline({ ...newMessage, chatId: chat.id, chatName: chat.name }, () =>
      updateMsgStatusInChat(chat, newMessage.id, "failed"),
    );
    const updatedChat = {
      ...chat,
      history: [...(chat.history || []), newMessage],
    };
    if (onUpdateChat) onUpdateChat(updatedChat);
    const sender = useAppStore.getState().userProfile;
    void p2pNetwork.sendAddressed(p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name), encodeChatArticle({
      type: "chat-article",
      seq: nextFrameSeq(),
      messageId: String(newMessage.id),
      chatId: String(chat.id),
      chatName: String(chat.name || ""),
      senderName: sender?.name || sender?.username || "User",
      url: trimmed,
      title: newMessage.title || undefined,
      silent: !!newMessage.silent,
      timestamp: Number(newMessage.id) || Date.now(),
      ttlMs: wireSelfDestructTtl(newMessage.selfDestructAt),
    })).then(() => updateMsgStatusInChat(updatedChat, newMessage.id, "sent")).catch(() => markSendFailure(updatedChat, newMessage.id));
  };

  const attachFiles = (files: File[], _chatData: any, _onUpdChat: ((c: any) => void) | undefined, silent: boolean) => {
    if (files.length === 1) {
      void sendFile(files[0], { silent });
    } else if (files.length > 1) {
      void sendFiles(files, { silent });
    }
  };

  const sendVideoNote = (file: File) => {
    void sendFile(file, { silent: false, videoNote: true });
  };

  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>, chatData: any, onUpdChat: ((c: any) => void) | undefined, silent: boolean) => {
    const files = e.target.files ? [...e.target.files] : [];
    if (files.length === 0) return;
    attachFiles(files, chatData, onUpdChat, silent);
  };

  const handleFileDrop = (files: FileList | null | undefined, chatData: any, onUpdChat: ((c: any) => void) | undefined) => {
    const arr = files ? [...files] : [];
    if (arr.length === 0) return;
    attachFiles(arr, chatData, onUpdChat, false);
  };

  const retryFailedMessage = useCallback((msg: any) => {
    if (!chat || !msg) return;
    const deliver = () => {
      void queueMessage({ ...msg, chatId: chat.id })
        .then(() => {
          if (navigator.onLine) {
            updateMsgStatusInChat(chat, msg.id, "sent");
            // 'delivered' is simulated locally only for non-wire chats (mock /
            // uuid peers). For a real P2P peer the wire chat-ack (handled by
            // useP2PMessages) drives the transition — no guessing here.
            const isWirePeer = p2pNetwork.peerForChat(String(chat.id)) !== undefined
              || /^[0-9a-f]{64}$/.test(String(chat.id));
            if (!isWirePeer) setTimeout(() => updateMsgStatusInChat(chat, msg.id, "delivered"), 1000);
          }
        })
        .catch(() => updateMsgStatusInChat(chat, msg.id, "failed"));
    };
    updateMsgStatusInChat(chat, msg.id, "queued");
    // settings.offlineMode: retrying into a disabled queue would leave the
    // bubble spinning forever, so report the failure straight away.
    if (!useAppStore.getState().offlineMode) {
      updateMsgStatusInChat(chat, msg.id, "failed");
      return;
    }
    deliver();
  }, [chat, updateMsgStatusInChat]);

  /**
   * Toggle the local user's reaction: a second tap on the same emoji removes it.
   * The sender's own reactions are tracked under `myReactions` (never asserted
   * over the wire) so the highlight survives re-renders, and the count delta
   * travels as a `chat-reaction` frame. Own messages are reactable too, matching
   * the double-tap gesture which fires regardless of direction.
   */
  const handleReactionMessage = (msgId: string | number, emoji: string) => {
    let op: "add" | "remove" = "add";
    const updatedChat = {
      ...chat,
      history: (chat.history || []).map((m: any) => {
        if (m.id !== msgId) return m;
        const reactions = { ...(m.reactions || {}) };
        const mine = { ...(m.myReactions || {}) };
        if (mine[emoji]) {
          op = "remove";
          delete mine[emoji];
          const next = (reactions[emoji] || 0) - 1;
          if (next > 0) reactions[emoji] = next;
          else delete reactions[emoji];
        } else {
          op = "add";
          mine[emoji] = true;
          reactions[emoji] = (reactions[emoji] || 0) + 1;
        }
        return { ...m, reactions, myReactions: mine };
      })
    };
    if (onUpdateChat) onUpdateChat(updatedChat);
    setChatsStore(prev => prev.map(c => c.id === chat.id ? updatedChat : c));
    setActiveReactionPicker(null);

    const sender = useAppStore.getState().userProfile;
    void p2pNetwork.sendAddressed(
      p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name),
      encodeChatReaction({
        type: "chat-reaction",
        seq: nextFrameSeq(),
        messageId: String(msgId),
        chatId: String(chat.id),
        chatName: String(chat.name || ""),
        senderName: sender?.name || sender?.username || "User",
        emoji,
        op,
        timestamp: Date.now(),
      }),
    ).catch(() => {});
  };

  return {
    sendMessage,
    sendGeoMessage,
    sendArticleMessage,
    sendVideoNote,
    handleImageAttach,
    handleFileDrop,
    retryFailedMessage,
    handleReactionMessage,
    activeReactionPicker,
    setActiveReactionPicker,
  };
}