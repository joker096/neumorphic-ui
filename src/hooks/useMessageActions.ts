import { useCallback } from "react";
import { toast } from "sonner";
import { encodeMorse } from "../components/MorseDecoder";
import { parseMentions, isDNDEnabled, isPriorityContact } from "../constants";
import { TOAST_DND_DURATION_MS } from "../constants/chatConstants";
import { useI18n } from "../lib/i18n";
import { useOfflineQueue } from "./useOfflineQueue";
import { applyDefaultSelfDestruct, resolveSelfDestructTimer } from "../lib/selfDestruct";
import { persistVoiceBlob } from "../lib/voiceStore";
import { formatClockTime } from "../utils/chatUtils";
import { useAppStore } from "../store";
import { useMessageWire } from "./useMessageWire";

export { executeEditMessage } from "../lib/chatEdit";

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
  const queueOffline = useOfflineQueue();
  const { updateMessageStatus, sendTextOverP2P, sendVoiceOverP2P, editMessage } = useMessageWire({ activeChat, setChats, setActiveChat });

  const buildNewMessage = useCallback((overrides: Record<string, any> = {}) => {
    const msg: any = {
      id: Date.now(),
      sender: "me",
      ts: Date.now(),
      time: formatClockTime(Date.now()),
      status: navigator.onLine ? "sent" : "queued",
      silent: silentMode,
      replyTo: replyTarget ? {
        id: replyTarget.id,
        sender: replyTarget.sender,
        text: replyTarget.text,
        type: replyTarget.type,
        duration: replyTarget.duration,
      } : undefined,
    };
    // Per-chat override wins over the global default; see resolveSelfDestructTimer.
    const store = useAppStore.getState();
    applyDefaultSelfDestruct(
      msg,
      resolveSelfDestructTimer(activeChat?.id, store.selfDestructDefault, store.chatSelfDestruct, store.premiumEntitlement?.premium ?? false),
    );
    return { ...msg, ...overrides };
  }, [silentMode, replyTarget, activeChat]);

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
    setReplyTarget(null);

    void (async () => {
      try {
        await persistVoiceBlob(newMessage.voiceId, blob ?? audioUrl);
      } catch {
        updateMessageStatus(newMessage.id, "failed");
        return;
      }

      queueOffline({ ...newMessage, chatId: activeChat.id, chatName: activeChat.name },
        () => updateMessageStatus(newMessage.id, "failed"));

      if (navigator.onLine) {
        await sendVoiceOverP2P(newMessage, activeChat)
          .catch(() => updateMessageStatus(newMessage.id, "failed"));
      }
    })();
  }, [activeChat, buildNewMessage, appendMessage, setReplyTarget, t, updateMessageStatus, sendVoiceOverP2P, queueOffline]);

  const sendStickerMessage = useCallback((sticker: string) => {
    if (!activeChat || !sticker) return;
    if (isDNDEnabled() && !isPriorityContact(activeChat?.name || "")) {
      toast(t("chat.dndBlockedSticker", "Sticker blocked - DND is active. Priority contacts can bypass."), { duration: TOAST_DND_DURATION_MS });
      return;
    }
    const newMessage = buildNewMessage({ text: sticker, type: "sticker" });
    appendMessage(newMessage);
    queueOffline({ ...newMessage, chatId: activeChat.id, chatName: activeChat.name },
      () => updateMessageStatus(newMessage.id, "failed"));
    setReplyTarget(null);
    setShowStickerPicker(false);
  }, [activeChat, buildNewMessage, appendMessage, setReplyTarget, setShowStickerPicker, t, queueOffline]);

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
    queueOffline({ ...newMessage, chatId: activeChat.id, chatName: activeChat.name },
      () => updateMessageStatus(newMessage.id, "failed"));
    void sendTextOverP2P(newMessage, activeChat).catch(() =>
      updateMessageStatus(newMessage.id, useAppStore.getState().offlineMode ? "queued" : "failed"),
    );
    setMessageText("");
    setSilentMode(false);
    setReplyTarget(null);
    setDraftTextByChat((prev: Record<string, string>) => ({ ...prev, [String(activeChat.id)]: "" }));

  }, [
    messageText, morseMode, activeChat, scheduleDateTime, scheduledQueue,
    buildNewMessage, appendMessage, setMessageText, setScheduleDateTime,
    setSilentMode, setReplyTarget, setDraftTextByChat, updateMessageStatus, sendTextOverP2P, t,
    queueOffline,
  ]);

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
        time: msg.time || formatClockTime(Date.now()),
      }];
    });
  }, [setSavedMessages]);

  return {
    sendVoiceMessage,
    sendStickerMessage,
    handleSendMessage,
    toggleSavedMessage,
    updateMessageStatus,
    editMessage,
  };
}
