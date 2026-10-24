import { useCallback, useState } from "react";
import { useAppStore } from "../store";
import { formatClockTime } from "../utils/chatUtils";
import { encodeMorse } from "../components/MorseDecoder";
import { queueMessage } from "../lib/messageQueue";
import { encodeChatText, nextFrameSeq } from '../lib/p2p/chatFrame';
import { encodeChatLocation, encodeChatArticle } from "../lib/p2p/chatRichFrames";
import { p2pNetwork } from "../lib/p2p/network";
import { wireSelfDestructTtl } from '../lib/selfDestruct';
import type { ChatPreviewDraft } from "./useChatPreviewDraft";

/** Optional overrides for a programmatic send (e.g. the thread panel composer). */
export interface ChatSendOverrides {
  /** Text to send; when passed the composer draft is left untouched. */
  text?: string;
  /** Quote to attach as `replyTo` instead of the composer's reply target. */
  replyTarget?: any;
}
import { applySelfDestruct } from './chatPreviewSends/outgoingMessage';
import { createAttachmentHandlers } from './chatPreviewSends/attachments';
import { useReactionToggle } from './chatPreviewSends/useReactionToggle';
import { usePollVote } from './chatPreviewSends/usePollVote';
import { sendPollMessage } from './chatPreviewSends/sendPoll';
import { vibrate } from '../lib/haptics';

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
 * Every outgoing path of the chat preview: text/morse, geo, article, file
 * attach and drop, video notes, the failed-message retry and reactions.
 */
export function useChatPreviewSends({ chat, onUpdateChat, draft, queueOffline, setChatsStore, setChannels, sendFile, sendFiles }: UseChatPreviewSendsArgs) {
  const { activeReactionPicker, setActiveReactionPicker, handleReactionMessage } = useReactionToggle({
    chat,
    onUpdateChat,
    setChatsStore,
  });
  const { handlePollVote } = usePollVote({ chat, onUpdateChat, setChatsStore });
  const sendPoll = (question: string, optionTexts: string[], multiple: boolean) =>
    sendPollMessage(
      { chat, onUpdateChat, queueOffline, updateMsgStatusInChat, markSendFailure, silent: draft.eSilentMode },
      question,
      optionTexts,
      multiple,
    );
  const { sendVideoNote, handleImageAttach, handleFileDrop } = createAttachmentHandlers({ sendFile, sendFiles });

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

  const sendMessage = (attachment?: { url: string; type: 'image' | 'video' } | Array<{ url: string; type: 'image' | 'video' }>, overrides?: ChatSendOverrides) => {
    const override = overrides != null;
    const replyTarget = override ? overrides?.replyTarget : draft.eReplyTarget;
    const overrideText = typeof overrides?.text === "string" ? overrides.text : "";
    // Programmatic sends (thread panel) pass literal text; the composer path encodes morse.
    let textToSend: string;
    if (override) {
      textToSend = overrideText.trim();
    } else if (draft.eMorseMode) {
      textToSend = encodeMorse(draft.eMsgText);
    } else {
      textToSend = draft.eMsgText.trim();
    }
    const attachments = Array.isArray(attachment) ? attachment : attachment ? [attachment] : [];
    const hasAttachment = attachments.length > 0;
    if (!textToSend && !hasAttachment) return;
    if (textToSend && textToSend.length > 20000) return;
    // Short haptic confirmation on send (Telegram-parity).
    vibrate(14);
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
      newMessage.type = (!override && draft.eMorseMode) ? "morse" : undefined;
      newMessage.replyTo = replyTarget ? {
        id: replyTarget.id,
        sender: replyTarget.sender,
        text: replyTarget.text,
        type: replyTarget.type,
        duration: replyTarget.duration
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
        replyTo: newMessage.replyTo ? {
          id: String(newMessage.replyTo.id),
          sender: String(newMessage.replyTo.sender ?? ""),
          text: newMessage.replyTo.text != null ? String(newMessage.replyTo.text) : undefined,
          type: newMessage.replyTo.type,
          duration: newMessage.replyTo.duration,
        } : undefined,
      })).then(() => updateMsgStatusInChat(updatedChat, newMessage.id, "sent")).catch(() => markSendFailure(updatedChat, newMessage.id));
    }
    // A programmatic send (thread panel) must not clobber the composer draft.
    if (!override) {
      draft.setMsgTextFn("");
      draft.setReplyTargetFn2(null);
      draft.setMorseModeFn2(false);
      draft.resetSilentDraft();
    }
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

  return {
    sendMessage,
    sendGeoMessage,
    sendArticleMessage,
    sendVideoNote,
    handleImageAttach,
    handleFileDrop,
    retryFailedMessage,
    handleReactionMessage,
    handlePollVote,
    sendPoll,
    activeReactionPicker,
    setActiveReactionPicker,
  };
}
