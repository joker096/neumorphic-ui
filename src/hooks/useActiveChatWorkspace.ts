import { useMemo } from "react";
import type { Contact } from "../types/contact";

export interface ActiveChatWorkspaceArgs {
  theme: "light" | "dark";
  activeChat: any;
  setActiveChat: (chat: any) => void;
  messageText: string;
  setMessageText: (text: string) => void;
  scheduleDateTime: string;
  showSchedulePopup: boolean;
  setShowSchedulePopup: (show: boolean) => void;
  setScheduleDateTime: (value: string) => void;
  isRecordingVoice: boolean;
  setIsRecordingVoice: (rec: boolean) => void;
  voiceNoteError: string;
  showStickerPicker: boolean;
  setShowStickerPicker: (show: boolean) => void;
  morseMode: boolean;
  silentMode: boolean;
  replyTarget: any;
  setReplyTarget: (target: any) => void;
  draftTextByChat: Record<string, string>;
  setDraftTextByChat: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setChats: (updater: any[] | ((prev: any[]) => any[])) => void;
  setChannels: (updater: any[] | ((prev: any[]) => any[])) => void;
  setVoiceNoteError: (err: string) => void;
  setSilentMode: (mode: boolean) => void;
  setMorseMode: (mode: boolean) => void;
  savedMessages: any[];
  toggleSavedMessage?: (chat: any, message: any) => void;
  handleSendMessage: () => void;
  sendVoiceMessage: (url: string, duration: string) => void;
  sendStickerMessage: (sticker: string) => void;
  handlePreviewCall: (name: string, color?: string, type?: string) => void;
  handlePreviewMessage: (name: string, color?: string) => void;
  setEditingContact: (contact: Contact | null) => void;
}

export function useActiveChatWorkspace(args: ActiveChatWorkspaceArgs) {
  const {
    theme, activeChat, setActiveChat, messageText, setMessageText,
    scheduleDateTime, showSchedulePopup, setShowSchedulePopup, setScheduleDateTime,
    isRecordingVoice, setIsRecordingVoice, voiceNoteError, showStickerPicker,
    setShowStickerPicker, morseMode, silentMode, replyTarget, setReplyTarget,
    draftTextByChat, setDraftTextByChat, setChats, setChannels, setVoiceNoteError,
    setSilentMode, setMorseMode, savedMessages, toggleSavedMessage,
    handleSendMessage, sendVoiceMessage, sendStickerMessage,
    handlePreviewCall, handlePreviewMessage, setEditingContact,
  } = args;

  const activeChatWorkspaceProps = useMemo(() => ({
    theme,
    activeChat,
    setActiveChat,
    messageText,
    setMessageText,
    scheduleDateTime,
    showSchedulePopup,
    setShowSchedulePopup,
    setScheduleDateTime,
    isRecordingVoice,
    setIsRecordingVoice,
    voiceNoteError,
    showStickerPicker,
    setShowStickerPicker,
    morseMode,
    silentMode,
    replyTarget,
    setReplyTarget,
    draftTextByChat,
    setDraftTextByChat,
    setChats,
    setChannels,
    setVoiceNoteError,
    setSilentMode,
    setMorseMode,
    handleSendMessage,
    sendVoiceMessage,
    sendStickerMessage,
    savedMessages,
    onToggleSavedMessage: toggleSavedMessage,
    onPreviewCall: handlePreviewCall,
    onPreviewVideoCall: (name: string, color?: string) => handlePreviewCall(name, color, 'video'),
    onPreviewMessage: handlePreviewMessage,
    setEditingContact,
    onToggleMute: () => {
      setActiveChat((prev: any) => prev ? { ...prev, isMuted: !prev.isMuted } : null);
      setChannels((prev: any[]) => prev.map((channel: any) => channel.id === activeChat?.id ? { ...channel, isMuted: !activeChat?.isMuted } : channel) as any);
    },
    onAttachImage: (newMessage: any) => {
      setChats((prevChats: any[]) => prevChats.map((chat: any) => chat.id === activeChat?.id ? { ...chat, history: [...(chat.history || []), newMessage] } : chat));
      setActiveChat((prev: any) => prev ? ({ ...prev, history: [...(prev.history || []), newMessage] }) : null);
    },
    onHoldRecord: () => {
      if (!messageText) {
        setVoiceNoteError("");
        setIsRecordingVoice(true);
      }
    },
    onReRecord: () => setIsRecordingVoice(true),
    onPermissionDenied: (message: string) => {
      setIsRecordingVoice(false);
      setVoiceNoteError(message);
    },
    onSendVoice: (url: string, duration: string) => {
      setIsRecordingVoice(false);
      sendVoiceMessage(url, duration);
      setVoiceNoteError("");
    },
    onToggleSchedulePopup: () => setShowSchedulePopup(!showSchedulePopup),
    onToggleSilent: () => setSilentMode(!silentMode),
    onToggleMorse: () => setMorseMode(!morseMode),
  }), [
    theme, activeChat, setActiveChat, messageText, setMessageText, scheduleDateTime,
    showSchedulePopup, setShowSchedulePopup, setScheduleDateTime, isRecordingVoice,
    setIsRecordingVoice, voiceNoteError, showStickerPicker, setShowStickerPicker,
    morseMode, silentMode, replyTarget, setReplyTarget, draftTextByChat,
    setDraftTextByChat, setChats, setChannels, setVoiceNoteError, setSilentMode,
    setMorseMode, toggleSavedMessage, savedMessages, activeChat?.isMuted, setEditingContact,
    handleSendMessage, sendVoiceMessage, sendStickerMessage, handlePreviewCall, handlePreviewMessage,
  ]);

  return activeChatWorkspaceProps;
}
