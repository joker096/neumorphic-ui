import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { encodeMorse } from "../components/MorseDecoder";
import { parseMentions, isDNDEnabled, isPriorityContact } from "../constants";
import { TOAST_DND_DURATION_MS } from "../constants/chatConstants";
import { SELF_DESTRUCT_MS } from "../constants/time";
import { useI18n } from "../lib/i18n";
import { getPendingMessages, markMessageSent, queueMessage, retryMessage, removeQueuedMessage, pruneExpiredQueuedMessages, MAX_QUEUE_RETRIES } from "../lib/messageQueue";
import { encodeChatText, nextFrameSeq } from "../lib/p2p/chatFrame";
import { p2pNetwork } from "../lib/p2p/network";
import { persistVoiceBlob } from "../lib/voiceStore";
import { useAppStore } from "../store";

export function useMessageActions(
  activeChat: any,
  messageText: string,
  scheduledQueue: any,
  replyTarget: any,
  silentMode: boolean,
  savedMessages: any[],
  morseMode: boolean,
  scheduleDateTime: string,
  setChats: (updater: any) => void,
  setActiveChat: (updater: any) => void,
  setMessageText: (v: string) => void,
  setScheduleDateTime: (v: string) => void,
  setSilentMode: (v: boolean) => void,
  setReplyTarget: (v: any) => void,
  setDraftTextByChat: (updater: any) => void,
  setShowStickerPicker: (v: boolean) => void,
  setSavedMessages: (updater: any) => void,
) {

  const { t } = useI18n();

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
    });
    await p2pNetwork.sendAddressed(p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name), frame);
    updateMessageStatus(message.id, "sent");
  }, [updateMessageStatus]);

  const buildNewMessage = useCallback((overrides: Record<string, any> = {}) => {
    const selfDestructDefault = useAppStore.getState().selfDestructDefault;
    const ttl = selfDestructDefault ? SELF_DESTRUCT_MS[selfDestructDefault] : undefined;
    const selfDestructAt = ttl ? Date.now() + ttl : undefined;
    const msg: any = {
      id: Date.now(),
      sender: "me",
      ts: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "queued",
      silent: silentMode,
      replyTo: replyTarget ? {
        id: replyTarget.id,
        sender: replyTarget.sender,
        text: replyTarget.text,
        type: replyTarget.type,
        duration: replyTarget.duration,
      } : undefined,
    };
    if (selfDestructAt) msg.selfDestructAt = selfDestructAt;
    return { ...msg, ...overrides };
  }, [silentMode, replyTarget]);

  const appendMessage = useCallback((newMessage: any) => {
    setChats((prevChats: any[]) => prevChats.map((c: any) =>
      activeChat && c.id === activeChat.id
        ? { ...c, history: [...(c.history || []), newMessage] }
        : c
    ));
    setActiveChat((prev: any) => {
      if (!prev) return prev;
      return { ...prev, history: [...(prev.history || []), newMessage] };
    });
  }, [activeChat, setChats, setActiveChat]);

  const sendVoiceMessage = useCallback((audioUrl: string, durationStr: string, blob?: Blob) => {
    if (!activeChat) return;
    if (isDNDEnabled() && !isPriorityContact(activeChat?.name || "")) {
      toast(t("chat.dndBlockedVoice", "Voice message blocked - DND is active. Priority contacts can bypass."), { duration: TOAST_DND_DURATION_MS });
      return;
    }
    const newMessage = buildNewMessage({ text: "", type: "audio", audioUrl, duration: durationStr });
    newMessage.voiceId = String(newMessage.id);
    appendMessage(newMessage);
    void persistVoiceBlob(newMessage.voiceId, blob ?? audioUrl);
    void queueMessage({ ...newMessage, chatId: activeChat.id, chatName: activeChat.name }).catch(() => updateMessageStatus(newMessage.id, "failed"));
    setReplyTarget(null);
  }, [activeChat, buildNewMessage, appendMessage, setReplyTarget, t]);

  const sendStickerMessage = useCallback((sticker: string) => {
    if (!activeChat || !sticker) return;
    if (isDNDEnabled() && !isPriorityContact(activeChat?.name || "")) {
      toast(t("chat.dndBlockedSticker", "Sticker blocked - DND is active. Priority contacts can bypass."), { duration: TOAST_DND_DURATION_MS });
      return;
    }
    const newMessage = buildNewMessage({ text: sticker, type: "sticker" });
    appendMessage(newMessage);
    void queueMessage({ ...newMessage, chatId: activeChat.id, chatName: activeChat.name }).catch(() => updateMessageStatus(newMessage.id, "failed"));
    setReplyTarget(null);
    setShowStickerPicker(false);
  }, [activeChat, buildNewMessage, appendMessage, setReplyTarget, setShowStickerPicker, t]);

  const handleSendMessage = useCallback(() => {
    if (!messageText.trim() && !morseMode) return;

    const sentText = morseMode && messageText ? encodeMorse(messageText) : messageText.trim();
    if (!sentText) return;

    if (!activeChat) return;

    if (isDNDEnabled() && !isPriorityContact(activeChat?.name || "")) {
      toast(t("chat.dndBlockedMessage", "Message blocked - DND is active. Priority contacts can bypass."), { duration: TOAST_DND_DURATION_MS });
      return;
    }

    if (scheduleDateTime) {
      const scheduledTimeMs = new Date(scheduleDateTime).getTime();
      if (scheduledTimeMs > Date.now()) {
        scheduledQueue.addMessage({
          id: `sched_${Date.now()}`,
          chatId: activeChat.id as string | number,
          text: sentText,
          scheduledAt: scheduledTimeMs,
        });
        setMessageText("");
        setScheduleDateTime("");
        return;
      }
    }

    const { text: parsedText, mentions } = parseMentions(sentText);
    const newMessage = buildNewMessage({
      text: parsedText,
      mentions: mentions.length > 0 ? mentions : undefined,
    });

    appendMessage(newMessage);
    void queueMessage({ ...newMessage, chatId: activeChat.id, chatName: activeChat.name }).catch(() => updateMessageStatus(newMessage.id, "failed"));
    void sendTextOverP2P(newMessage, activeChat).catch(() => updateMessageStatus(newMessage.id, "queued"));
    setMessageText("");
    setSilentMode(false);
    setReplyTarget(null);
    setDraftTextByChat((prev: Record<string, string>) => ({ ...prev, [String(activeChat.id)]: "" }));

  }, [
    messageText, morseMode, activeChat, scheduleDateTime, scheduledQueue,
    buildNewMessage, appendMessage, setMessageText, setScheduleDateTime,
    setSilentMode, setReplyTarget, setDraftTextByChat, updateMessageStatus, sendTextOverP2P, t,
  ]);

  useEffect(() => {
    const attempt = async (item: any): Promise<boolean> => {
      const retries = item.retryCount || 0;
      // Exponential backoff between attempts (1s, 2s, 4s … capped at 60s).
      const backoffMs = Math.min(60_000, 1_000 * 2 ** retries);
      if (item.lastRetry && Date.now() - item.lastRetry < backoffMs) return true;
      try {
        await sendTextOverP2P(item.data, { id: item.data.chatId, name: item.data.chatName });
        await markMessageSent(item.id);
        return true;
      } catch {
        if (retries + 1 >= MAX_QUEUE_RETRIES) {
          // Exhausted the retry budget: evict from the queue and surface the
          // failure in the chat instead of flushing forever.
          await markMessageSent(item.id);
          await updateMessageStatus(item.data.id, "failed");
          await removeQueuedMessage(item.id);
          return true;
        }
        await retryMessage(item);
        return false;
      }
    };

    const flush = async () => {
      if (!navigator.onLine) return;
      const pending = await getPendingMessages().catch(() => []);
      for (const item of pending) {
        // Text and sticker messages have a text payload the chat frame can
        // carry; media (audio/image/video) has no wire representation (blob
        // URLs are local-only) and stays queued for its own sync path.
        const isTextCapable = item.data?.type === undefined || item.data?.type === "sticker";
        if (!isTextCapable) continue;
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
  }, [sendTextOverP2P, updateMessageStatus]);

  const toggleSavedMessage = useCallback((chatContext: any, msg: any) => {
    if (!chatContext || !msg) return;
    setSavedMessages((prev: any[]) => {
      const idx = prev.findIndex((item: any) => item.chatId === chatContext.id && item.messageId === msg.id);
      if (idx > -1) return prev.filter((_, i) => i !== idx);
      const preview =
        msg.type === "audio" ? `Voice note · ${msg.duration || "0:00"}`
          : msg.type === "image" ? "Photo"
            : msg.type === "video" ? "Video"
              : msg.text || "Message";
      return [...prev, {
        key: `${chatContext.id}_${msg.id}`,
        chatId: chatContext.id,
        chatName: chatContext.name,
        messageId: msg.id,
        sourceLabel: chatContext.name,
        preview: typeof preview === "string" ? preview.slice(0, 180) : "Message",
        time: msg.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }];
    });
  }, [setSavedMessages]);

  return {
    sendVoiceMessage,
    sendStickerMessage,
    handleSendMessage,
    toggleSavedMessage,
    updateMessageStatus,
  };
}
