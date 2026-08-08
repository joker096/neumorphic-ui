import { useState } from "react";
import { useAppStore } from "../store";
import { useFilteredChats } from "./useFilteredChats";
import type { Contact } from "../types/contact";

export type AppView = 'hub' | 'chats' | 'channels' | 'bots' | 'radar' | 'pulse' | 'calls' | 'settings' | 'contacts' | 'stories' | 'recordings' | 'company';

export interface AdvancedFilters {
  hasMedia: boolean;
  hasAudio: boolean;
  hasReplies: boolean;
  fromBots: boolean;
  priority: boolean;
}

/**
 * Owns all chat/workspace UI local state previously declared inline in App.
 * Pure extraction: same useState calls, same initial values, same order.
 */
export function useAppChatState() {
  const chats = useAppStore(s => s.chats);
  const channels = useAppStore(s => s.channels);
  const archivedChats = useAppStore(s => s.archivedChats);

  const [view, setView] = useState<AppView>('chats');
  const [subView, setSubView] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [activeChat, setActiveChat] = useState<any>(null);
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
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({ hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false });
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const { filteredChats, filteredChannels } = useFilteredChats(
    chats,
    chatSearchQuery,
    activeFolder,
    archivedChats,
    advancedFilters,
    channels,
  );

  return {
    view, setView,
    subView, setSubView,
    activeFolder, setActiveFolder,
    activeChat, setActiveChat,
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
    showContactPicker, setShowContactPicker,
    editingContact, setEditingContact,
    filteredChats,
    filteredChannels,
  };
}
