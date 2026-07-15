import { useState, useCallback, useRef } from 'react';

/**
 * Chat message handling hook for the active chat workspace
 */
export function useChatMessages(
  activeChat: any,
  setActiveChat: (chat: any) => void
) {
  const [messageText, setMessageText] = useState('');
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceNoteError, setVoiceNoteError] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [morseMode, setMorseMode] = useState(false);
  const [silentMode, setSilentMode] = useState(false);
  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [draftTextByChat, setDraftTextByChat] = useState<Record<string, string>>({});

  const handleSendMessage = useCallback(() => {
    if (!messageText.trim() || !activeChat) return;

    const newMessage = {
      id: Date.now(),
      sender: 'me' as const,
      text: messageText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent' as const,
    };

    setActiveChat((prev: any) => {
      if (!prev) return null;
      return {
        ...prev,
        history: [...(prev.history || []), newMessage],
        message: messageText,
      };
    });

    setMessageText('');
    setReplyTarget(null);
    setMorseMode(false);
    setSilentMode(false);
  }, [messageText, activeChat, setActiveChat]);

  const sendVoiceMessage = useCallback((url: string, duration: string) => {
    if (!activeChat) return;

    const voiceMessage = {
      id: Date.now(),
      sender: 'me' as const,
      type: 'audio' as const,
      audioUrl: url,
      duration,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent' as const,
    };

    setActiveChat((prev: any) => {
      if (!prev) return null;
      return {
        ...prev,
        history: [...(prev.history || []), voiceMessage],
      };
    });
  }, [activeChat, setActiveChat]);

  const sendStickerMessage = useCallback((sticker: string) => {
    if (!activeChat) return;

    const stickerMessage = {
      id: Date.now(),
      sender: 'me' as const,
      type: 'sticker' as const,
      text: sticker,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent' as const,
    };

    setActiveChat((prev: any) => {
      if (!prev) return null;
      return {
        ...prev,
        history: [...(prev.history || []), stickerMessage],
      };
    });
  }, [activeChat, setActiveChat]);

  const savedMessages = useRef<any[]>([]);

  const toggleSavedMessage = useCallback((chatContext: any, message: any) => {
    const { current: saved } = savedMessages;
    const exists = saved.some((s: any) => s.messageId === message.id);

    if (exists) {
      saved.splice(saved.findIndex((s: any) => s.messageId === message.id), 1);
    } else {
      saved.push({
        id: Date.now(),
        messageId: message.id,
        chatId: chatContext?.id,
        text: message.text,
        type: message.type,
        savedAt: Date.now(),
      });
    }
  }, []);

  return {
    messageText,
    setMessageText,
    scheduleDateTime,
    setScheduleDateTime,
    showSchedulePopup,
    setShowSchedulePopup,
    isRecordingVoice,
    setIsRecordingVoice,
    voiceNoteError,
    setVoiceNoteError,
    showStickerPicker,
    setShowStickerPicker,
    morseMode,
    setMorseMode,
    silentMode,
    setSilentMode,
    replyTarget,
    setReplyTarget,
    draftTextByChat,
    setDraftTextByChat,
    handleSendMessage,
    sendVoiceMessage,
    sendStickerMessage,
    savedMessages: savedMessages.current,
    toggleSavedMessage,
  };
}
