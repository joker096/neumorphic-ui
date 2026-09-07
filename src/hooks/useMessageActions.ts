import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { encodeMorse } from "../components/MorseDecoder";
import { parseMentions, isDNDEnabled, isPriorityContact } from "../constants";
import { TOAST_DND_DURATION_MS } from "../constants/chatConstants";
import { useI18n } from "../lib/i18n";
import { queueMessage, getPendingMessages, markMessageSent } from "../lib/messageQueue";

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

  const buildNewMessage = useCallback((overrides: Record<string, any> = {}) => ({
    id: Date.now(),
    sender: "me",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: navigator.onLine ? "sent" : "queued",
    silent: silentMode,
    replyTo: replyTarget ? {
      id: replyTarget.id,
      sender: replyTarget.sender,
      text: replyTarget.text,
      type: replyTarget.type,
      duration: replyTarget.duration,
    } : undefined,
    ...overrides,
  }), [silentMode, replyTarget]);

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

  const sendVoiceMessage = useCallback((audioUrl: string, durationStr: string) => {
    if (!activeChat) return;
    if (isDNDEnabled() && !isPriorityContact(activeChat?.name || "")) {
      toast(t("chat.dndBlockedVoice", "Voice message blocked - DND is active. Priority contacts can bypass."), { duration: TOAST_DND_DURATION_MS });
      return;
    }
    const newMessage = buildNewMessage({ text: "", type: "audio", audioUrl, duration: durationStr });
    appendMessage(newMessage);
    void queueMessage({ ...newMessage, chatId: activeChat.id }).catch(() => {});
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
    void queueMessage({ ...newMessage, chatId: activeChat.id }).catch(() => {});
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
    void queueMessage({ ...newMessage, chatId: activeChat.id }).catch(() => {});
    setMessageText("");
    setSilentMode(false);
    setReplyTarget(null);
    setDraftTextByChat((prev: Record<string, string>) => ({ ...prev, [String(activeChat.id)]: "" }));

    if (navigator.onLine) {
      setTimeout(() => updateMessageStatus(newMessage.id, "delivered"), 1000);
    }
  }, [
    messageText, morseMode, activeChat, scheduleDateTime, scheduledQueue,
    buildNewMessage, appendMessage, setMessageText, setScheduleDateTime,
    setSilentMode, setReplyTarget, setDraftTextByChat, updateMessageStatus, t,
  ]);

  // Offline-first: flush queued messages to "sent" when the network is back.
  useEffect(() => {
    const flush = async () => {
      if (!navigator.onLine) return;
      try {
        const pending = await getPendingMessages();
        for (const item of pending) await markMessageSent(item.id);
        if (pending.length > 0) {
          setChats((prevChats: any[]) => prevChats.map((c: any) =>
            c.history?.some((m: any) => m.status === "queued")
              ? { ...c, history: c.history.map((m: any) => (m.status === "queued" ? { ...m, status: "sent" } : m)) }
              : c
          ));
          setActiveChat((prev: any) => {
            if (!prev || !prev.history?.some((m: any) => m.status === "queued")) return prev;
            return { ...prev, history: prev.history.map((m: any) => (m.status === "queued" ? { ...m, status: "sent" } : m)) };
          });
        }
      } catch {
        /* queue is best-effort */
      }
    };
    void flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [setChats, setActiveChat]);

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
