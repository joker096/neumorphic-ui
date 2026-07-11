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
import { VideoPlayerOverlay } from "../chat/VideoPlayerOverlay";
import { PhotoViewerOverlay } from "./PhotoViewer";
import { VoiceWaveform } from "./VoiceWaveform";
import { ChannelCommentsView } from "../features/ChannelCommentsView";
import { LiveVoiceRecorder } from "./LiveVoiceRecorder";
import { StickerPicker } from "../chat/StickerPicker";
import { FormattedText } from "./FormattedText";
import { Tooltip } from "../ui/Tooltip";
import { useAppStore } from "../../store";
import { useI18n, getTranslation } from "../../lib/i18n";
import { useDebounce } from "../../hooks/useDebounce";
import { VirtualizedMessageList } from "../chat/VirtualizedMessageList";
import { getICQStickerSrc } from "../../lib/icqEmojis";
import { encodeMorse } from "./MorseDecoder";
import { Smile } from "lucide-react";
import { toast } from "sonner";
import { ContactProfileModal, type ContactProfile } from "../contacts/ContactProfileModal";
import { ChatHeader } from "./ChatHeader";
import { SearchBar } from "./SearchBar";
import { ReactionPicker } from "./ReactionPicker";
import { MessageActions } from "./MessageActions";
import { InputFooter } from "./InputFooter";
import { SavedMessagesPanel } from "./SavedMessagesPanel";

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

type GroupPosition = 'single' | 'first' | 'middle' | 'last'

function groupMessages(history: any[]): { messages: any[]; groupPositions: GroupPosition[] }[] {
  const groups: { messages: any[]; groupPositions: GroupPosition[] }[] = []
  for (const msg of history) {
    const lastGroup = groups[groups.length - 1]
    const lastMsg = lastGroup?.messages?.at(-1)
    if (lastMsg && lastMsg.sender === msg.sender) {
      lastGroup.messages.push(msg)
    } else {
      groups.push({ messages: [msg], groupPositions: [] })
    }
  }
  for (const group of groups) {
    if (group.messages.length === 1) {
      group.groupPositions = ['single']
    } else {
      group.groupPositions = group.messages.map((_, i) => {
        if (i === 0) return 'first'
        if (i === group.messages.length - 1) return 'last'
        return 'middle'
      })
    }
  }
  return groups
}

function formatDateLabel(timeStr: string, lang = 'en'): string {
  const match = timeStr.match(/(\d{1,2}):(\d{2})/)
  if (!match) return timeStr
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(match[1]), parseInt(match[2]))
  const diffDays = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return getTranslation('chat.today', lang)
  if (diffDays === 1) return getTranslation('chat.yesterday', lang)
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: now.getFullYear() !== d.getFullYear() ? 'numeric' : undefined })
}

