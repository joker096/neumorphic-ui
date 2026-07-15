import React, { useEffect, useState, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BellOff,
  Bookmark,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  ListFilter,
  Mic,
  Play,
  Plus,
  Search,
  Video,
  Volume2,
  Maximize2,
  X,
} from "lucide-react";
import { VideoPlayerOverlay } from "./chat/VideoPlayerOverlay";
import { PhotoViewerOverlay } from "./PhotoViewer";
import { VoiceWaveform } from "./VoiceWaveform";
import { ChannelCommentsView } from "./ChannelCommentsView";
import { LiveVoiceRecorder } from "./LiveVoiceRecorder";
import { StickerPicker } from "./chat/StickerPicker";
import { FormattedText } from "./FormattedText";
import { Tooltip } from "./Tooltip";
import { useAppStore } from "../store";
import { useI18n } from "../lib/i18n";
import { useDebounce } from "../hooks/useDebounce";
import { VirtualizedMessageList } from "./chat/VirtualizedMessageList";
import { getICQStickerSrc } from "../lib/icqEmojis";
import { encodeMorse } from "./MorseDecoder";
import { Smile } from "lucide-react";
import { toast } from "sonner";
import { ContactProfileModal, type ContactProfile } from "./ContactProfileModal";
import { ChatHeader } from "./chat-preview/ChatHeader";
import { groupMessages, formatDateLabel, fuzzTime, getBubbleCornerClass, type GroupPosition } from "../utils/chatUtils";
import { SearchBar } from "./chat-preview/SearchBar";
import { ReactionPicker } from "./chat-preview/ReactionPicker";
import { MessageActions } from "./chat-preview/MessageActions";
import { InputFooter } from "./chat-preview/InputFooter";
import { SavedMessagesPanel } from "./chat-preview/SavedMessagesPanel";
import { ChatMediaPanel } from "./chat-preview/ChatMediaPanel";
import { ChatInputArea } from "./chat-preview/ChatInputArea";

interface ChatPreviewLayerProps {
  chat: any;
  theme: "light" | "dark";
  onClose: () => void;
  onAction?: (action: string) => void;
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onMessage?: (name: string, color?: string) => void;
  onUpdateChat?: (chat: any) => void;
  onReply?: (message: any) => void;
  savedMessages?: any[];
  onToggleSavedMessage?: (chat: any, message: any) => void;
  deliveryReceipts?: boolean;
  readReceipts?: boolean;
  setEditingContact: (contact: ContactProfile | null) => void;
  // Message input props
  messageText?: string;
  setMessageText?: (text: string) => void;
  morseMode?: boolean;
  setMorseMode?: (mode: boolean) => void;
  silentMode?: boolean;
  setSilentMode?: (mode: boolean) => void;
  showStickerPicker?: boolean;
  setShowStickerPicker?: (show: boolean) => void;
  isRecordingVoice?: boolean;
  setIsRecordingVoice?: (recording: boolean) => void;
  voiceNoteError?: string;
  setVoiceNoteError?: (error: string) => void;
  scheduleDateTime?: string;
  setScheduleDateTime?: (value: string) => void;
  showSchedulePopup?: boolean;
  setShowSchedulePopup?: (show: boolean) => void;
  replyTarget?: any;
  setReplyTarget?: (target: any) => void;
  draftTextByChat?: Record<string, string>;
  setDraftTextByChat?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setChats?: (updater: any[] | ((prev: any[]) => any[])) => void;
  sendVoiceMessage?: (audioUrl: string, durationStr: string) => void;
  sendStickerMessage?: (sticker: string) => void;
  handleSendMessage?: () => void;
  onScheduleChange?: (value: string) => void;
  onToggleMute?: () => void;
  onAttachImage?: (message: any) => void;
  onToggleSchedulePopup?: () => void;
  onToggleSilent?: () => void;
  onToggleMorse?: () => void;
  onHoldRecord?: () => void;
  onReRecord?: () => void;
  onPermissionDenied?: (message: string) => void;
  onSendVoice?: (url: string, duration: string) => void;
  onToggleStickerPicker?: () => void;
}



