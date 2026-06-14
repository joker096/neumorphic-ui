import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, Shield, ChevronRight, Phone, Video, Bookmark, MoreVertical, Plus, Mic, Play, BellOff, Check, CheckCheck, Clock, Trash2 } from "lucide-react";
import { useAppStore } from "../store";
import { ContactProfileModal, ContactProfile } from "./ContactProfileModal";
import { Tooltip } from "./Tooltip";
import { FormattedText } from "./FormattedText";
import { VoiceWaveform } from "./VoiceWaveform";
import { VideoPlayerOverlay } from "./VideoPlayerOverlay";
import { PhotoViewerOverlay } from "./PhotoViewer";
import { ChannelCommentsView } from "./ChannelCommentsView";
import { EmojiPicker } from "./EmojiPicker";
import { toast } from "sonner";
import { useI18n } from '@/lib/i18n';
import { useLongPress } from '../lib/gestures/useLongPress';
import { ContextMenu } from './ui/ContextMenu';
import { Copy, Reply, Forward } from 'lucide-react';

export const ChatPreviewLayer = ({ chat, theme, onClose, onAction, onCall, onMessage, onUpdateChat, onReply, savedMessages = [], onToggleSavedMessage, deliveryReceipts = true, readReceipts = true, onEditChannel }: any) => {
  const isDark = theme === "dark";
  const { stealthMode, scheduledQueue, setActiveCall, setChats, setChannels } = useAppStore();
  const { t } = useI18n();
  const [videoOpen, setVideoOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
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
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [activeReactionDetail, setActiveReactionDetail] = useState<{ msgId: string | number; emoji: string } | null>(null);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [contextMenuMsg, setContextMenuMsg] = useState<{ id: number; x: number; y: number } | null>(null);

  const togglePinMessage = (msg: any) => {
    setPinnedMessages(prev => {
      const exists = prev.find(m => m.id === msg.id);
      if (exists) return prev.filter(m => m.id !== msg.id);
      return [msg, ...prev];
    });
  };

  const isPinned = (msgId: string | number) => pinnedMessages.some(m => m.id === msgId);
  
  const AVAILABLE_EMOJIS = ["👍", "❤️", "😂", "🔥", "😢", "🎉"];

  const handleReactionMessage = (msgId: string | number, emoji: string) => {
     const updatedChat = {
        ...chat,
        history: (chat.history || []).map((m: any) => {
           if (m.id === msgId) {
              const currentReactions = m.reactions || {};
              const currentReactors = m.reactors || {};
              const existing = currentReactions[emoji] || 0;
              const reactorList = currentReactors[emoji] || [];
              const myName = "Me";
              const alreadyReacted = reactorList.includes(myName);
              return {
                 ...m,
                 reactions: {
                    ...currentReactions,
                    [emoji]: alreadyReacted ? existing - 1 : existing + 1
                 },
                 reactors: {
                    ...currentReactors,
                    [emoji]: alreadyReacted
                       ? reactorList.filter((n: string) => n !== myName)
                       : [...reactorList, myName]
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

  const filteredHistory =
    chat.history?.filter(
      (msg: any) => {
        // Apply sender filter
        if (filterBySender === 'me' && msg.sender !== 'me') return false;
        if (filterBySender === 'them' && msg.sender === 'me') return false;
        
        // Apply date filters
        if (filterStartDate || filterEndDate) {
          const msgDate = new Date(chat.history?.findIndex((m: any) => m.id === msg.id) * 86400000 + Date.now());
          if (filterStartDate && msgDate < new Date(filterStartDate)) return false;
          if (filterEndDate && msgDate > new Date(filterEndDate)) return false;
        }
        
        // Apply text search
        const matchesSearch = searchQuery ? msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) || !msg.text : true;
        
        return matchesSearch;
      },
    ) || [];

  // --- Reply Threads ---
  const [expandedThreads, setExpandedThreads] = useState<Set<string | number>>(new Set());
  const threadData = useMemo(() => {
    const threadMap = new Map<string | number, any[]>();
    const replyMsgIds = new Set<string | number>();
    const orderMap = new Map(filteredHistory.map((m: any, i: number) => [m.id, i]));

    filteredHistory.forEach((msg: any) => {
      const parentId = msg.replyTo?.id;
      if (parentId != null) {
        if (!threadMap.has(parentId)) threadMap.set(parentId, []);
        threadMap.get(parentId)!.push(msg);
        replyMsgIds.add(msg.id);
      }
    });
    // Sort replies by original order
    threadMap.forEach((replies) => {
      replies.sort((a, b) => Number(orderMap.get(a.id) ?? 0) - Number(orderMap.get(b.id) ?? 0));
    });
    return { threadMap, parentIds: new Set(threadMap.keys()), replyMsgIds };
  }, [filteredHistory]);

  const toggleThread = (id: string | number) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const mediaItems = (chat.history || []).filter((msg: any) => {
    // Apply sender filter to media items too
    if (filterBySender === 'me' && msg.sender !== 'me') return false;
    if (filterBySender === 'them' && msg.sender === 'me') return false;
    
    // Apply text search to media items
    if (searchQuery && !msg.text?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    if (mediaTab === 'photos') return msg.type === 'image';
    if (mediaTab === 'audio') return msg.type === 'audio';
    if (mediaTab === 'links') return typeof msg.text === 'string' && /https?:\/\//i.test(msg.text);
    return msg.type === 'image' || msg.type === 'audio' || (typeof msg.text === 'string' && /https?:\/\//i.test(msg.text));
  });

  const chatSavedMessages = savedMessages.filter((saved: any) => saved.chatId === chat.id);

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
        {/* Header */}
        <div
          className={`p-5 pb-4 flex items-center gap-4 relative z-10 ${isDark ? "bg-[#1a1d24]/90 border-b border-white/5 backdrop-blur-md" : "bg-[#f4f7f9]/90 border-b border-black/5 backdrop-blur-md"}`}
        >
          {/* Button Back */}
          <div
            onClick={onClose}
            className={`cursor-pointer w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
              isDark
                ? "bg-[#13151b] hover:bg-[#20242e] text-gray-400 shadow-[0_4px_8px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/[0.02]"
                : "bg-[#eaeff4] hover:bg-white text-slate-500 shadow-[-2px_-2px_6px_rgba(255,255,255,0.9),_4px_4px_8px_rgba(165,175,190,0.4),_inset_1px_1px_2px_rgba(255,255,255,1)]"
            }`}
          >
            <ChevronRight size={22} className="rotate-180" strokeWidth={2} />
          </div>

          {/* Avatar mini */}
          <div
            onClick={() => {
              setSelectedContact({
                id: `hash_${chat.id}`,
                name: chat.name,
                color: chat.color,
                lastSeen: chat.online ? 0 : Date.now() - 3600000
              });
            }}
            className={`w-11 h-11 cursor-pointer rounded-full bg-gradient-to-br flex-shrink-0 ${chat.color} flex items-center justify-center text-white font-bold text-lg shadow-sm relative transition-all active:scale-95`}
          >
            {chat.name.charAt(0)}
            {chat.online && (
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-[12px] h-[12px] rounded-full border-[2px] ${isDark ? "bg-green-400 border-[#1a1d24]" : "bg-emerald-500 border-[#f4f7f9]"}`}
              />
            )}
            <div className={`absolute -top-1 -right-1 rounded-full w-4 h-4 flex items-center justify-center border-[2px] ${isDark ? "border-[#1a1d24] bg-[#ff6b6b]" : "border-[#f4f7f9] bg-rose-500"}`} title={t('chat.selfDestructActive')}>
              <span className="text-[7px] text-white font-bold tracking-tighter">1h</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <span
              className={`font-bold text-[15px] truncate leading-tight flex items-center gap-1.5 ${isDark ? "text-white drop-shadow-sm" : "text-slate-800"}`}
            >
              {chat.name}
              <div title={t('chat.e2eEncrypted')} className="flex items-center justify-center">
                 <Shield size={12} className={isDark ? "text-orange-400" : "text-emerald-500"} />
              </div>
            </span>
            <span
              className={`text-[11px] mt-0.5 font-bold tracking-wider uppercase ${isDark ? "text-orange-400" : "text-orange-600"}`}
            >
              {t(chat.online ? 'chat.online' : 'chat.offline')}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <div
              onClick={() => setShowSearch(!showSearch)}
              title={t('chat.searchMessages')}
              className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${isDark ? "hover:bg-white/5 text-gray-400 hover:text-white" : "hover:bg-black/5 text-slate-400 hover:text-slate-800"} ${showSearch ? (isDark ? "bg-white/10 text-white" : "bg-black/10 text-slate-800") : ""}`}
            >
              <Search size={18} />
            </div>
            {!chat.isChannel && (
              <div
                title={t('chat.startAudioCall')}
                onClick={() => setActiveCall({ number: chat.name || t('chat.unknownCall'), startTime: Date.now(), isMuted: false, isSpeaker: false })}
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 active:scale-95 ${isDark ? "hover:bg-white/5 text-gray-400 hover:text-white" : "hover:bg-black/5 text-slate-400 hover:text-slate-800"}`}
              >
                <Phone size={18} />
              </div>
            )}
            {!chat.isChannel && (
              <div
                title={t('chat.savedMessages')}
                onClick={() => setShowSavedPanel(true)}
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 relative ${isDark ? "hover:bg-white/5 text-gray-400 hover:text-white" : "hover:bg-black/5 text-slate-400 hover:text-slate-800"}`}
              >
                <Bookmark size={18} />
                {chatSavedMessages.length > 0 && (
                  <span className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${isDark ? "bg-orange-500 text-white" : "bg-orange-500 text-white"}`}>
                    {chatSavedMessages.length}
                  </span>
                )}
              </div>
            )}
            {!chat.isChannel && (
              <div
                title={t('chat.clearChatHistory')}
                onClick={() => {
                   setChats(prevChats => prevChats.map(c => c.id === chat.id ? { ...c, history: [] } : c));
                   onClose();
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 active:scale-95 ${isDark ? "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white" : "bg-black/5 hover:bg-black/10 text-slate-400 hover:text-slate-800"}`}
              >
                <Trash2 size={18} />
              </div>
            )}
            {!chat.isChannel && (
              <div
                title={t('chat.startVideoCall')}
                onClick={() => setVideoOpen(true)}
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${isDark ? "hover:bg-white/5 text-gray-400 hover:text-white" : "hover:bg-black/5 text-slate-400 hover:text-slate-800"}`}
              >
                <Video size={20} />
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`px-5 relative z-10 overflow-hidden ${isDark ? "bg-[#1a1d24]/90 border-b border-white/5 backdrop-blur-md" : "bg-[#f4f7f9]/90 border-b border-black/5 backdrop-blur-md"}`}
            >
              <div className="py-2.5">
                <div
                  className={`w-full h-10 rounded-full px-4 flex items-center ${
                    isDark
                      ? "bg-[#13151b] border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                      : "bg-[#eaeff4] border border-black/5 shadow-[inset_2px_2px_4px_rgba(165,175,190,0.3),_inset_-1px_-1px_2px_rgba(255,255,255,1)]"
                  }`}
                >
                  <Search
                    size={16}
                    className={`mr-2 shrink-0 ${isDark ? "text-gray-500" : "text-slate-400"}`}
                  />
                  <input
                    type="text"
                    placeholder={t('chat.searchInChat')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full bg-transparent border-none outline-none text-[13.5px] font-medium ${isDark ? "text-white placeholder:text-gray-500" : "text-slate-700 placeholder:text-slate-400"}`}
                  />
                  {searchQuery && (
                    <div
                      onClick={() => setSearchQuery("")}
                      className={`ml-2 shrink-0 cursor-pointer w-6 h-6 flex items-center justify-center rounded-full ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/10 text-slate-500"}`}
                    >
                      <X size={14} strokeWidth={2.5} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media Tabs & Filters */}
        <div className={`px-5 pt-4 pb-2 flex flex-col gap-2 overflow-x-auto scrollbar-none ${isDark ? "bg-[#1a1d24]/60" : "bg-[#f4f7f9]/60"}`} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
          {/* Filter buttons row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${showFilterMenu ? (isDark ? "bg-orange-500 text-white" : "bg-orange-500 text-white") : (isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500")}`}
            >
              {t(filterBySender || filterStartDate || filterEndDate ? 'chat.filtersOn' : 'chat.filters')}
            </button>
            {(filterBySender || filterStartDate || filterEndDate) && (
              <button
                onClick={() => { setFilterBySender(""); setFilterStartDate(""); setFilterEndDate(""); }}
                className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-500"}`}
              >
                {t('chat.clear')}
              </button>
            )}
            <div className={`ml-auto text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-gray-500" : "text-slate-400"}`}>
              {t('chat.items', { count: mediaItems.length })}
            </div>
          </div>
          
          {/* Filter menu */}
          {showFilterMenu && (
            <div className={`space-y-2 pb-2 border-b ${isDark ? "border-white/5" : "border-black/5"}`}>
              {/* Sender filter */}
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('chat.from')}</span>
                <button onClick={() => setFilterBySender("")} className={`px-2 py-0.5 rounded-full text-[10px] ${filterBySender === '' ? (isDark ? "bg-green-500 text-white" : "bg-green-500 text-white") : (isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500")}`}>{t('chat.all')}</button>
                <button onClick={() => setFilterBySender('me')} className={`px-2 py-0.5 rounded-full text-[10px] ${filterBySender === 'me' ? (isDark ? "bg-green-500 text-white" : "bg-green-500 text-white") : (isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500")}`}>{t('chat.me')}</button>
                <button onClick={() => setFilterBySender('them')} className={`px-2 py-0.5 rounded-full text-[10px] ${filterBySender === 'them' ? (isDark ? "bg-green-500 text-white" : "bg-green-500 text-white") : (isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500")}`}>{t('chat.others')}</button>
              </div>
              
              {/* Date filter */}
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('chat.from')}</span>
                <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className={`text-[10px] ${isDark ? "text-white bg-transparent" : "text-slate-700 bg-transparent"} outline-none`} />
                <span className={`text-[10px] ${isDark ? "text-gray-500" : "text-slate-400"}`}>{t('chat.to')}</span>
                <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className={`text-[10px] ${isDark ? "text-white bg-transparent" : "text-slate-700 bg-transparent"} outline-none`} />
              </div>
            </div>
          )}
          
          {/* Media Tabs */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: t('chat.media') },
              { id: 'photos', label: t('chat.photos') },
              { id: 'audio', label: t('chat.voiceNotes') },
              { id: 'links', label: t('chat.links') },
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

        {mediaItems.length > 0 && (
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
                    <img src={msg.attachment || msg.url} alt={t('chat.mediaAlt')} className="w-full h-full object-cover" />
                  ) : msg.type === 'audio' ? (
                    <div className={`w-full h-full flex flex-col items-start justify-between p-3 ${isDark ? "bg-[#1a1d24]" : "bg-slate-50"}`}>
                      <Mic size={18} className={isDark ? "text-orange-400" : "text-orange-600"} />
                      <div className={`text-[11px] font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{t('chat.voiceNoteLabel')}</div>
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

        {/* Pinned Messages Bar */}
        {pinnedMessages.length > 0 && (
          <div className={`px-6 py-2 border-b shrink-0 ${isDark ? "border-white/5 bg-[#1a1d24]/80" : "border-black/5 bg-white/80"}`}>
            <div className="flex items-center gap-2 mb-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isDark ? "text-orange-400" : "text-orange-600"}>
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <span className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-orange-400" : "text-orange-600"}`}>
                {t('chat.pinned')} ({pinnedMessages.length})
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {pinnedMessages.slice(0, 3).map((pinned: any) => (
                <div key={pinned.id} className={`flex items-center gap-2 py-1 px-2 rounded-lg text-xs ${isDark ? "bg-white/5 text-gray-300" : "bg-black/5 text-slate-600"}`}>
                  <span className="font-bold shrink-0">{pinned.sender === "me" ? t('chat.you') : pinned.sender}:</span>
                  <span className="line-clamp-1">{pinned.text || (pinned.type === "image" ? t('slideup.photo') : pinned.type === "audio" ? t('chat.pinnedVoice') : t('slideup.attachment'))}</span>
                  <button
                    onClick={() => togglePinMessage(pinned)}
                    className={`ml-auto shrink-0 text-[9px] font-bold uppercase tracking-widest ${isDark ? "text-gray-500 hover:text-white" : "text-slate-400 hover:text-slate-800"}`}
                  >
                    {t('chat.unpin')}
                  </button>
                </div>
              ))}
              {pinnedMessages.length > 3 && (
                <div className={`text-[10px] font-bold ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                  {t('chat.morePinned', { n: pinnedMessages.length - 3 })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden p-6 flex flex-col gap-6 relative z-0 ${isDark ? "scrollbar-dark" : "scrollbar-light"}`}
        >
        <AnimatePresence mode="popLayout">
          {filteredHistory.filter((msg: any) => !threadData.replyMsgIds.has(msg.id)).map((msg: any) => {
            const isMe = msg.sender === "me";
            const threadReplies = threadData.threadMap.get(msg.id) || [];
            return (
              <motion.div
                layout
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                {...useLongPress({
                  duration: 500,
                  onLongPress: (pos) => setContextMenuMsg({ id: msg.id, x: pos.clientX, y: pos.clientY }),
                  onClick: () => {},
                })}
                onContextMenu={(e: React.MouseEvent) => {
                  e.preventDefault();
                  setContextMenuMsg({ id: msg.id, x: e.clientX, y: e.clientY });
                }}
                className={`flex flex-col w-full mb-4 group relative ${isMe ? "items-end" : "items-start"}`}
              >
                 <div className={`flex items-center relative gap-2 max-w-[100%] ${isMe ? "justify-end flex-row-reverse" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] md:max-w-[80%] sm:max-w-[85%] ${msg.type ? "p-2" : "p-3.5"} rounded-[20px] text-[14px] shadow-md relative leading-relaxed break-words ${
                        isMe
                          ? isDark
                            ? "bg-orange-600/20 text-orange-50 border border-orange-500/30 rounded-br-sm shadow-[0_8px_16px_rgba(249,115,22,0.1),_inset_0_1px_1px_rgba(255,255,255,0.05)]"
                            : "bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-br-sm shadow-[0_8px_16px_rgba(249,115,22,0.3),_inset_0_2px_4px_rgba(255,255,255,0.3)]"
                          : isDark
                            ? "bg-[#1a1d24] text-gray-300 border border-white/5 rounded-bl-sm shadow-[0_8px_16px_rgba(0,0,0,0.4),_inset_0_1px_2px_rgba(255,255,255,0.02)]"
                            : "bg-white text-slate-700 border border-black/5 rounded-bl-sm shadow-[0_8px_16px_rgba(165,175,190,0.2)]"
                      }`}
                    >
                      {msg.type === "image" && (
                        <div 
                           className="rounded-[14px] overflow-hidden mb-1 relative border border-white/10 cursor-pointer"
                           onClick={() => { setActivePhotoUrl(msg.attachment || msg.url); setPhotoOpen(true); }}
                        >
                          <img
                            src={msg.attachment || msg.url}
                            alt={t('chat.sharedAlt')}
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
                            alt={t('chat.videoThumbnailAlt')}
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
                      {msg.type === "image" && (
                        <div className={`mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500"}`}>
                          <span>{t('chat.photo')}</span>
                          {msg.attachment && <span className="opacity-70">{t('chat.ready')}</span>}
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
                            {t('chat.replyingTo')}{msg.replyTo.sender === "me" ? t('chat.replyingToYourself') : msg.replyTo.sender}
                          </div>
                          <div className="line-clamp-2">{msg.replyTo.text || (msg.replyTo.type === "audio" ? t('chat.voiceNote', { duration: msg.replyTo.duration || '' }) : t('chat.attachment'))}</div>
                        </div>
                      )}
                      {msg.type === "sticker" && msg.text ? (
                        msg.text.endsWith(".gif") ? (
                          <img
                            src={`/ICQ/${(() => { const s = typeof window !== 'undefined' ? localStorage.getItem('icq_emoji_skin') : null; return s === 'dark' ? 'hd_dark_skin' : 'hd_light_skin'; })()}/${msg.text}`}
                            alt={msg.text.replace('.gif','')}
                            className="w-[80px] h-[80px] object-contain"
                          />
                        ) : (
                          <span className="text-4xl block px-2 pb-1">{msg.text}</span>
                        )
                      ) : msg.text && msg.type !== "sticker" && (
                        <span className={msg.type ? "px-2 pb-1 block" : ""}>
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
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-bold tracking-wide opacity-70 ${isMe && !isDark ? "text-orange-100" : ""} ${msg.type ? "px-2" : ""}`}
                      >
                        {msg.silent && <BellOff size={10} className="mr-0.5 opacity-60" />}
                        {fuzzTime(msg.time, msg.id)}
                        {chat.isChannel && msg.views !== undefined && (
                           <span className={`ml-1 flex items-center gap-0.5 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                 <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                 <circle cx="12" cy="12" r="3"/>
                              </svg>
                              {msg.views}
                           </span>
                        )}
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
                      
                      <div className={`mt-2 flex items-center gap-2 flex-wrap ${isMe ? "justify-end" : "justify-start"}`}>
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
                        {!chat.isChannel && (
                          <button
                            onClick={() => togglePinMessage(msg)}
                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full transition-colors flex items-center gap-1 ${
                              isPinned(msg.id)
                                ? isDark ? "text-orange-400 bg-orange-500/10" : "text-orange-600 bg-orange-500/10"
                                : isDark ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-800 hover:bg-black/5"
                            }`}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill={isPinned(msg.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                            {isPinned(msg.id) ? t('chat.pinned') : t('chat.pin')}
                          </button>
                        )}
                      </div>

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
                              {msg.id === 402 ? t('comments.replies', { count: 45 }) : t('comments.leaveComment')}
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
                    {activeReactionPicker === msg.id && !showFullPicker && (
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
                          <div className="w-px h-6 bg-white/10 mx-1 self-center" />
                          <div 
                             className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-white/20 rounded-full transition-colors text-sm text-white/70"
                             onClick={(e) => { e.stopPropagation(); setShowFullPicker(true); }}
                             title={t('chat.moreEmoji')}
                          >
                             ➕
                          </div>
                       </motion.div>
                    )}
                    {activeReactionPicker === msg.id && showFullPicker && (
                       <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "right-[calc(100%+0px)]" : "left-[calc(100%+0px)]"} z-30`}
                       >
                          <EmojiPicker
                             isDark={isDark}
                             onSelect={(emoji) => {
                                handleReactionMessage(msg.id, emoji);
                                setShowFullPicker(false);
                             }}
                             onClose={() => setShowFullPicker(false)}
                          />
                       </motion.div>
                    )}
                    </AnimatePresence>
                 </div>

{/* Summary bar for Reactions */}
                   {msg.reactions && Object.keys(msg.reactions).filter(k => msg.reactions[k] > 0).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1 z-10 relative">
                         {Object.entries(msg.reactions).filter(([, count]) => Number(count) > 0).map(([emoji, count]) => {
                            const reactors = (msg.reactors || {})[emoji] || [];
                            return (
                               <div key={emoji} className="relative">
                                  <div 
                                     className={`rounded-full px-2 py-0.5 text-[12px] shadow-sm flex items-center cursor-pointer select-none border transition-colors ${
                                        isDark ? "bg-[#1a1d24] text-gray-300 border-white/5 hover:border-white/20 hover:bg-[#20242e]" : "bg-white text-slate-700 border-black/5 hover:bg-slate-50 hover:border-black/10"
                                     }`}
                                     onClick={() => {
                                        setActiveReactionDetail(
                                           activeReactionDetail?.msgId === msg.id && activeReactionDetail?.emoji === emoji
                                              ? null : { msgId: msg.id, emoji }
                                        );
                                     }}
                                  >
                                     {emoji}
                                     <span className={`ml-1.5 text-[11px] font-bold ${isDark ? "opacity-60" : "opacity-80"}`}>{String(count)}</span>
                                  </div>
                                  <AnimatePresence>
                                     {activeReactionDetail?.msgId === msg.id && activeReactionDetail?.emoji === emoji && (
                                        <motion.div
                                           initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                           animate={{ opacity: 1, scale: 1, y: 0 }}
                                           exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                           className={`absolute top-full left-0 mt-1 z-30 min-w-[140px] rounded-xl p-2 shadow-xl ${isDark ? "bg-[#1a1d24] border border-white/10" : "bg-white border border-black/10"}`}
                                        >
                                           <div className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                                              {emoji} {t('chat.reactedBy')}
                                           </div>
                                           {reactors.length > 0 ? reactors.map((name: string, i: number) => (
                                              <div key={i} className={`text-[12px] py-0.5 ${isDark ? "text-gray-300" : "text-slate-700"}`}>
                                                 {name}
                                              </div>
                                           )) : (
                                              <div className={`text-[11px] ${isDark ? "text-gray-500" : "text-slate-400"}`}>{t('chat.noOneYet')}</div>
                                           )}
                                        </motion.div>
                                     )}
                                  </AnimatePresence>
                               </div>
                            );
                         })}
                      </div>
                   )}
                   {/* Reply Thread Section */}
                   {threadReplies.length > 0 && (
                      <div className={`mt-3 ml-3 pl-3 border-l-2 ${isDark ? "border-orange-500/40" : "border-orange-400"}`}>
                         <div
                            className={`flex items-center gap-2 mb-2 cursor-pointer select-none ${isDark ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}
                            onClick={() => toggleThread(msg.id)}
                         >
                            <ChevronRight
                               size={14}
                               className={`transition-transform ${expandedThreads.has(msg.id) ? "rotate-90" : ""}`}
                            />
                            <span className="text-[11px] font-bold uppercase tracking-widest">
                               {threadReplies.length} {threadReplies.length === 1 ? t('chat.replyLabel') : t('chat.repliesLabel')}
                            </span>
                         </div>
                         <AnimatePresence initial={false}>
                         {expandedThreads.has(msg.id) && threadReplies.map((reply: any) => {
                            const isReplyMe = reply.sender === "me";
                            return (
                               <motion.div
                                  key={reply.id}
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className={`mb-2 pl-2 border-l-2 ${isReplyMe ? "border-orange-400" : isDark ? "border-white/10" : "border-black/10"}`}
                               >
                                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isReplyMe ? (isDark ? "text-orange-400" : "text-orange-600") : isDark ? "text-gray-500" : "text-slate-400"}`}>
                                     {isReplyMe ? t('chat.you') : reply.sender}
                                  </div>
                                  {reply.type === "image" && (
                                     <img
                                        src={reply.attachment || reply.url}
                                        alt=""
                                        className="rounded-lg max-h-[120px] w-auto mb-1 cursor-pointer"
                                        onClick={() => { setActivePhotoUrl(reply.attachment || reply.url); setPhotoOpen(true); }}
                                     />
                                  )}
                                  {reply.type === "audio" && (
                                     <VoiceWaveform duration={reply.duration} isMe={isReplyMe} isDark={isDark} audioUrl={reply.audioUrl} />
                                  )}
                                  {reply.text && (
                                     <div className={`text-[13px] ${isDark ? "text-gray-300" : "text-slate-700"}`}>
                                        <FormattedText text={reply.text} searchTerm={searchQuery} />
                                     </div>
                                  )}
                                  <div className={`flex items-center gap-2 mt-1 text-[10px] ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                                     {fuzzTime(reply.time, reply.id)}
                                     {isReplyMe && (
                                        !deliveryReceipts ? <Check size={10} /> :
                                        reply.status === "sent" ? <Check size={10} /> :
                                        reply.status === "delivered" ? <CheckCheck size={10} /> :
                                        readReceipts ? <CheckCheck size={10} className={isDark ? "text-blue-400" : "text-blue-500"} /> :
                                        <CheckCheck size={10} />
                                     )}
                                  </div>
                               </motion.div>
                            );
                         })}
                         </AnimatePresence>
                      </div>
                   )}
                   </motion.div>
             );
           })}
          {scheduledQueue.messages.filter((m: any) => m.chatId === chat.id).map((msg: any) => (
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
        </AnimatePresence>
        </div>

        {/* Input or Channel Footer */}
        <div
          className={`p-5 flex items-center justify-center gap-3 relative z-10 ${isDark ? "bg-[#1a1d24]/90 border-t border-white/5 backdrop-blur-md" : "bg-[#f4f7f9]/90 border-t border-black/5 backdrop-blur-md"}`}
        >
          {chat.isChannel ? (
            <div
               onClick={() => {
                  setChannels(prev => prev.map(c => c.id === chat.id ? { ...c, isMuted: !chat.isMuted } : c) as any);
                  if (onAction) onAction("MUTE_TOGGLE");
               }}
               className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${isDark
                  ? "bg-[#13151b] hover:bg-[#20242e] text-orange-400 shadow-[0_4px_8px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/[0.02]"
                  : "bg-[#eaeff4] hover:bg-white text-orange-600 shadow-[-2px_-2px_6px_rgba(255,255,255,0.9),_4px_4px_8px_rgba(165,175,190,0.4),_inset_1px_1px_2px_rgba(255,255,255,1)]"
               }`}
               title={chat.isMuted ? t('chat.unmuteChannel') : t('chat.muteChannel')}
            >
               <BellOff size={20} />
            </div>
          ) : (
            <>
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
                  isDark
                    ? "bg-[#13151b] hover:bg-[#20242e] text-gray-400 shadow-[0_4px_8px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/[0.02]"
                    : "bg-[#eaeff4] hover:bg-white text-slate-500 shadow-[-2px_-2px_6px_rgba(255,255,255,0.9),_4px_4px_8px_rgba(165,175,190,0.4),_inset_1px_1px_2px_rgba(255,255,255,1)]"
                }`}
              >
                <Plus size={22} />
              </div>
              <div
                className={`flex-1 h-12 rounded-full px-5 flex items-center ${
                  isDark
                    ? "bg-[#13151b] border border-white/5 shadow-[inset_0_4px_8px_rgba(0,0,0,0.8),_0_2px_4px_rgba(255,255,255,0.02)]"
                    : "bg-[#eaeff4] border border-black/5 shadow-[inset_3px_3px_6px_rgba(165,175,190,0.3),_inset_-2px_-2px_4px_rgba(255,255,255,1)]"
                }`}
              >
                <input
                  type="text"
                  placeholder={t('chat.messagePlaceholder')}
                  className={`w-full bg-transparent border-none outline-none text-[14.5px] ${isDark ? "text-white placeholder:text-gray-500" : "text-slate-700 placeholder:text-slate-400"}`}
                />
              </div>
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
                  isDark
                    ? "bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/20 shadow-[0_4px_8px_rgba(249,115,22,0.15)]"
                    : "bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 border border-orange-500/20 shadow-[0_2px_6px_rgba(249,115,22,0.15)]"
                }`}
              >
                <Mic size={20} />
              </div>
            </>
          )}
        </div>
        <ContextMenu
          isOpen={!!contextMenuMsg}
          position={contextMenuMsg ? { x: contextMenuMsg.x, y: contextMenuMsg.y } : { x: 0, y: 0 }}
          items={[
            { label: 'Copy', icon: <Copy size={14} />, onClick: () => {
              if (contextMenuMsg) {
                const msg = chat.history?.find((m: any) => m.id === contextMenuMsg.id);
                if (msg?.text) navigator.clipboard.writeText(msg.text);
              }
            }},
            { label: 'Reply', icon: <Reply size={14} />, onClick: () => {
              if (contextMenuMsg && onReply) {
                const msg = chat.history?.find((m: any) => m.id === contextMenuMsg.id);
                if (msg) onReply(msg);
              }
            }},
            { label: 'Forward', icon: <Forward size={14} />, onClick: () => {
              // Forward is handled elsewhere
            }},
            { label: 'Delete', icon: <Trash2 size={14} />, destructive: true, onClick: () => {
              if (contextMenuMsg) {
                const updatedChat = {
                  ...chat,
                  history: (chat.history || []).filter((m: any) => m.id !== contextMenuMsg.id),
                };
                onUpdateChat?.(updatedChat);
                setChats(prev => prev.map((c: any) => c.id === chat.id ? updatedChat : c));
              }
            }},
          ]}
          onClose={() => setContextMenuMsg(null)}
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
      <AnimatePresence>
        {showSavedPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSavedPanel(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-[760px] max-h-[78%] rounded-t-[32px] overflow-hidden border-t border-x ${isDark ? "bg-[#13151b] border-white/10" : "bg-[#f4f7f9] border-black/5"} shadow-2xl`}
            >
              <div className={`p-4 flex items-center justify-between ${isDark ? "border-b border-white/5" : "border-b border-black/5"}`}>
                <div>
                  <div className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-orange-400" : "text-orange-600"}`}>{t('chat.savedMessages')}</div>
                  <div className={`text-sm mt-1 ${isDark ? "text-gray-300" : "text-slate-600"}`}>{t('chat.savedItems', { n: chatSavedMessages.length, chatName: chat.name })}</div>
                </div>
                <button
                  onClick={() => setShowSavedPanel(false)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${isDark ? "bg-white/5 text-gray-300" : "bg-white text-slate-500 border border-black/5"}`}
                >
                  <X size={16} />
                </button>
              </div>
              <div className={`p-4 overflow-y-auto max-h-[calc(78vh-76px)] ${isDark ? "scrollbar-dark" : "scrollbar-light"}`}>
                {chatSavedMessages.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {chatSavedMessages.slice().reverse().map((saved: any) => (
                      <div key={saved.key} className={`p-4 rounded-2xl border ${isDark ? "bg-[#1a1d24] border-white/5" : "bg-white border-black/5"}`}>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                            {saved.sourceLabel || chat.name}
                          </div>
                          <button
                            onClick={() => onToggleSavedMessage?.(chat, { id: saved.messageId })}
                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${isDark ? "bg-white/5 text-gray-300" : "bg-slate-100 text-slate-600"}`}
                          >
                            {t('chat.unsave')}
                          </button>
                        </div>
                        <div className={`text-sm ${isDark ? "text-white" : "text-slate-800"}`}>
                          {saved.preview}
                        </div>
                        <div className={`mt-2 text-[10px] font-medium ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                          {saved.time}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`py-12 text-center ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                    {t('chat.noSavedMessages')}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
       <ContactProfileModal 
         contact={selectedContact}
         theme={theme}
         onClose={() => setSelectedContact(null)}
         onCall={() => {
             if (onCall && selectedContact) onCall(selectedContact.name, selectedContact.color);
             setSelectedContact(null);
         }}
         onMessage={() => {
             if (onMessage && selectedContact) onMessage(selectedContact.name, selectedContact.color);
             setSelectedContact(null);
         }}
        onDelete={() => {
            if (chat.isChannel) {
              setChannels((prev: any[]) => prev.filter((c: any) => c.name !== selectedContact?.name));
            } else {
              setChats((prev: any[]) => prev.filter((c: any) => c.name !== selectedContact?.name));
            }
            if (chat.name === selectedContact?.name) onClose?.();
            setSelectedContact(null);
        }}
        onEdit={() => {
            if (chat.isChannel && onEditChannel) {
              onEditChannel(chat);
            } else {
              toast.info(t('chat.contact'), { description: t('contacts.editContactDetails', { name: selectedContact?.name }) });
            }
            setSelectedContact(null);
        }}
        onBlock={() => {
            setChannels((prev: any[]) => prev.filter((c: any) => c.name !== selectedContact?.name));
            if (chat.name === selectedContact?.name) onClose?.();
            setSelectedContact(null);
        }}
      />
    </>
  );
};