export const ChatPreviewLayer = ({ chat, theme, onClose, onAction, onCall, onVideoCall, onMessage, onUpdateChat, onReply, savedMessages = [], onToggleSavedMessage, deliveryReceipts = true, readReceipts = true, setEditingContact, messageText, setMessageText, morseMode, setMorseMode, silentMode, setSilentMode, showStickerPicker, setShowStickerPicker, isRecordingVoice, setIsRecordingVoice, voiceNoteError, setVoiceNoteError, scheduleDateTime, setScheduleDateTime, showSchedulePopup, setShowSchedulePopup, replyTarget, setReplyTarget: setReplyTargetProp, draftTextByChat, setDraftTextByChat, sendVoiceMessage, sendStickerMessage, handleSendMessage: handleSendMessageProp, onScheduleChange, onToggleMute, onAttachImage, onToggleSchedulePopup, onToggleSilent, onToggleMorse, onHoldRecord, onReRecord, onPermissionDenied, onSendVoice, onToggleStickerPicker, }: any) => {
  const isDark = theme === "dark";
  const { t, lang } = useI18n();
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
  const fuzzTime = (timeStr: string, id: number) => {
    if (!stealthMode) return timeStr;
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return timeStr; // fallback for strings like "Yesterday"
    let h = parseInt(match[1]);
    let m = parseInt(match[2]);
    const offset = (id % 11) - 5; // -5 to +5
    m += offset;
    if (m < 0) {
      m += 60;
      h = (h - 1 + 24) % 24;
    } else if (m >= 60) {
      m -= 60;
      h = (h + 1) % 24;
    }
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

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
      const dateLabel = formatDateLabel(firstMsg.time, lang)
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
            ? "bg-[var(--app-surface-bg)] shadow-[0_32px_64px_rgba(0,0,0,0.8),_inset_0_1.5px_2px_rgba(255,255,255,0.05),_inset_0_-2px_4px_rgba(0,0,0,0.9)] border border-orange-500/10"
            : "bg-[var(--bg-elevated)] shadow-[0_32px_64px_rgba(165,175,190,0.8),_inset_1.5px_1.5px_3px_rgba(255,255,255,1)] border border-white"
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

        {/* Media Tabs & Filters */}
        {showMediaPanel && (
        <div className={`px-3 sm:px-5 pt-3 sm:pt-4 pb-2 flex flex-col gap-2 overflow-x-auto scrollbar-none bg-[var(--bg-secondary)]/60`} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
          {/* Filter buttons row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              title={t('chat.filters.button')}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] font-bold whitespace-nowrap transition-colors ${showFilterMenu ? (isDark ? "bg-orange-500 text-white" : "bg-orange-500 text-white") : (isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500")}`}
            >
              <ListFilter size={14} />
            </button>
            {(filterBySender || filterStartDate || filterEndDate) && (
        <button
               onClick={() => { setFilterBySender(""); setFilterStartDate(""); setFilterEndDate(""); }}
               className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap transition-colors bg-red-500/20 text-red-400`}
             >
                {t('chat.filters.clear')}
              </button>
            )}
            <div className={`ml-auto text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]`}>
              {t('chat.filters.items', { count: mediaItems.length })}
            </div>
          </div>
          
          {/* Filter menu */}
          {showFilterMenu && (
            <div className={`space-y-2 pb-2 border-b border-[var(--border-color)]`}>
              {/* Sender filter */}
              <div className="flex items-center gap-1 sm:gap-2">
                <span className={`text-[10px] font-bold uppercase text-[var(--text-secondary)]`}>{t('chat.filters.from')}</span>
                <button onClick={() => setFilterBySender("")} className={`px-2 py-0.5 rounded-full text-[10px] ${filterBySender === '' ? (isDark ? "bg-green-500 text-white" : "bg-green-500 text-white") : (isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500")}`}>{t('chat.filters.all')}</button>
                <button onClick={() => setFilterBySender('me')} className={`px-2 py-0.5 rounded-full text-[10px] ${filterBySender === 'me' ? (isDark ? "bg-green-500 text-white" : "bg-green-500 text-white") : (isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500")}`}>{t('chat.filters.me')}</button>
                <button onClick={() => setFilterBySender('them')} className={`px-2 py-0.5 rounded-full text-[10px] ${filterBySender === 'them' ? (isDark ? "bg-green-500 text-white" : "bg-green-500 text-white") : (isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500")}`}>{t('chat.filters.others')}</button>
              </div>
              
              {/* Date filter */}
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold uppercase text-[var(--text-secondary)]`}>{t('chat.filters.from')}</span>
                <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className={`text-[10px] text-[var(--text-primary)] bg-transparent outline-none`} />
                <span className={`text-[10px] text-[var(--text-tertiary)]`}>{t('chat.filters.to')}</span>
                <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className={`text-[10px] text-[var(--text-primary)] bg-transparent outline-none`} />
              </div>
            </div>
          )}
          
          {/* Media Tabs */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: t('chat.filters.mediaTabs.all') },
              { id: 'photos', label: t('chat.filters.mediaTabs.photos') },
              { id: 'audio', label: t('chat.filters.mediaTabs.audio') },
              { id: 'links', label: t('chat.filters.mediaTabs.links') },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMediaTab(tab.id as any)}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-bold whitespace-nowrap transition-colors ${mediaTab === tab.id ? (isDark ? "bg-orange-500 text-white" : "bg-orange-500 text-white shadow-md") : (isDark ? "bg-white/5 text-gray-400 hover:text-white" : "bg-black/5 text-slate-500 hover:text-slate-800")}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        )}

        {showMediaPanel && mediaItems.length > 0 && (
          <div className="px-3 sm:px-5 pb-2 sm:pb-3 overflow-x-auto scrollbar-none" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
            <div className="flex gap-3">
              {mediaItems.slice(0, 6).map((msg: any) => (
                <div
                   key={msg.id}
                   className={`w-[90px] h-[64px] sm:w-[110px] sm:h-[78px] md:w-[120px] md:h-[84px] rounded-2xl overflow-hidden flex-shrink-0 relative cursor-pointer border border-[var(--border-color)] bg-[var(--bg-elevated)]`}
                   onClick={() => {
                     if (msg.type === 'image' && (msg.attachment || msg.url)) {
                       setActivePhotoUrl(msg.attachment || msg.url);
                       setPhotoOpen(true);
                     }
                   }}
                 >
                  {msg.type === 'image' ? (
                    <img src={msg.attachment || msg.url} alt="media" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : msg.type === 'audio' ? (
                    <div className={`w-full h-full flex flex-col items-start justify-between p-3 bg-[var(--bg-secondary)]`}>
                      <Mic size={18} className={isDark ? "text-orange-400" : "text-orange-600"} />
                      <div className={`text-[11px] font-bold text-[var(--text-primary)]`}>{t('chat.filters.voiceNote')}</div>
                      <div className={`text-[10px] text-[var(--text-secondary)]`}>{msg.duration || '0:00'}</div>
                    </div>
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center p-3 text-center text-[11px] bg-[var(--bg-secondary)] text-[var(--text-secondary)]`}>
                      <span className="break-all line-clamp-3">{msg.text}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
            const bubbleCornerClass = (() => {
              if (isMe) {
                if (gp === 'single') return 'rounded-xl rounded-br-sm'
                if (gp === 'first') return 'rounded-t-xl rounded-bl-xl rounded-br-xl rounded-bl-sm'
                if (gp === 'middle') return 'rounded-l-xl rounded-r-xl rounded-br-xl rounded-bl-xl'
                if (gp === 'last') return 'rounded-tl-xl rounded-tr-xl rounded-br-sm rounded-bl-xl'
                return 'rounded-xl rounded-br-sm'
              } else {
                if (gp === 'single') return 'rounded-xl rounded-bl-sm'
                if (gp === 'first') return 'rounded-t-xl rounded-br-xl rounded-br-sm rounded-bl-xl'
                if (gp === 'middle') return 'rounded-r-xl rounded-l-xl rounded-bl-xl rounded-br-xl'
                if (gp === 'last') return 'rounded-tr-xl rounded-tl-xl rounded-bl-sm rounded-br-xl'
                return 'rounded-xl rounded-bl-sm'
              }
            })()
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
                               ? "bg-[var(--bg-tertiary)] text-gray-300 border border-white/5 shadow-[0_2px_4px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.03)]"
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
                            loading="lazy" decoding="async"
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
                                 loading="lazy" decoding="async"
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
                            <img src={stickerSrc} alt="Sticker" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" loading="lazy" decoding="async" />
                          ) : (
                            <span className="text-4xl">{msg.text}</span>
                          )}
                        </div>
                      )}
                      {msg.type === "image" && (
                        <div className={`mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]`}>
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
                        <div className={`mt-2 p-2 rounded-xl border text-[11px] bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)]`}>
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
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 bg-[var(--bg-elevated)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-[var(--border-color)]`}
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
                        {fuzzTime(msg.time, msg.id)}
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
                            className={`flex items-center gap-1 mt-2 -mb-1 px-1 py-1 rounded-lg cursor-pointer hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-max`}
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
                        className={`opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center shadow-md z-10 shrink-0 border border-black/5`}
                        onClick={() => setActiveReactionPicker(activeReactionPicker === msg.id ? null : msg.id)}
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
                             <div 
                                key={emoji}
                                className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-white/20 rounded-full transition-colors text-lg"
                                onClick={() => handleReactionMessage(msg.id, emoji)}
                             >
                                {emoji}
                             </div>
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
                                     isDark ? "bg-[var(--bg-tertiary)] text-gray-300 border-white/5 hover:border-white/20 hover:bg-[var(--bg-elevated)]" : "bg-white text-slate-700 border-black/5 hover:bg-slate-50 hover:border-black/10"
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
                       ? "bg-[var(--bg-tertiary)] text-gray-400 border-gray-600 rounded-br-sm"
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

        {/* Input area */}
         {chat.isChannel ? (
           <div className={`px-4 pb-3 pt-1`}>
             <button
               onClick={() => {
                 setChannels && setChannels((prev: any) => prev.map((c: any) => c.id === chat.id ? { ...c, isMuted: !chat.isMuted } : c));
                 if (onAction) onAction("MUTE_TOGGLE");
               }}
               className={`w-full py-3 rounded-xl flex items-center justify-center cursor-pointer transition-colors font-medium text-sm tracking-wide bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] text-[var(--accent)] border-[var(--border-color)]`}
             >
               {chat.isMuted ? t('chat.filters.unmuteChannel') : t('chat.filters.muteChannel')}
             </button>
           </div>
         ) : (
           <>
             {eShowSchedulePopup && (
                <div className={`mx-2 sm:mx-3 mb-2 p-2 sm:p-3 rounded-xl flex flex-col gap-2 bg-[var(--bg-primary)] border-[var(--border-color)]`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-orange-500">{t('chat.scheduleSend')}</span>
                    <X size={16} className={`cursor-pointer ${isDark ? "text-gray-400 hover:text-white" : "text-slate-400 hover:text-slate-800"}`} onClick={() => setShowSchedulePopupFn2(false)} />
                  </div>
                   <input type="datetime-local" value={eScheduleDateTime} onChange={(e) => setScheduleDtFn2(e.target.value)} className={`w-full outline-none text-sm p-2 rounded-lg ${isDark ? "bg-[var(--bg-tertiary)] text-white" : "bg-slate-50 text-slate-800"}`} />
                  <div className="flex gap-2">
                    <button onClick={() => { setScheduleDtFn2(""); setShowSchedulePopupFn2(false); }} className={`flex-1 py-2 text-xs font-bold rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]`}>{t('common.cancel')}</button>
                    <button onClick={() => setShowSchedulePopupFn2(false)} disabled={!eScheduleDateTime} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${!eScheduleDateTime ? "opacity-50 cursor-not-allowed" : ""} bg-[var(--accent-soft)] text-[var(--accent)]`}>{t('chat.setTime')}</button>
                  </div>
                </div>
              )}
              {eIsRecordingVoice ? (
                <div className="px-3 pb-2">
                  <LiveVoiceRecorder
                    isDark={isDark}
                    onCancel={() => setIsRecordingVoiceFn2(false)}
                    onReRecord={() => setIsRecordingVoiceFn2(true)}
                    onPermissionDenied={(msg: string) => { setIsRecordingVoiceFn2(false); setVoiceNoteErrFn2(msg); }}
                    onSend={(url, dur) => { setIsRecordingVoiceFn2(false); if (sendVoiceMessage) sendVoiceMessage(url, dur); else setVoiceNoteErrFn2(""); }}
                    holdToRecord
                  />
                </div>
              ) : null}
             <div className={`flex items-center gap-2 px-2 sm:px-3 pb-3 pt-1`}>
                {!eIsRecordingVoice && (
                  <>
                    <div className="relative group">
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => { handleImageAttach(e, chat, onUpdateChat, eSilentMode); e.target.value = ''; }} />
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 relative z-0 bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]`}><Plus size={16} /></div>
                    </div>
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${eScheduleDateTime ? (isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600") : (isDark ? "bg-[var(--app-surface-bg)] text-gray-400 hover:text-white hover:bg-white/5" : "bg-[var(--bg-elevated)] text-slate-500 hover:text-slate-800 hover:bg-slate-200")}`} onClick={() => setShowSchedulePopupFn2(!eShowSchedulePopup)}><Clock size={16} /></div>
                     <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${eShowStickerPicker ? (isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600") : (isDark ? "bg-[var(--app-surface-bg)] text-gray-400 hover:text-white hover:bg-white/5" : "bg-[var(--bg-elevated)] text-slate-500 hover:text-slate-800 hover:bg-slate-200")}`} onClick={() => setShowStickerPickerFn2(!eShowStickerPicker)}><Smile size={16} /></div>
                  </>
                )}
                <div className={`flex-1 min-w-0 h-11 sm:h-12 rounded-full px-3 sm:px-4 flex items-center relative bg-[var(--bg-secondary)] border-[var(--border-color)] shadow-[var(--shadow-neu-inset)]`}>
                   <input type="text" value={eMsgText} onChange={(e) => setMsgTextFn(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder={eMorseMode ? t('chat.morsePlaceholder') : t('chat.messagePlaceholder')} className={`w-full bg-transparent border-none outline-none text-[13px] sm:text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]`} style={{ ...(eMorseMode ? { fontFamily: 'monospace', color: 'var(--player-progress-orange)', filter: 'saturate(0.8)' } : {}) }} />
                  <div className="absolute right-2 flex items-center gap-1">
                    <div title={t('chat.silentMessage')} onClick={() => { setSilentModeFn2(!eSilentMode); }} className={`px-1.5 py-1 rounded-full flex items-center justify-center cursor-pointer transition-colors ${eSilentMode ? (isDark ? "text-blue-400" : "text-blue-500") : (isDark ? "text-gray-600 hover:text-gray-400" : "text-slate-400 hover:text-slate-600")}`}><BellOff size={12} /></div>
                    <div title={t('chat.toggleMorseEncoder')} onClick={() => { setMorseModeFn2(!eMorseMode); }} className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-mono font-bold cursor-pointer transition-colors ${eMorseMode ? (isDark ? "bg-amber-500 text-white" : "bg-amber-500 text-white") : (isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/5 text-slate-400")}`}>M</div>
                  </div>
                </div>
                <div
                  title={eMsgText ? (eScheduleDateTime ? t('chat.scheduleSend') : t('chat.sendMessage')) : t('chat.holdToRecordVoiceNote')}
                  onClick={() => { if (eMsgText) sendMessage(); else { setVoiceNoteErrFn2(""); setIsRecordingVoiceFn2(true); } }}
                  onPointerDown={() => { if (!eMsgText) { setVoiceNoteErrFn2(""); setIsRecordingVoiceFn2(true); } }}
                  onContextMenu={(e) => e.preventDefault()}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 active:scale-95 select-none ${eScheduleDateTime && eMsgText ? (isDark ? "bg-blue-600 text-white" : "bg-blue-500 text-white") : (eMsgText ? (isDark ? "bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]" : "bg-gradient-to-tr from-orange-400 to-orange-300 text-orange-950") : (isDark ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"))}`}
                >
                  {eMsgText ? (eScheduleDateTime ? <Clock size={16} /> : <ChevronRight size={18} />) : <Mic size={18} />}
                </div>
              </div>
              {eReplyTarget && (
               <div className={`mx-2 sm:mx-3 mb-1 px-2 sm:px-3 py-2 rounded-xl border-l-2 flex items-start justify-between gap-1.5 sm:gap-2 bg-[var(--bg-secondary)]/80 border-[var(--accent)]/60 text-[var(--text-primary)]`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold opacity-70">
                      <ChevronRight size={10} className="rotate-180" />
                      {t('chat.replyingTo')} {eReplyTarget.sender === "me" ? t('chat.yourMessage') : eReplyTarget.sender}
                    </div>
                    <div className="text-[12px] truncate mt-0.5">{eReplyTarget.text || (eReplyTarget.type === "audio" ? `${t('chat.voiceNote')} ${eReplyTarget.duration || ""}` : eReplyTarget.type === "image" ? t('chat.photoAttachment') : t('chat.attachment'))}</div>
                  </div>
                  <button onClick={() => setLocalReplyTarget(null)} className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-90 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]`}>
                    <X size={14} strokeWidth={2} />
                  </button>
                </div>
              )}
              {eVoiceNoteError && (
                <div className={`mx-3 text-[11px] px-3 py-2 rounded-xl bg-red-500/10 text-red-300 border-red-500/20`}>
                  {eVoiceNoteError}
                </div>
              )}
              {eMorseMode && eMsgText && (
               <div className="mx-2 sm:mx-3 px-3 sm:px-5 pt-1 pb-1 font-mono text-[9.5px] sm:text-[10.5px] text-amber-500/80 tracking-widest break-all">
                  {encodeMorse(eMsgText)}
                </div>
              )}
              {eShowStickerPicker && (
                <div className="animate-fade-in">
                  <StickerPicker theme={theme} onSelect={(sticker: string) => { if (sendStickerMessage) sendStickerMessage(sticker); setShowStickerPickerFn2(false); }} onClose={() => setShowStickerPickerFn2(false)} />
                </div>
              )}
           </>
         )}
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