export const ChatPreviewLayer = ({ chat, theme, onClose, onAction, onCall, onVideoCall, onMessage, onUpdateChat, onReply, savedMessages = [], onToggleSavedMessage, deliveryReceipts = true, readReceipts = true, setEditingContact, messageText, setMessageText, morseMode, setMorseMode, silentMode, setSilentMode, showStickerPicker, setShowStickerPicker, isRecordingVoice, setIsRecordingVoice, voiceNoteError, setVoiceNoteError, scheduleDateTime, setScheduleDateTime, showSchedulePopup, setShowSchedulePopup, replyTarget, setReplyTarget: setReplyTargetProp, draftTextByChat, setDraftTextByChat, sendVoiceMessage, sendStickerMessage, handleSendMessage: handleSendMessageProp, onScheduleChange, onToggleMute, onAttachImage, onToggleSchedulePopup, onToggleSilent, onToggleMorse, onHoldRecord, onReRecord, onPermissionDenied, onSendVoice, onToggleStickerPicker, }: any) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
  const stealthMode = useAppStore(s => s.stealthMode);
  const scheduledQueue = useAppStore(s => s.scheduledQueue);
  const setActiveCall = useAppStore(s => s.setActiveCall);
  const setChats = useAppStore(s => s.setChats);
  const setChannels = useAppStore(s => s.setChannels);
  const contacts = useAppStore(s => s.contacts);
  const setContacts = useAppStore(s => s.setContacts);
  const [videoOpen, setVideoOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactProfile | null>(null);
  const [mediaTab, setMediaTab] = useState<'all' | 'photos' | 'audio' | 'links'>('all');
  const [filterBySender, setFilterBySender] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  const [showComments, setShowComments] = useState(false);
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [activeReactionPicker, setActiveReactionPicker] = useState<number | string | null>(null);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [bounceMsgId, setBounceMsgId] = useState<string | number | null>(null);

  // Handle image attachment
  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>, chatData: any, onUpdChat: ((c: any) => void) | undefined, silent: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newMsg = { id: Date.now(), sender: "me", text: "", type: "image", attachment: url, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: "sent", silent };
    const updated = { ...chatData, history: [...(chatData.history || []), newMsg] };
    if (onUpdChat) onUpdChat(updated);
  };

  // Input state (managed by parent via props, or locally if not provided)
  const [localMessageText, setLocalMessageText] = useState("");
  const [localMorseMode, setLocalMorseMode] = useState(false);
  const [localSilentMode, setLocalSilentMode] = useState(false);
  const [localShowStickerPicker, setLocalShowStickerPicker] = useState(false);
  const [localIsRecordingVoice, setLocalIsRecordingVoice] = useState(false);
  const [localVoiceNoteError, setLocalVoiceNoteError] = useState("");
  const [localScheduleDateTime, setLocalScheduleDateTime] = useState("");
  const [localShowSchedulePopup, setLocalShowSchedulePopup] = useState(false);
  const [localReplyTarget, setLocalReplyTarget] = useState<any>(null);

  // Resolve effective values: prefer prop if provided, otherwise local state
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

  // Send message handler
  const sendMessage = () => {
    const textToSend = eMorseMode ? encodeMorse(eMsgText) : eMsgText.trim();
    if (!textToSend) return;
    // Enforce maximum message length (20000 chars)
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
  const lastTapRef = useRef<{ time: number; msgId: string | number }>({ time: 0, msgId: 0 });
  const [swipeReplyId, setSwipeReplyId] = useState<string | number | null>(null);
  const msgListRef = useRef<{ scrollToBottom: () => void }>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [unreadSinceScroll, setUnreadSinceScroll] = useState(0);
  const prevHistoryLen = useRef(chat.history?.length || 0);
  useEffect(() => {
    const curLen = chat.history?.length || 0
    if (!isNearBottom && curLen > prevHistoryLen.current) {
      setUnreadSinceScroll(prev => prev + (curLen - prevHistoryLen.current))
    }
    prevHistoryLen.current = curLen
  }, [chat.history?.length, isNearBottom]);
  
  const AVAILABLE_EMOJIS = ["👍", "❤️", "😂", "🔥", "😢", "🎉"];

  const handleReactionMessage = (msgId: string | number, emoji: string) => {
     const updatedChat = {
        ...chat,
        history: (chat.history || []).map((m: any) => {
           if (m.id === msgId) {
              const currentReactions = m.reactions || {};
              return {
                 ...m,
                 reactions: {
                    ...currentReactions,
                    [emoji]: (currentReactions[emoji] || 0) + 1
                 }
              };
           }
           return m;
        })
     };
     
     if (onUpdateChat) {
        onUpdateChat(updatedChat);
     }
     setChats(prev => prev.map(c => c.id === chat.id ? updatedChat : c));
     setActiveReactionPicker(null);
  };

  useEffect(() => {
    if (!chat || !chat.history) return;
    const hasDelivered = chat.history.some((m: any) => m.sender === "me" && m.status === "delivered");
    if (!hasDelivered) return;
    const timer = setTimeout(() => {
       const updatedHistory = chat.history.map((m: any) => {
          if (m.sender === "me" && m.status === "delivered") {
             return { ...m, status: "read" };
          }
          return m;
       });
       const updatedChat = { ...chat, history: updatedHistory };
       if (onUpdateChat) {
          onUpdateChat(updatedChat);
       }
       setChats(prev => prev.map(c => c.id === chat.id ? updatedChat : c));
    }, 1500);
    return () => clearTimeout(timer);
  }, [chat, onUpdateChat, setChats]);

  // Deterministic fuzzing by message ID up to ±5 minutes

  const debouncedSearch = useDebounce(searchQuery, 200);

  const filteredHistory = useMemo(() =>
    chat.history?.filter(
      (msg: any, idx: number) => {
        if (filterBySender === 'me' && msg.sender !== 'me') return false;
        if (filterBySender === 'them' && msg.sender === 'me') return false;
        
        if (filterStartDate || filterEndDate) {
          const msgDate = new Date(idx * 86400000 + Date.now());
          if (filterStartDate && msgDate < new Date(filterStartDate)) return false;
          if (filterEndDate && msgDate > new Date(filterEndDate)) return false;
        }
        
        const matchesSearch = debouncedSearch ? msg.text?.toLowerCase().includes(debouncedSearch.toLowerCase()) || !msg.text : true;
        
        return matchesSearch;
      },
    ) || [],
    [chat.history, filterBySender, filterStartDate, filterEndDate, debouncedSearch]);

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
    [chat.history, filterBySender, debouncedSearch, mediaTab]);

  const chatSavedMessages = useMemo(() =>
    savedMessages.filter((saved: any) => saved.chatId === chat.id),
    [savedMessages, chat.id]);

  const chatScheduledMessages = useMemo(() =>
    scheduledQueue.messages.filter((m: any) => m.chatId === chat.id),
    [scheduledQueue.messages, chat.id]);

  const flatItems = useMemo(() => {
    const groups = groupMessages(filteredHistory)
    const items: any[] = []
    let lastDateLabel = ''
    for (const group of groups) {
      const firstMsg = group.messages[0]
      const dateLabel = formatDateLabel(firstMsg.time)
      if (dateLabel !== lastDateLabel && items.length > 0) {
        items.push({ id: `sep-${dateLabel}`, _isDateSeparator: true, _dateLabel: dateLabel })
      }
      lastDateLabel = dateLabel
      group.messages.forEach((msg, mi) => {
        items.push({
          ...msg,
          _groupPosition: group.groupPositions[mi],
          _isLastInGroup: mi === group.messages.length - 1,
        })
      })
    }
    return items
  }, [filteredHistory])

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 40, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 40, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
className={`absolute inset-0 w-full h-full flex flex-col overflow-hidden z-50 md:z-40 ${
          isDark
            ? "bg-[#13151b] shadow-[0_32px_64px_rgba(0,0,0,0.8),_inset_0_1.5px_2px_rgba(255,255,255,0.05),_inset_0_-2px_4px_rgba(0,0,0,0.9)] border border-orange-500/10"
            : "bg-[#eaeff4] shadow-[0_32px_64px_rgba(165,175,190,0.8),_inset_1.5px_1.5px_3px_rgba(255,255,255,1)] border border-white"
        }`}
      >
        <ChatHeader
          chat={chat}
          isDark={isDark}
          onClose={onClose}
          onProfileClick={() => {
            const allContacts = useAppStore.getState().contacts;
            const profileContact = allContacts.find(ct => ct.name === chat.name);
            setSelectedContact({
              id: `hash_${chat.id}`,
              name: chat.name,
              color: chat.color,
              lastSeen: chat.online ? 0 : Date.now() - 3600000,
              online: chat.online,
              isFavorite: chat.isFavorite,
              localFields: profileContact?.localFields
            });
          }}
          t={t}
        />

        <SearchBar
          showSearch={showSearch}
          isDark={isDark}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder={t('chat.filters.searchPlaceholder')}
        />

        <ChatMediaPanel
          isDark={isDark}
          showMediaPanel={showMediaPanel}
          showFilterMenu={showFilterMenu}
          setShowFilterMenu={setShowFilterMenu}
          filterBySender={filterBySender}
          setFilterBySender={setFilterBySender}
          filterStartDate={filterStartDate}
          setFilterStartDate={setFilterStartDate}
          filterEndDate={filterEndDate}
          setFilterEndDate={setFilterEndDate}
          mediaTab={mediaTab}
          setMediaTab={setMediaTab}
          mediaItems={mediaItems}
          setActivePhotoUrl={setActivePhotoUrl}
          setPhotoOpen={setPhotoOpen}
          t={t}
        />

        {/* Messages */}
        <VirtualizedMessageList
          ref={msgListRef}
          items={flatItems}
          estimateSize={72}
          overscan={3}
          isDark={isDark}
          className="p-4 sm:p-6"
          onScrollPosition={(nearBottom) => {
            setIsNearBottom(nearBottom)
            if (nearBottom) setUnreadSinceScroll(0)
          }}
        >
          {(msg: any) => {
            if (msg._isDateSeparator) {
              return (
                <div className="sticky top-0 z-10 flex items-center gap-3 py-2" key={msg.id}>
                  <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                  <span className={`text-[11px] font-bold uppercase tracking-widest shrink-0 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                    {msg._dateLabel}
                  </span>
                  <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                </div>
              )
            }
            const isMe = msg.sender === "me";
            const stickerSrc = msg.type === "sticker" ? getICQStickerSrc(msg.text, theme) : null;
            const gp = msg._groupPosition as GroupPosition
            const bubbleCornerClass = getBubbleCornerClass(gp, isMe)
            return (
              <motion.div
                layout
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: bounceMsgId === msg.id ? [1, 0.95, 1.05, 1] : 1,
                  x: !isMe && swipeReplyId === msg.id ? 40 : 0,
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                drag={!isMe ? "x" : false}
                dragConstraints={!isMe ? { left: 0, right: 80 } : undefined}
                dragElastic={!isMe ? 0.1 : undefined}
                onDragEnd={!isMe ? (_: any, info: any) => {
                  if (info.offset.x > 60) {
                    onReply?.(msg)
                  }
                  setSwipeReplyId(null)
                } : undefined}
                onDrag={!isMe ? (_: any, info: any) => {
                  if (info.offset.x > 10) setSwipeReplyId(msg.id)
                  else setSwipeReplyId(null)
                } : undefined}
                className={`flex flex-col w-full group relative ${isMe ? "items-end" : "items-start"} ${msg._isLastInGroup !== false ? "mb-4" : "mb-1"}`}
              >
                 {!isMe && swipeReplyId === msg.id && (
                   <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-blue-500 z-10" />
                 )}
                 <div className={`flex items-center relative gap-2 max-w-[100%] ${isMe ? "justify-end flex-row-reverse" : "justify-start"}`}>
                    <div
                       onClick={() => {
                         const now = Date.now()
                         if (now - lastTapRef.current.time < 300 && lastTapRef.current.msgId === msg.id) {
                           handleReactionMessage(msg.id, '👍')
                           setBounceMsgId(msg.id)
                           setTimeout(() => setBounceMsgId(null), 300)
                           lastTapRef.current = { time: 0, msgId: 0 }
                         } else {
                           lastTapRef.current = { time: now, msgId: msg.id }
                         }
                       }}
                        className={`w-full max-w-full md:max-w-[80%] lg:max-w-[85%] ${msg.type ? "p-2" : "p-3.5"} text-[14px] leading-relaxed break-words relative ${bubbleCornerClass} ${
                          isMe
                            ? isDark
                              ? "bg-orange-600/20 text-orange-50 border border-orange-500/30 shadow-[0_2px_4px_rgba(0,0,0,0.15),_inset_0_1px_0_rgba(255,255,255,0.08)]"
                              : "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-[0_2px_4px_rgba(249,115,22,0.2),_inset_0_1px_0_rgba(255,255,255,0.2)]"
                            : isDark
                              ? "bg-[#1a1d24] text-gray-300 border border-white/5 shadow-[0_2px_4px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.03)]"
                              : "bg-white text-slate-700 border border-black/5 shadow-[0_2px_4px_rgba(165,175,190,0.15)]"
                        }`}
                     >
                      {msg.type === "image" && (
                        <div 
                           className="rounded-xl overflow-hidden mb-1 relative border border-white/10 cursor-pointer"
                           onClick={() => { setActivePhotoUrl(msg.attachment || msg.url); setPhotoOpen(true); }}
                        >
                          <img
                            src={msg.attachment || msg.url}
                            alt="Shared"
                            className="w-full h-auto object-cover max-h-[240px] sm:max-h-[280px] md:max-h-[320px]"
                          />
                        </div>
                      )}
                      {msg.type === "video" && (
                        <div
                          className="rounded-[14px] overflow-hidden mb-1 relative border border-white/10 group cursor-pointer"
                          onClick={() => setVideoOpen(true)}
                        >
                             <img
                                 src={msg.thumb}
                                 alt="Video thumbnail"
                                 className="w-full h-auto sm:w-[180px] sm:h-[100px] md:w-[200px] md:h-[120px] object-cover opacity-80"
                               />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play
                                size={20}
                                className="text-white fill-white ml-1"
                              />
                            </div>
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-white tracking-wider">
                            {msg.duration}
                          </div>
                        </div>
                      )}
                      {msg.type === "audio" && (
                        <VoiceWaveform duration={msg.duration} isMe={isMe} isDark={isDark} audioUrl={msg.audioUrl} />
                      )}
                      {msg.type === "sticker" && (
                        <div className="flex items-center justify-center">
                          {stickerSrc ? (
                            <img src={stickerSrc} alt="Sticker" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
                          ) : (
                            <span className="text-4xl">{msg.text}</span>
                          )}
                        </div>
                      )}
                      {msg.type === "image" && (
                        <div className={`mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500"}`}>
                          <span>{t('chat.filters.photo')}</span>
                          {msg.attachment && <span className="opacity-70">{t('chat.filters.ready')}</span>}
                        </div>
                      )}
                      {msg.replyTo && (
                        <div
                          className={`mb-2 px-3 py-2 rounded-xl border-l-2 text-[12px] ${
                            isDark
                              ? "bg-white/5 border-orange-400 text-gray-300"
                              : "bg-black/5 border-orange-500 text-slate-600"
                          }`}
                        >
                          <div className="font-bold text-[10px] uppercase tracking-widest opacity-70 mb-1">
                            Replying to {msg.replyTo.sender === "me" ? "your message" : msg.replyTo.sender}
                          </div>
                          <div className="line-clamp-2">{msg.replyTo.text || (msg.replyTo.type === "audio" ? `Voice note · ${msg.replyTo.duration || ""}` : "Attachment")}</div>
                        </div>
                      )}
                      {msg.text && msg.type !== "sticker" && (
                    <span className={`px-2 pb-1 block ${msg.type ? "font-medium" : ""}`}>
                        <FormattedText text={msg.text} searchTerm={searchQuery} />
                     </span>
                      )}
                      {msg.text && typeof msg.text === "string" && /https?:\/\/[^\s]+/i.test(msg.text) && (
                        <div className={`mt-2 p-2 rounded-xl border text-[11px] ${isDark ? "bg-white/5 border-white/10 text-gray-300" : "bg-slate-50 border-black/5 text-slate-600"}`}>
                          <div className="font-bold uppercase tracking-widest text-[9px] opacity-70 mb-1">{t('chat.linkPreview')}</div>
                          <div className="break-all line-clamp-2">{msg.text.match(/https?:\/\/[^\s]+/i)?.[0]}</div>
                        </div>
                      )}
                      {msg.keyboard && (
                        <div className="flex flex-col gap-1.5 mt-3 mb-1 w-full shrink-0">
                          {msg.keyboard.map((row: any[], i: number) => (
                            <div key={i} className="flex gap-1.5 w-full">
                              {row.map((btn: any, j: number) => (
                                <button 
                                  key={j} 
                                  onClick={() => {
                                     if (onAction) onAction(btn.action || btn.text);
                                     setTimeout(() => {
                                        // Normally this would trigger send, but setting text is fine
                                     }, 10);
                                  }}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${isDark ? "bg-[#2a2d36] hover:bg-[#343842] text-white border border-white/5" : "bg-[#f4f7f9] hover:bg-slate-200 text-slate-700 border border-black/5"}`}
                                >
                                  {btn.text}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      {msg._isLastInGroup && (
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-bold tracking-wide opacity-70 ${isMe && !isDark ? "text-orange-100" : ""} ${msg.type ? "px-2" : ""}`}
                      >
                        {msg.silent && <BellOff size={10} className="mr-0.5 opacity-60" />}
                        {stealthMode ? fuzzTime(msg.time, msg.id) : msg.time}
                        {isMe && (
                          <span className="inline-flex items-center">
                            <AnimatePresence mode="wait">
                              {(!deliveryReceipts || msg.status === 'sent') && (
                                <motion.span
                                  key="sent"
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.5 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  <Check size={12} strokeWidth={2.5} />
                                </motion.span>
                              )}
                              {deliveryReceipts && msg.status === 'delivered' && (
                                <motion.span
                                  key="delivered"
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.5 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  <CheckCheck size={12} strokeWidth={2.5} />
                                </motion.span>
                              )}
                              {deliveryReceipts && readReceipts && msg.status === 'read' && (
                                <motion.span
                                  key="read"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <CheckCheck size={12} strokeWidth={2.5} className={isDark ? 'text-blue-400' : 'text-blue-500'} />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </span>
                        )}
                      </div>
                      )}

                      {msg._isLastInGroup && (
                      <div className={`mt-1.5 flex items-center gap-1.5 sm:gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                        {!chat.isChannel && (
                          <button
                            onClick={() => onReply?.(msg)}
                            className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full transition-colors ${
                              isDark
                                ? "text-gray-400 hover:text-white hover:bg-white/5"
                                : "text-slate-500 hover:text-slate-800 hover:bg-black/5"
                            }`}
                          >
                            {t('chat.reply')}
                          </button>
                        )}
                        {!chat.isChannel && (
                          <button
                            onClick={() => onToggleSavedMessage?.(chat, msg)}
                            className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full transition-colors flex items-center gap-1 ${
                              isDark
                                ? "text-gray-400 hover:text-white hover:bg-white/5"
                                : "text-slate-500 hover:text-slate-800 hover:bg-black/5"
                            }`}
                          >
                            <Bookmark size={10} />
                            {chatSavedMessages.some((saved: any) => saved.messageId === msg.id) ? t('chat.saved') : t('chat.save')}
                          </button>
                        )}
                      </div>
                      )}

                      {/* Render Comments for Channels */}
                      {chat.isChannel && (
                         <div 
                            className={`flex items-center gap-1 mt-2 -mb-1 px-1 py-1 rounded-lg cursor-pointer ${isDark ? "hover:bg-white/5 text-gray-400 hover:text-white" : "hover:bg-black/5 text-slate-500 hover:text-slate-800"} transition-colors w-max`}
                            onClick={() => {
                               setActivePostId(msg.id);
                               setShowComments(true);
                            }}
                         >
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                           </svg>
                           <span className="text-[11px] font-medium tracking-wide">
                              {msg.id === 402 ? "45 Comments" : "Leave a Comment"}
                           </span>
                         </div>
                      )}
                    </div>
                    
                    {/* Reaction trigger */}
                    <div 
                        className={`opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${isDark ? "bg-[#2a2d36] text-gray-400 hover:text-white" : "bg-white text-slate-400 hover:text-slate-800"} w-10 h-10 rounded-full flex items-center justify-center shadow-md z-10 shrink-0 border border-black/5`}
                        onClick={() => setActiveReactionPicker(activeReactionPicker === msg.id ? null : msg.id)}
                        aria-label="Reactions"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveReactionPicker(activeReactionPicker === msg.id ? null : msg.id); }}
                    >
                        <Plus size={16} />
                    </div>

                    {/* Picker Popup */}
                    <AnimatePresence>
                    {activeReactionPicker === msg.id && (
                       <motion.div 
                          initial={{ opacity: 0, scale: 0.9, x: isMe ? 10 : -10 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.9, x: isMe ? 10 : -10 }}
                          className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "right-[calc(100%+8px)] mr-0" : "left-[calc(100%+8px)] ml-0"} z-20 flex bg-black/80 backdrop-blur-md rounded-full shadow-xl px-1 py-1`}
                       >
                       {AVAILABLE_EMOJIS.map(emoji => (
                           <button
                              key={emoji}
                              type="button"
                              className="w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-white/20 rounded-full transition-colors text-lg"
                              onClick={() => handleReactionMessage(msg.id, emoji)}
                              aria-label={emoji}
                           >
                              {emoji}
                           </button>
                        ))}
                       </motion.div>
                    )}
                    </AnimatePresence>
                 </div>

{/* Summary bar for Reactions */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                     <div className="flex gap-1.5 mt-1 z-10 relative">
                         {Object.entries(msg.reactions).map(([emoji, count]) => (
                            <React.Fragment key={emoji}>
                            <Tooltip content={`${count === 1 ? 'You' : count + ' users'} reacted with ${emoji}`} position="top" theme={isDark ? 'dark' : 'light'}>
                              <div 
                                 className={`rounded-full px-2 py-0.5 text-[12px] shadow-sm flex items-center cursor-help group select-none border transition-colors ${
                                    isDark ? "bg-[#1a1d24] text-gray-300 border-white/5 hover:border-white/20 hover:bg-[#20242e]" : "bg-white text-slate-700 border-black/5 hover:bg-slate-50 hover:border-black/10"
                                 }`}
                                 onClick={() => handleReactionMessage(msg.id, emoji)}
                              >
                                 {emoji}
                                 <span className={`ml-1.5 text-[11px] font-bold ${isDark ? "opacity-60" : "opacity-80"}`}>{String(count)}</span>
                              </div>
                            </Tooltip>
                            </React.Fragment>
                         ))}
                     </div>
                  )}
                  </motion.div>
            );
          }}
          </VirtualizedMessageList>
          <AnimatePresence>
            {!isNearBottom && (
              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                onClick={() => {
                  msgListRef.current?.scrollToBottom()
                  setUnreadSinceScroll(0)
                }}
                className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg cursor-pointer ${
                  isDark ? 'bg-orange-500 text-white hover:bg-orange-400' : 'bg-orange-500 text-white hover:bg-orange-400'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
                {unreadSinceScroll > 0 && (
                  <span className="text-[11px] font-bold">{unreadSinceScroll}</span>
                )}
              </motion.button>
            )}
          </AnimatePresence>
          {chatScheduledMessages.length > 0 && (
          <div className="px-4 sm:px-6 pb-3 sm:pb-4">
          {chatScheduledMessages.map((msg: any) => (
             <motion.div
               layout
               key={msg.id}
               initial={{ opacity: 0, y: 10, scale: 0.95 }}
               animate={{ opacity: 0.7, y: 0, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="flex w-full justify-end"
             >
                <div
                   className={`max-w-[80%] sm:max-w-[70%] p-3 rounded-xl sm:rounded-[16px] text-[13px] sm:text-[14px] shadow-sm border border-dashed relative leading-relaxed overflow-hidden break-words ${
                    isDark
                      ? "bg-[#1a1d24] text-gray-400 border-gray-600 rounded-br-sm"
                      : "bg-gray-50 text-gray-500 border-gray-300 rounded-br-sm"
                  }`}
                >
                  <FormattedText text={msg.text} searchTerm={searchQuery} />
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] font-bold tracking-wide opacity-50">
                     <Clock size={10} className="inline mr-1" />
                     {new Date(msg.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     <span className="cursor-pointer ml-2 hover:text-red-500" onClick={() => scheduledQueue.removeMessage(msg.id)}>✕</span>
                  </div>
                </div>
              </motion.div>
           ))}
           </div>
           )}

        <ChatInputArea
          isDark={isDark}
          isChannel={chat.isChannel}
          chat={chat}
          eMsgText={eMsgText}
          setMsgTextFn={setMsgTextFn}
          eMorseMode={eMorseMode}
          setMorseModeFn2={setMorseModeFn2}
          eSilentMode={eSilentMode}
          setSilentModeFn2={setSilentModeFn2}
          eShowStickerPicker={eShowStickerPicker}
          setShowStickerPickerFn2={setShowStickerPickerFn2}
          eIsRecordingVoice={eIsRecordingVoice}
          setIsRecordingVoiceFn2={setIsRecordingVoiceFn2}
          eVoiceNoteError={eVoiceNoteError}
          setVoiceNoteErrFn2={setVoiceNoteErrFn2}
          eScheduleDateTime={eScheduleDateTime}
          setScheduleDtFn2={setScheduleDtFn2}
          eShowSchedulePopup={eShowSchedulePopup}
          setShowSchedulePopupFn2={setShowSchedulePopupFn2}
          eReplyTarget={eReplyTarget}
          setLocalReplyTarget={setLocalReplyTarget}
          sendMessage={sendMessage}
          sendVoiceMessage={sendVoiceMessage}
          sendStickerMessage={sendStickerMessage}
          handleImageAttach={handleImageAttach}
          onUpdateChat={onUpdateChat}
          onAction={onAction}
          setChannels={setChannels}
          theme={theme}
          t={t}
        />
      </motion.div>
      <VideoPlayerOverlay
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        theme={theme}
      />
      <PhotoViewerOverlay
        open={photoOpen}
        url={activePhotoUrl}
        onClose={() => setPhotoOpen(false)}
        theme={theme}
      />
      <ChannelCommentsView
        isOpen={showComments}
        postId={activePostId || 0}
        onClose={() => setShowComments(false)}
        theme={theme}
        postKey=""
        channelChatId={"test_channel"}
      />
      <SavedMessagesPanel
        show={showSavedPanel}
        isDark={isDark}
        chatSavedMessages={chatSavedMessages}
        chatName={chat.name}
        onClose={() => setShowSavedPanel(false)}
        onToggleSavedMessage={(chat, msg) => onToggleSavedMessage?.(chat, msg)}
        t={t}
      />
       <ContactProfileModal 
          contact={selectedContact}
          theme={theme}
          onClose={() => setSelectedContact(null)}
           onCall={() => {
               if (onCall && selectedContact) onCall(selectedContact.name, selectedContact.color);
               setSelectedContact(null);
           }}
           onVideoCall={() => {
               if (onVideoCall && selectedContact) onVideoCall(selectedContact.name, selectedContact.color);
               setSelectedContact(null);
           }}
           onMessage={() => {
              if (onMessage && selectedContact) onMessage(selectedContact.name, selectedContact.color);
              setSelectedContact(null);
          }}
         onDelete={() => {
               toast.info(t('toast.contact'), { description: t('toast.contactDeleted', { name: selectedContact?.name || '' }) || `Deleted contact history for: ${selectedContact?.name}` });
               setSelectedContact(null);
           }}
          onEdit={() => {
                if (selectedContact) {
                  setEditingContact(selectedContact);
                }
                setSelectedContact(null);
            }}
           onBlock={() => {
                toast.warning(t('toast.contact'), { description: t('toast.contactBlocked', { name: selectedContact?.name || '' }) || `Blocked contact: ${selectedContact?.name}` });
                setSelectedContact(null);
            }}
           onToggleFavorite={(id, isFavorite) => {
              setContacts(prev => prev.map(c => c.id === id ? { ...c, isFavorite } : c));
            }}
       />
    </>
  );
};
