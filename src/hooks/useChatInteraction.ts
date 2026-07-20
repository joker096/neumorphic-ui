import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { encodeMorse } from '../components/MorseDecoder';
import { isDNDEnabled, isPriorityContact, parseMentions } from '../constants';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '../constants/storage';

export function useChatInteraction() {
  const scheduledQueue = useAppStore(s => s.scheduledQueue);
  const setChats = useAppStore(s => s.setChats);

  const [messageText, setMessageText] = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceNoteError, setVoiceNoteError] = useState("");
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [morseMode, setMorseMode] = useState(false);
  const [silentMode, setSilentMode] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [showAdvancedFilterModal, setShowAdvancedFilterModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({ hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false });
  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [draftTextByChat, setDraftTextByChat] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DRAFTS);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  const [savedMessages, setSavedMessages] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SAVED_MESSAGES);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [showSchedulePopupState, setShowSchedulePopupState] = useState(false);
  const [activeStory, setActiveStory] = useState<{ id: number, name: string, color: string } | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(draftTextByChat));
  }, [draftTextByChat]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SAVED_MESSAGES, JSON.stringify(savedMessages));
  }, [savedMessages]);

  const sendVoiceMessage = useCallback((audioUrl: string, durationStr: string, activeChat: any, replyTarget: any, silentMode: boolean) => {
    if (isDNDEnabled() && !isPriorityContact(activeChat?.name || "")) {
      toast("Voice message blocked - DND is active. Priority contacts can bypass.", { duration: 3000 });
      return;
    }

    const newMessage = {
      id: Date.now(),
      sender: "me",
      text: "",
      type: "audio",
      audioUrl,
      duration: durationStr,
      replyTo: replyTarget ? {
        id: replyTarget.id, sender: replyTarget.sender, text: replyTarget.text,
        type: replyTarget.type, duration: replyTarget.duration
      } : undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "sent",
      silent: silentMode
    };

    setChats(prevChats => prevChats.map(c => {
      if (activeChat && c.id === activeChat.id) {
        return { ...c, history: [...(c.history || []), newMessage] };
      }
      return c;
    }));

    setReplyTarget(null);
  }, [setChats]);

  const sendStickerMessage = useCallback((sticker: string, activeChat: any, replyTarget: any, silentMode: boolean) => {
    if (!activeChat || !sticker) return;
    if (isDNDEnabled() && !isPriorityContact(activeChat?.name || "")) {
      toast("Sticker blocked - DND is active. Priority contacts can bypass.", { duration: 3000 });
      return;
    }

    const newMessage = {
      id: Date.now(), sender: "me", text: sticker, type: "sticker",
      replyTo: replyTarget ? {
        id: replyTarget.id, sender: replyTarget.sender, text: replyTarget.text,
        type: replyTarget.type, duration: replyTarget.duration
      } : undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "sent", silent: silentMode
    };

    setChats(prevChats => prevChats.map(c => {
      if (activeChat.id === c.id) {
        return { ...c, history: [...(c.history || []), newMessage] };
      }
      return c;
    }));

    setReplyTarget(null);
    setShowStickerPicker(false);
  }, [setChats]);

  const handleSendMessage = useCallback((activeChat: any, replyTarget: any, messageText: string, morseMode: boolean, scheduleDateTime: string, silentMode: boolean, setChats: any, setActiveChat: any) => {
    if (!messageText.trim() && !morseMode) return;

    const sentText = morseMode && messageText ? encodeMorse(messageText) : messageText.trim();
    if (!sentText) return;

    if (isDNDEnabled() && !isPriorityContact(activeChat?.name || "")) {
      toast("Message blocked - DND is active. Priority contacts can bypass.", { duration: 3000 });
      return;
    }

    if (scheduleDateTime) {
      const scheduledTimeMs = new Date(scheduleDateTime).getTime();
      if (scheduledTimeMs > Date.now()) {
        scheduledQueue.addMessage({
          id: `sched_${Date.now()}`,
          chatId: activeChat?.id as string | number,
          text: sentText,
          scheduledAt: scheduledTimeMs
        });
        setMessageText("");
        setScheduleDateTime("");
        return;
      }
    }

    const { text: parsedText, mentions } = parseMentions(sentText);

    const newMessage = {
      id: Date.now(), sender: "me", text: parsedText,
      mentions: mentions.length > 0 ? mentions : undefined,
      replyTo: replyTarget ? {
        id: replyTarget.id, sender: replyTarget.sender, text: replyTarget.text,
        type: replyTarget.type, duration: replyTarget.duration
      } : undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "sent", silent: silentMode
    };

    setChats(prevChats => prevChats.map(c => {
      if (activeChat && c.id === activeChat.id) {
        return { ...c, history: [...(c.history || []), newMessage] };
      }
      return c;
    }));

    setActiveChat((prev: any) => {
      if (!prev) return prev;
      return { ...prev, history: [...(prev.history || []), newMessage] };
    });

    setMessageText("");
    setSilentMode(false);
    setReplyTarget(null);
    if (activeChat) {
      setDraftTextByChat(prev => ({ ...prev, [String(activeChat.id)]: "" }));
    }

    const msgId = newMessage.id;
    setTimeout(() => {
      setChats(prevChats => prevChats.map(c => {
        if (!c.history) return c;
        return { ...c, history: c.history.map((m: any) => m.id === msgId ? { ...m, status: "delivered" } : m) };
      }));
    }, 1000);
  }, [scheduledQueue]);

  const toggleSavedMessage = useCallback((chatContext: any, msg: any) => {
    if (!chatContext || !msg) return;
    setSavedMessages(prev => {
      const existingIndex = prev.findIndex(item => item.chatId === chatContext.id && item.messageId === msg.id);
      if (existingIndex > -1) {
        return prev.filter((_, index) => index !== existingIndex);
      }
      const preview = msg.type === "audio" ? `Voice note · ${msg.duration || "0:00"}`
        : msg.type === "image" ? "Photo"
        : msg.type === "video" ? "Video"
        : msg.text || "Message";
      return [...prev, {
        key: `${chatContext.id}_${msg.id}`, chatId: chatContext.id, chatName: chatContext.name,
        messageId: msg.id, sourceLabel: chatContext.name,
        preview: typeof preview === "string" ? preview.slice(0, 180) : "Message",
        time: msg.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }];
    });
  }, []);

  return {
    messageText, setMessageText,
    isRecordingVoice, setIsRecordingVoice,
    voiceNoteError, setVoiceNoteError,
    showSchedulePopup, setShowSchedulePopup,
    scheduleDateTime, setScheduleDateTime,
    morseMode, setMorseMode,
    silentMode, setSilentMode,
    showStickerPicker, setShowStickerPicker,
    chatSearchQuery, setChatSearchQuery,
    showAdvancedFilterModal, setShowAdvancedFilterModal,
    advancedFilters, setAdvancedFilters,
    replyTarget, setReplyTarget,
    draftTextByChat, setDraftTextByChat,
    savedMessages, setSavedMessages,
    activeStory, setActiveStory,

    sendVoiceMessage,
    sendStickerMessage,
    handleSendMessage,
    toggleSavedMessage,
  };
}
