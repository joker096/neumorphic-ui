import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../store";
import { groupMessages, formatDateLabel } from "../utils/chatUtils";
import { useDebounce } from "./useDebounce";
import { encodeMorse } from "../components/MorseDecoder";

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
  sendVoiceMessage?: (audioUrl: string, durationStr: string) => void,
  sendStickerMessage?: (sticker: string) => void,
  handleSendMessageProp?: () => void,
  onScheduleChange?: (value: string) => void,
  onToggleMute?: () => void,
  onAttachImage?: (message: any) => void,
  onToggleSchedulePopup?: () => void,
  onToggleSilent?: () => void,
  onToggleMorse?: () => void,
  onHoldRecord?: () => void,
  onReRecord?: () => void,
  onPermissionDenied?: (message: string) => void,
  onSendVoice?: (url: string, duration: string) => void,
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
  const setChannels = useAppStore(s => s.setChannels);
  const contacts = useAppStore(s => s.contacts);
  const setContacts = useAppStore(s => s.setContacts);

  const [videoOpen, setVideoOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [mediaTab, setMediaTab] = useState<'all' | 'photos' | 'audio' | 'links'>('all');
  const [filterBySender, setFilterBySender] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [searchTypeFilter, setSearchTypeFilter] = useState<'all' | 'media' | 'files' | 'links'>('all');
  const [showComments, setShowComments] = useState(false);
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [activeReactionPicker, setActiveReactionPicker] = useState<number | string | null>(null);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [bounceMsgId, setBounceMsgId] = useState<string | number | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [unreadSinceScroll, setUnreadSinceScroll] = useState(0);

  const [localMessageText, setLocalMessageText] = useState("");
  const [localMorseMode, setLocalMorseMode] = useState(false);
  const [localSilentMode, setLocalSilentMode] = useState(false);
  const [localShowStickerPicker, setLocalShowStickerPicker] = useState(false);
  const [localIsRecordingVoice, setLocalIsRecordingVoice] = useState(false);
  const [localVoiceNoteError, setLocalVoiceNoteError] = useState("");
  const [localScheduleDateTime, setLocalScheduleDateTime] = useState("");
  const [localShowSchedulePopup, setLocalShowSchedulePopup] = useState(false);
  const [localReplyTarget, setLocalReplyTarget] = useState<any>(null);

  const eMsgText = messageText ?? localMessageText;
  const eMorseMode = morseMode ?? localMorseMode;
  const eSilentMode = silentMode ?? localSilentMode;
  const eShowStickerPicker = showStickerPicker ?? localShowStickerPicker;
  const eIsRecordingVoice = isRecordingVoice ?? localIsRecordingVoice;
  const eVoiceNoteError = voiceNoteError ?? localVoiceNoteError;
  const eScheduleDateTime = scheduleDateTime ?? localScheduleDateTime;
  const eShowSchedulePopup = showSchedulePopup ?? localShowSchedulePopup;
  const eReplyTarget = replyTarget ?? localReplyTarget;
  const setMsgTextFn = setMessageText ?? ((v: string) => { setLocalMessageText(v); });
  const setMorseModeFn2 = setMorseMode ?? ((v: boolean) => { setLocalMorseMode(v); });
  const setSilentModeFn2 = setSilentMode ?? ((v: boolean) => { setLocalSilentMode(v); });
  const setShowStickerPickerFn2 = setShowStickerPicker ?? ((v: boolean) => { setLocalShowStickerPicker(v); });
  const setIsRecordingVoiceFn2 = setIsRecordingVoice ?? ((v: boolean) => { setLocalIsRecordingVoice(v); });
  const setVoiceNoteErrFn2 = setVoiceNoteError ?? ((v: string) => { setLocalVoiceNoteError(v); });
  const setScheduleDtFn2 = setScheduleDateTime ?? ((v: string) => { setLocalScheduleDateTime(v); });
  const setShowSchedulePopupFn2 = setShowSchedulePopup ?? ((v: boolean) => { setLocalShowSchedulePopup(v); });
  const setReplyTargetFn2 = setReplyTargetProp ?? ((t: any) => { setLocalReplyTarget(t); });

  const lastTapRef = useRef<{ time: number; msgId: string | number }>({ time: 0, msgId: 0 });
  const [swipeReplyId, setSwipeReplyId] = useState<string | number | null>(null);
  const msgListRef = useRef<{ scrollToBottom: () => void; scrollToIndex?: (index: number, align?: 'start' | 'center' | 'end') => void }>(null);
  const prevHistoryLen = useRef(chat.history?.length || 0);

  useEffect(() => {
    const curLen = chat.history?.length || 0;
    if (!isNearBottom && curLen > prevHistoryLen.current) {
      setUnreadSinceScroll(prev => prev + (curLen - prevHistoryLen.current));
    }
    prevHistoryLen.current = curLen;
  }, [chat.history?.length, isNearBottom]);

  const sendMessage = () => {
    const textToSend = eMorseMode ? encodeMorse(eMsgText) : eMsgText.trim();
    if (!textToSend) return;
    if (textToSend.length > 20000) return;
    const newMessage = {
      id: Date.now(),
      sender: "me",
      text: textToSend,
      type: eMorseMode ? "morse" : undefined,
      replyTo: eReplyTarget ? {
        id: eReplyTarget.id,
        sender: eReplyTarget.sender,
        text: eReplyTarget.text,
        type: eReplyTarget.type,
        duration: eReplyTarget.duration
      } : undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "sent",
      silent: eSilentMode,
    };
    const updatedChat = {
      ...chat,
      history: [...(chat.history || []), newMessage],
    };
    if (onUpdateChat) onUpdateChat(updatedChat);
    setMsgTextFn("");
    setLocalReplyTarget(null);
    setLocalMorseMode(false);
    setLocalSilentMode(false);
  };

  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>, chatData: any, onUpdChat: ((c: any) => void) | undefined, silent: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newMsg = { id: Date.now(), sender: "me", text: "", type: "image", attachment: url, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: "sent", silent };
    const updated = { ...chatData, history: [...(chatData.history || []), newMsg] };
    if (onUpdChat) onUpdChat(updated);
  };

  const handleReactionMessage = (msgId: string | number, emoji: string) => {
    const updatedChat = {
      ...chat,
      history: (chat.history || []).map((m: any) => {
        if (m.id === msgId) {
          const currentReactions = m.reactions || {};
          return { ...m, reactions: { ...currentReactions, [emoji]: (currentReactions[emoji] || 0) + 1 } };
        }
        return m;
      })
    };
    if (onUpdateChat) onUpdateChat(updatedChat);
    setChatsStore(prev => prev.map(c => c.id === chat.id ? updatedChat : c));
    setActiveReactionPicker(null);
  };

  useEffect(() => {
    if (!chat || !chat.history) return;
    const hasDelivered = chat.history.some((m: any) => m.sender === "me" && m.status === "delivered");
    if (!hasDelivered) return;
    const timer = setTimeout(() => {
      const updatedHistory = chat.history.map((m: any) => {
        if (m.sender === "me" && m.status === "delivered") return { ...m, status: "read" };
        return m;
      });
      const updatedChat = { ...chat, history: updatedHistory };
      if (onUpdateChat) onUpdateChat(updatedChat);
      setChatsStore(prev => prev.map(c => c.id === chat.id ? updatedChat : c));
    }, 1500);
    return () => clearTimeout(timer);
  }, [chat, onUpdateChat, setChatsStore]);

  const debouncedSearch = useDebounce(searchQuery, 200);

  const filteredHistory = useMemo(() =>
    chat.history?.filter((msg: any, idx: number) => {
      if (filterBySender === 'me' && msg.sender !== 'me') return false;
      if (filterBySender === 'them' && msg.sender === 'me') return false;
      if (filterStartDate || filterEndDate) {
        const msgDate = new Date(idx * 86400000 + Date.now());
        if (filterStartDate && msgDate < new Date(filterStartDate)) return false;
        if (filterEndDate && msgDate > new Date(filterEndDate)) return false;
      }
      const matchesType =
        searchTypeFilter === 'all' ? true :
        searchTypeFilter === 'media' ? (msg.type === 'image' || msg.type === 'video') :
        searchTypeFilter === 'files' ? msg.type === 'file' :
        searchTypeFilter === 'links' ? (typeof msg.text === 'string' && /https?:\/\//i.test(msg.text)) :
        true;
      if (!matchesType) return false;
      return debouncedSearch ? msg.text?.toLowerCase().includes(debouncedSearch.toLowerCase()) || !msg.text : true;
    }) || [],
    [chat.history, filterBySender, filterStartDate, filterEndDate, debouncedSearch, searchTypeFilter]
  );

  const mediaItems = useMemo(() =>
    (chat.history || []).filter((msg: any) => {
      if (filterBySender === 'me' && msg.sender !== 'me') return false;
      if (filterBySender === 'them' && msg.sender === 'me') return false;
      if (debouncedSearch && !msg.text?.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      if (mediaTab === 'photos') return msg.type === 'image';
      if (mediaTab === 'audio') return msg.type === 'audio';
      if (mediaTab === 'links') return typeof msg.text === 'string' && /https?:\/\//i.test(msg.text);
      return msg.type === 'image' || msg.type === 'audio' || (typeof msg.text === 'string' && /https?:\/\//i.test(msg.text));
    }),
    [chat.history, filterBySender, debouncedSearch, mediaTab]
  );

  const chatSavedMessages = useMemo(() =>
    savedMessages.filter((saved: any) => saved.chatId === chat.id),
    [savedMessages, chat.id]
  );

  const chatScheduledMessages = useMemo(() =>
    scheduledQueue.messages.filter((m: any) => m.chatId === chat.id),
    [scheduledQueue.messages, chat.id]
  );

  const flatItems = useMemo(() => {
    const groups = groupMessages(filteredHistory);
    const items: any[] = [];
    let lastDateLabel = '';
    for (const group of groups) {
      const firstMsg = group.messages[0];
      const dateLabel = formatDateLabel(firstMsg.time);
      if (dateLabel !== lastDateLabel && items.length > 0) {
        items.push({ id: `sep-${dateLabel}`, _isDateSeparator: true, _dateLabel: dateLabel });
      }
      lastDateLabel = dateLabel;
      group.messages.forEach((msg: any, mi: number) => {
        items.push({ ...msg, _groupPosition: group.groupPositions[mi], _isLastInGroup: mi === group.messages.length - 1 });
      });
    }
    return items;
  }, [filteredHistory]);

  // In-chat search: match navigation (бриф §5.4 "переход к сообщению")
  const matchIndices = useMemo(() => {
    const q = (debouncedSearch || '').toLowerCase().trim();
    if (!q) return [] as number[];
    const out: number[] = [];
    flatItems.forEach((item: any, idx: number) => {
      if (!item._isDateSeparator && typeof item.text === 'string' && item.text.toLowerCase().includes(q)) {
        out.push(idx);
      }
    });
    return out;
  }, [flatItems, debouncedSearch]);

  const [activeMatch, setActiveMatch] = useState(0);
  useEffect(() => {
    if (matchIndices.length === 0) {
      setActiveMatch(0);
      return;
    }
    setActiveMatch(0);
    msgListRef.current?.scrollToIndex?.(matchIndices[0], 'center');
  }, [matchIndices]);

  const goToMatch = useCallback((dir: 1 | -1) => {
    if (matchIndices.length === 0) return;
    const next = (activeMatch + dir + matchIndices.length) % matchIndices.length;
    setActiveMatch(next);
    msgListRef.current?.scrollToIndex?.(matchIndices[next], 'center');
  }, [activeMatch, matchIndices, msgListRef]);

  return {
    videoOpen, setVideoOpen,
    photoOpen, setPhotoOpen,
    activePhotoUrl, setActivePhotoUrl,
    searchQuery, setSearchQuery,
    showSearch, setShowSearch,
    showMediaPanel, setShowMediaPanel,
    selectedContact, setSelectedContact,
    mediaTab, setMediaTab,
    filterBySender, setFilterBySender,
    filterStartDate, setFilterStartDate,
    filterEndDate, setFilterEndDate,
    showFilterMenu, setShowFilterMenu,
    showDateFilter, setShowDateFilter,
    searchTypeFilter, setSearchTypeFilter,
    showComments, setShowComments,
    activePostId, setActivePostId,
    activeReactionPicker, setActiveReactionPicker,
    showSavedPanel, setShowSavedPanel,
    bounceMsgId, setBounceMsgId,
    isNearBottom, setIsNearBottom,
    unreadSinceScroll, setUnreadSinceScroll,
    eMsgText, setMsgTextFn,
    eMorseMode, setMorseModeFn2,
    eSilentMode, setSilentModeFn2,
    eShowStickerPicker, setShowStickerPickerFn2,
    eIsRecordingVoice, setIsRecordingVoiceFn2,
    eVoiceNoteError, setVoiceNoteErrFn2,
    eScheduleDateTime, setScheduleDtFn2,
    eShowSchedulePopup, setShowSchedulePopupFn2,
    eReplyTarget, setReplyTargetFn2,
    lastTapRef,
    swipeReplyId, setSwipeReplyId,
    msgListRef,
    sendMessage,
    handleImageAttach,
    handleReactionMessage,
    filteredHistory,
    mediaItems,
    chatSavedMessages,
    chatScheduledMessages,
    flatItems,
    matchCount: matchIndices.length,
    activeMatch,
    goToNextMatch: () => goToMatch(1),
    goToPrevMatch: () => goToMatch(-1),
    scheduledQueue,
    stealthMode,
    setChatsStore,
    setChannels,
    contacts,
    setContacts,
    debouncedSearch,
  };
}
