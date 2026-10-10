import { useState, useRef, useEffect } from "react";
import { useAppStore } from "../store";
import { useI18n } from "../lib/i18n";
import { useOfflineQueue } from "./useOfflineQueue";
import { useFileSend } from "./useFileSend";
import { useChatPreviewDraft } from "./useChatPreviewDraft";
import { useChatPreviewSearch } from "./useChatPreviewSearch";
import { useChatPreviewSends } from "./useChatPreviewSends";
import { useChatPreviewLiveLocation } from "./useChatPreviewLiveLocation";
import { useChatPreviewEffects } from "./useChatPreviewEffects";
import { useMessageThreads } from "./useMessageThreads";

/**
 * Chat preview state orchestrator.
 *
 * The work lives in focused hooks next door: `useChatPreviewDraft` (controlled
 * /uncontrolled composer fields), `useChatPreviewSearch` (in-chat search and the
 * derived collections), `useChatPreviewSends` (every outgoing path),
 * `useChatPreviewLiveLocation` and `useChatPreviewEffects`. This file only
 * wires them to the store and re-publishes the flat surface the caller
 * destructures.
 */
export function useChatPreviewState(
  chat: any,
  onUpdateChat?: (chat: any) => void,
  onReply?: (message: any) => void,
  savedMessages: any[] = [],
  onToggleSavedMessage?: (chat: any, message: any) => void,
  deliveryReceipts = true,
  readReceipts = true,
  messageText?: string,
  setMessageText?: (text: string) => void,
  morseMode?: boolean,
  setMorseMode?: (mode: boolean) => void,
  silentMode?: boolean,
  setSilentMode?: (mode: boolean) => void,
  showStickerPicker?: boolean,
  setShowStickerPicker?: (show: boolean) => void,
  isRecordingVoice?: boolean,
  setIsRecordingVoice?: (recording: boolean) => void,
  voiceNoteError?: string,
  setVoiceNoteError?: (error: string) => void,
  scheduleDateTime?: string,
  setScheduleDateTime?: (value: string) => void,
  showSchedulePopup?: boolean,
  setShowSchedulePopup?: (show: boolean) => void,
  replyTarget?: any,
  setReplyTargetProp?: (target: any) => void,
  sendStickerMessage?: (sticker: string) => void,
  handleSendMessageProp?: () => void,
  onScheduleChange?: (value: string) => void,
  onToggleMute?: () => void,
  onAttachImage?: (message: any) => void,
  onToggleSchedulePopup?: () => void,
  onToggleSilent?: () => void,
  onToggleMorse?: () => void,
  onToggleStickerPicker?: () => void,
  setChats?: (updater: any[] | ((prev: any[]) => any[])) => void,
  setEditingContact?: (contact: any) => void,
  onAction?: (action: string) => void,
  onCall?: (name: string, color?: string) => void,
  onVideoCall?: (name: string, color?: string) => void,
  onMessage?: (name: string, color?: string) => void,
) {
  const stealthMode = useAppStore(s => s.stealthMode);
  const scheduledQueue = useAppStore(s => s.scheduledQueue);
  const setChatsStore = useAppStore(s => s.setChats);
  const startLiveLocationStore = useAppStore(s => s.startLiveLocation);
  const stopLiveLocationStore = useAppStore(s => s.stopLiveLocation);
  const setChannels = useAppStore(s => s.setChannels);
  const contacts = useAppStore(s => s.contacts);
  const setContacts = useAppStore(s => s.setContacts);
  const { t, lang } = useI18n();
  const queueOffline = useOfflineQueue();
  const { sendFile, sendFiles } = useFileSend(chat, { setChats: setChatsStore, setActiveChat: onUpdateChat });

  const [videoOpen, setVideoOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);
  const [activeMediaMsg, setActiveMediaMsg] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [bounceMsgId, setBounceMsgId] = useState<string | number | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [unreadSinceScroll, setUnreadSinceScroll] = useState(0);
  const lastTapRef = useRef<{ time: number; msgId: string | number }>({ time: 0, msgId: 0 });
  const [swipeReplyId, setSwipeReplyId] = useState<string | number | null>(null);
  const [threadRootId, setThreadRootId] = useState<string | number | null>(null);
  const threads = useMessageThreads(chat?.history);

  // Switching chats closes any open thread panel.
  useEffect(() => { setThreadRootId(null); }, [chat?.id]);

  const draft = useChatPreviewDraft({
    messageText, setMessageText,
    morseMode, setMorseMode,
    silentMode, setSilentMode,
    showStickerPicker, setShowStickerPicker,
    isRecordingVoice, setIsRecordingVoice,
    voiceNoteError, setVoiceNoteError,
    scheduleDateTime, setScheduleDateTime,
    showSchedulePopup, setShowSchedulePopup,
    replyTarget, setReplyTargetProp,
  });

  const sends = useChatPreviewSends({
    chat,
    onUpdateChat,
    draft,
    queueOffline,
    setChatsStore,
    setChannels,
    sendFile,
    sendFiles,
  });

  const liveLocation = useChatPreviewLiveLocation({
    chat,
    onUpdateChat,
    silent: draft.eSilentMode,
    t,
    startLiveLocation: startLiveLocationStore,
    stopLiveLocation: stopLiveLocationStore,
  });

  const search = useChatPreviewSearch({
    chat,
    savedMessages,
    scheduledMessages: scheduledQueue.messages,
    lang,
    t,
  });

  useChatPreviewEffects({
    chat,
    readReceipts,
    isNearBottom,
    onUpdateChat,
    setChatsStore,
    setUnreadSinceScroll,
    setActiveMediaMsg,
  });

  return {
    videoOpen, setVideoOpen,
    photoOpen, setPhotoOpen,
    activePhotoUrl, setActivePhotoUrl,
    activeMediaMsg, setActiveMediaMsg,
    showMediaPanel, setShowMediaPanel,
    selectedContact, setSelectedContact,
    showComments, setShowComments,
    activePostId, setActivePostId,
    showSavedPanel, setShowSavedPanel,
    bounceMsgId, setBounceMsgId,
    isNearBottom, setIsNearBottom,
    unreadSinceScroll, setUnreadSinceScroll,
    eMsgText: draft.eMsgText, setMsgTextFn: draft.setMsgTextFn,
    eMorseMode: draft.eMorseMode, setMorseModeFn2: draft.setMorseModeFn2,
    eSilentMode: draft.eSilentMode, setSilentModeFn2: draft.setSilentModeFn2,
    eShowStickerPicker: draft.eShowStickerPicker, setShowStickerPickerFn2: draft.setShowStickerPickerFn2,
    eIsRecordingVoice: draft.eIsRecordingVoice, setIsRecordingVoiceFn2: draft.setIsRecordingVoiceFn2,
    eVoiceNoteError: draft.eVoiceNoteError, setVoiceNoteErrFn2: draft.setVoiceNoteErrFn2,
    eScheduleDateTime: draft.eScheduleDateTime, setScheduleDtFn2: draft.setScheduleDtFn2,
    eShowSchedulePopup: draft.eShowSchedulePopup, setShowSchedulePopupFn2: draft.setShowSchedulePopupFn2,
    eReplyTarget: draft.eReplyTarget, setReplyTargetFn2: draft.setReplyTargetFn2,
    lastTapRef,
    swipeReplyId, setSwipeReplyId,
    threads,
    threadRootId, setThreadRootId,
    sendMessage: sends.sendMessage,
    sendGeoMessage: sends.sendGeoMessage,
    sendArticleMessage: sends.sendArticleMessage,
    handleImageAttach: sends.handleImageAttach,
    handleFileDrop: sends.handleFileDrop,
    sendVideoNote: sends.sendVideoNote,
    handleReactionMessage: sends.handleReactionMessage,
    retryFailedMessage: sends.retryFailedMessage,
    activeReactionPicker: sends.activeReactionPicker,
    setActiveReactionPicker: sends.setActiveReactionPicker,
    startLiveLocationShare: liveLocation.startLiveLocationShare,
    stopLiveLocationShare: liveLocation.stopLiveLocationShare,
    searchQuery: search.searchQuery, setSearchQuery: search.setSearchQuery,
    showSearch: search.showSearch, setShowSearch: search.setShowSearch,
    mediaTab: search.mediaTab, setMediaTab: search.setMediaTab,
    filterBySender: search.filterBySender, setFilterBySender: search.setFilterBySender,
    filterStartDate: search.filterStartDate, setFilterStartDate: search.setFilterStartDate,
    filterEndDate: search.filterEndDate, setFilterEndDate: search.setFilterEndDate,
    showFilterMenu: search.showFilterMenu, setShowFilterMenu: search.setShowFilterMenu,
    showDateFilter: search.showDateFilter, setShowDateFilter: search.setShowDateFilter,
    searchTypeFilter: search.searchTypeFilter, setSearchTypeFilter: search.setSearchTypeFilter,
    debouncedSearch: search.debouncedSearch,
    filteredHistory: search.filteredHistory,
    mediaItems: search.mediaItems,
    chatSavedMessages: search.chatSavedMessages,
    chatScheduledMessages: search.chatScheduledMessages,
    flatItems: search.flatItems,
    matchCount: search.matchCount,
    activeMatch: search.activeMatch,
    goToNextMatch: search.goToNextMatch,
    goToPrevMatch: search.goToPrevMatch,
    msgListRef: search.msgListRef,
    scheduledQueue,
    stealthMode,
    setChatsStore,
    setChannels,
    contacts,
    setContacts,
  };
}