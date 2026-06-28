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
import { FormattedText } from "./FormattedText";
import { Tooltip } from "./Tooltip";
import { useAppStore } from "../store";
import { useI18n } from "../lib/i18n";
import { useDebounce } from "../hooks/useDebounce";
import { VirtualizedMessageList } from "./chat/VirtualizedMessageList";
import { getICQStickerSrc } from "../lib/icqEmojis";
import { toast } from "sonner";
import { ContactProfileModal, type ContactProfile } from "./ContactProfileModal";
import { ChatHeader } from "./chat-preview/ChatHeader";
import { SearchBar } from "./chat-preview/SearchBar";
import { ReactionPicker } from "./chat-preview/ReactionPicker";
import { MessageActions } from "./chat-preview/MessageActions";
import { InputFooter } from "./chat-preview/InputFooter";
import { SavedMessagesPanel } from "./chat-preview/SavedMessagesPanel";

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

function formatDateLabel(timeStr: string): string {
  const match = timeStr.match(/(\d{1,2}):(\d{2})/)
  if (!match) return timeStr
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(match[1]), parseInt(match[2]))
  const diffDays = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: now.getFullYear() !== d.getFullYear() ? 'numeric' : undefined })
}

export const ChatPreviewLayer = ({ chat, theme, onClose, onAction, onCall, onVideoCall, onMessage, onUpdateChat, onReply, savedMessages = [], onToggleSavedMessage, deliveryReceipts = true, readReceipts = true, setEditingContact }: any) => {
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
        className={`absolute inset-0 w-full h-full rounded-[48px] flex flex-col overflow-hidden z-50 ${
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

        {/* Media Tabs & Filters */}
        {showMediaPanel && (
        <div className={`px-5 pt-4 pb-2 flex flex-col gap-2 overflow-x-auto scrollbar-none ${isDark ? "bg-[#1a1d24]/60" : "bg-[#f4f7f9]/60"}`} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
          {/* Filter buttons row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              title={t('chat.filters.button')}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold whitespace-nowrap transition-colors ${showFilterMenu ? (isDark ? "bg-orange-500 text-white" : "bg-orange-500 text-white") : (isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500")}`}
            >
              <ListFilter size={14} />
            </button>
            {(filterBySender || filterStartDate || filterEndDate) && (
              <button
                onClick={() => { setFilterBySender(""); setFilterStartDate(""); setFilterEndDate(""); }}
                className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-500"}`}
              >
                {t('chat.filters.clear')}
              </button>
            )}
            <div className={`ml-auto text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-gray-500" : "text-slate-400"}`}>
              {t('chat.filters.items', { count: mediaItems.length })}
            </div>
          </div>
          
          {/* Filter menu */}
          {showFilterMenu && (
            <div className={`space-y-2 pb-2 border-b ${isDark ? "border-white/5" : "border-black/5"}`}>
              {/* Sender filter */}
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('chat.filters.from')}</span>
                <button onClick={() => setFilterBySender("")} className={`px-2 py-0.5 rounded-full text-[10px] ${filterBySender === '' ? (isDark ? "bg-green-500 text-white" : "bg-green-500 text-white") : (isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500")}`}>{t('chat.filters.all')}</button>
                <button onClick={() => setFilterBySender('me')} className={`px-2 py-0.5 rounded-full text-[10px] ${filterBySender === 'me' ? (isDark ? "bg-green-500 text-white" : "bg-green-500 text-white") : (isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500")}`}>{t('chat.filters.me')}</button>
                <button onClick={() => setFilterBySender('them')} className={`px-2 py-0.5 rounded-full text-[10px] ${filterBySender === 'them' ? (isDark ? "bg-green-500 text-white" : "bg-green-500 text-white") : (isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500")}`}>{t('chat.filters.others')}</button>
              </div>
              
              {/* Date filter */}
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('chat.filters.from')}</span>
                <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className={`text-[10px] ${isDark ? "text-white bg-transparent" : "text-slate-700 bg-transparent"} outline-none`} />
                <span className={`text-[10px] ${isDark ? "text-gray-500" : "text-slate-400"}`}>{t('chat.filters.to')}</span>
                <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className={`text-[10px] ${isDark ? "text-white bg-transparent" : "text-slate-700 bg-transparent"} outline-none`} />
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
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${mediaTab === tab.id ? (isDark ? "bg-orange-500 text-white" : "bg-orange-500 text-white shadow-md") : (isDark ? "bg-white/5 text-gray-400 hover:text-white" : "bg-black/5 text-slate-500 hover:text-slate-800")}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        )}

        {showMediaPanel && mediaItems.length > 0 && (
          <div className="px-5 pb-3 overflow-x-auto scrollbar-none" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
            <div className="flex gap-3">
              {mediaItems.slice(0, 6).map((msg: any) => (
                <div
                  key={msg.id}
                  className={`w-[120px] h-[84px] rounded-2xl overflow-hidden flex-shrink-0 relative cursor-pointer border ${isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-white"}`}
                  onClick={() => {
                    if (msg.type === 'image' && (msg.attachment || msg.url)) {
                      setActivePhotoUrl(msg.attachment || msg.url);
                      setPhotoOpen(true);
                    }
                  }}
                >
                  {msg.type === 'image' ? (
                    <img src={msg.attachment || msg.url} alt="media" className="w-full h-full object-cover" />
                  ) : msg.type === 'audio' ? (
                    <div className={`w-full h-full flex flex-col items-start justify-between p-3 ${isDark ? "bg-[#1a1d24]" : "bg-slate-50"}`}>
                      <Mic size={18} className={isDark ? "text-orange-400" : "text-orange-600"} />
                      <div className={`text-[11px] font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{t('chat.filters.voiceNote')}</div>
                      <div className={`text-[10px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{msg.duration || '0:00'}</div>
                    </div>
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center p-3 text-center text-[11px] ${isDark ? "bg-[#1a1d24] text-gray-300" : "bg-white text-slate-600"}`}>
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
          items={flatItems}
          estimateSize={72}
          overscan={3}
          isDark={isDark}
          className="p-6"
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
                if (gp === 'single') return 'rounded-[20px] rounded-br-sm'
                if (gp === 'first') return 'rounded-t-[20px] rounded-bl-[20px] rounded-br-[20px] rounded-bl-sm'
                if (gp === 'middle') return 'rounded-l-[20px] rounded-r-[20px] rounded-br-[20px] rounded-bl-[20px]'
                if (gp === 'last') return 'rounded-tl-[20px] rounded-tr-[20px] rounded-br-sm rounded-bl-[20px]'
                return 'rounded-[20px] rounded-br-sm'
              } else {
                if (gp === 'single') return 'rounded-[20px] rounded-bl-sm'
                if (gp === 'first') return 'rounded-t-[20px] rounded-br-[20px] rounded-br-sm rounded-bl-[20px]'
                if (gp === 'middle') return 'rounded-r-[20px] rounded-l-[20px] rounded-bl-[20px] rounded-br-[20px]'
                if (gp === 'last') return 'rounded-tr-[20px] rounded-tl-[20px] rounded-bl-sm rounded-br-[20px]'
                return 'rounded-[20px] rounded-bl-sm'
              }
            })()
            return (
              <motion.div
                layout
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex flex-col w-full group relative ${isMe ? "items-end" : "items-start"} ${msg._isLastInGroup !== false ? "mb-4" : "mb-1"}`}
              >
                 <div className={`flex items-center relative gap-2 max-w-[100%] ${isMe ? "justify-end flex-row-reverse" : "justify-start"}`}>
                    <div
                       className={`max-w-[80%] md:max-w-[80%] sm:max-w-[85%] ${msg.type ? "p-2" : "p-3.5"} text-[14px] leading-relaxed break-words relative ${bubbleCornerClass} ${
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
                           className="rounded-[14px] overflow-hidden mb-1 relative border border-white/10 cursor-pointer"
                           onClick={() => { setActivePhotoUrl(msg.attachment || msg.url); setPhotoOpen(true); }}
                        >
                          <img
                            src={msg.attachment || msg.url}
                            alt="Shared"
                            className="w-full h-auto object-cover max-h-[220px]"
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
                            className="w-[200px] h-[120px] object-cover opacity-80"
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
                            <img src={stickerSrc} alt="Sticker" className="w-24 h-24 object-contain" />
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
                        <div className={`mt-2 p-2 rounded-2xl border text-[11px] ${isDark ? "bg-white/5 border-white/10 text-gray-300" : "bg-slate-50 border-black/5 text-slate-600"}`}>
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
                        {fuzzTime(msg.time, msg.id)}
                        {isMe && (
                          !deliveryReceipts ? (
                            <Check size={12} strokeWidth={2.5} />
                          ) : msg.status === "sent" ? (
                            <Check size={12} strokeWidth={2.5} />
                          ) : msg.status === "delivered" ? (
                            <CheckCheck size={12} strokeWidth={2.5} />
                          ) : readReceipts ? (
                            <CheckCheck size={12} strokeWidth={2.5} className={isDark ? "text-blue-400" : "text-blue-500"} />
                          ) : (
                            <CheckCheck size={12} strokeWidth={2.5} />
                          )
                        )}
                      </div>
                      )}

                      {msg._isLastInGroup && (
                      <div className={`mt-2 flex items-center gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                        {!chat.isChannel && (
                          <button
                            onClick={() => onReply?.(msg)}
                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full transition-colors ${
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
                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full transition-colors flex items-center gap-1 ${
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
                        className={`opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${isDark ? "bg-[#2a2d36] text-gray-400 hover:text-white" : "bg-white text-slate-400 hover:text-slate-800"} w-8 h-8 rounded-full flex items-center justify-center shadow-md z-10 shrink-0 border border-black/5`}
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
          {chatScheduledMessages.length > 0 && (
          <div className="px-6 pb-4">
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
                  className={`max-w-[80%] p-3.5 rounded-[20px] text-[14px] shadow-sm border border-dashed relative leading-relaxed overflow-hidden break-words ${
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

        {/* Input or Channel Footer */}
        <InputFooter
          isDark={isDark}
          isChannel={chat.isChannel}
          isMuted={chat.isMuted}
          t={t}
          onMuteToggle={() => {
            setChannels(prev => prev.map(c => c.id === chat.id ? { ...c, isMuted: !chat.isMuted } : c) as any);
            if (onAction) onAction("MUTE_TOGGLE");
          }}
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
