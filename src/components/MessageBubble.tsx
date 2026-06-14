import React, { memo } from 'react';
import { motion } from 'motion/react';
import { BellOff, Check, CheckCheck, Mic, Play, Bookmark, Plus, ChevronRight } from 'lucide-react';
import { FormattedText } from './FormattedText';
import { VoiceWaveform } from './VoiceWaveform';

interface MessageBubbleProps {
  msg: any;
  isMe: boolean;
  isDark: boolean;
  fuzzTime: (time: string, id: number) => string;
  onReply?: (msg: any) => void;
  onToggleSavedMessage?: (chat: any, msg: any) => void;
  togglePinMessage: (msg: any) => void;
  isPinned: (id: any) => boolean;
  onPhotoOpen: (url: string) => void;
  onVideoOpen: () => void;
  chat: any;
  t: (key: string, vars?: any) => string;
  searchQuery: string;
  deliveryReceipts: boolean;
  readReceipts: boolean;
  chatSavedMessages: any[];
  AVAILABLE_EMOJIS: string[];
  activeReactionPicker: any;
  setActiveReactionPicker: (v: any) => void;
  handleReactionMessage: (id: any, emoji: string) => void;
  showFullPicker: boolean;
  setShowFullPicker: (v: boolean) => void;
  EmojiPickerComponent: any;
  activeReactionDetail: any;
  setActiveReactionDetail: (v: any) => void;
  threadReplies: any[];
  expandedThreads: Set<any>;
  toggleThread: (id: any) => void;
  threadData: any;
  onAction?: (text: string) => void;
  setActivePostId: (id: any) => void;
  setShowComments: (v: boolean) => void;
  setActivePhotoUrl: (url: string) => void;
  setPhotoOpen: (v: boolean) => void;
  onSetVideoOpen: (v: boolean) => void;
  onSetActiveReactionDetail: (v: any) => void;
}

export const MessageBubble = memo(function MessageBubble({
  msg, isMe, isDark, fuzzTime, onReply, onToggleSavedMessage,
  togglePinMessage, isPinned, onPhotoOpen, onVideoOpen, chat, t,
  searchQuery, deliveryReceipts, readReceipts, chatSavedMessages,
  AVAILABLE_EMOJIS, activeReactionPicker, setActiveReactionPicker,
  handleReactionMessage, showFullPicker, setShowFullPicker,
  EmojiPickerComponent, activeReactionDetail, setActiveReactionDetail,
  threadReplies, expandedThreads, toggleThread, threadData,
  onAction, setActivePostId, setShowComments,
  setActivePhotoUrl, setPhotoOpen, onSetVideoOpen, onSetActiveReactionDetail,
}: MessageBubbleProps) {
  const renderReactions = () => {
    if (!msg.reactions || Object.keys(msg.reactions).filter((k: string) => msg.reactions[k] > 0).length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-1 z-10 relative">
        {Object.entries(msg.reactions).filter(([, count]) => Number(count) > 0).map(([emoji, count]) => {
          const reactors = (msg.reactors || {})[emoji] || [];
          return (
            <div key={emoji} className="relative">
              <div
                onClick={() => setActiveReactionDetail(
                  activeReactionDetail?.msgId === msg.id && activeReactionDetail?.emoji === emoji
                    ? null : { msgId: msg.id, emoji }
                )}
                className={`rounded-full px-2 py-0.5 text-[12px] shadow-sm flex items-center cursor-pointer select-none border transition-colors ${
                  isDark ? 'bg-[#1a1d24] text-gray-300 border-white/5' : 'bg-white text-slate-700 border-black/5'
                }`}
              >
                {emoji}
                <span className={`ml-1.5 text-[11px] font-bold ${isDark ? 'opacity-60' : 'opacity-80'}`}>{String(count)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderReplyThread = () => {
    if (threadReplies.length === 0) return null;
    return (
      <div className={`mt-3 ml-3 pl-3 border-l-2 ${isDark ? 'border-orange-500/40' : 'border-orange-400'}`}>
        <div
          onClick={() => toggleThread(msg.id)}
          className={`flex items-center gap-2 mb-2 cursor-pointer select-none ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <ChevronRight size={14} className={`transition-transform ${expandedThreads.has(msg.id) ? 'rotate-90' : ''}`} />
          <span className="text-[11px] font-bold uppercase tracking-widest">
            {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col w-full mb-4 group relative ${isMe ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-center relative gap-2 max-w-[100%] ${isMe ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
        <div
          className={`max-w-[80%] md:max-w-[80%] sm:max-w-[85%] ${msg.type ? 'p-2' : 'p-3.5'} rounded-[20px] text-[14px] shadow-md relative leading-relaxed break-words ${
            isMe
              ? isDark
                ? 'bg-orange-600/20 text-orange-50 border border-orange-500/30 rounded-br-sm'
                : 'bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-br-sm'
              : isDark
                ? 'bg-[#1a1d24] text-gray-300 border border-white/5 rounded-bl-sm'
                : 'bg-white text-slate-700 border border-black/5 rounded-bl-sm'
          }`}
        >
          {msg.type === 'image' && (
            <div className="rounded-[14px] overflow-hidden mb-1 relative border border-white/10 cursor-pointer"
              onClick={() => { setActivePhotoUrl(msg.attachment || msg.url); setPhotoOpen(true); }}>
              <img src={msg.attachment || msg.url} alt="" className="w-full h-auto object-cover max-h-[220px]" />
            </div>
          )}
          {msg.type === 'video' && (
            <div className="rounded-[14px] overflow-hidden mb-1 relative border border-white/10 group cursor-pointer" onClick={onVideoOpen}>
              <img src={msg.thumb} alt="" className="w-[200px] h-[120px] object-cover opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play size={20} className="text-white fill-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-white">{msg.duration}</div>
            </div>
          )}
          {msg.type === 'audio' && <VoiceWaveform duration={msg.duration} isMe={isMe} isDark={isDark} audioUrl={msg.audioUrl} />}
          {msg.type === 'image' && (
            <div className={`mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${isDark ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-slate-500'}`}>
              <span>Photo</span>
              {msg.attachment && <span className="opacity-70">Ready</span>}
            </div>
          )}
          {msg.replyTo && (
            <div className={`mb-2 px-3 py-2 rounded-xl border-l-2 text-[12px] ${isDark ? 'bg-white/5 border-orange-400 text-gray-300' : 'bg-black/5 border-orange-500 text-slate-600'}`}>
              <div className="font-bold text-[10px] uppercase tracking-widest opacity-70 mb-1">
                Replying to {msg.replyTo.sender === 'me' ? 'yourself' : msg.replyTo.sender}
              </div>
              <div className="line-clamp-2">{msg.replyTo.text || (msg.replyTo.type === 'audio' ? 'Voice note' : 'Attachment')}</div>
            </div>
          )}
          {msg.type === 'sticker' && msg.text ? (
            msg.text.endsWith('.gif') ? (
              <img src={`/ICQ/${((s: any) => s === 'dark' ? 'hd_dark_skin' : 'hd_light_skin')(typeof window !== 'undefined' ? localStorage.getItem('icq_emoji_skin') : null)}/${msg.text}`}
                alt="" className="w-[80px] h-[80px] object-contain" />
            ) : (
              <span className="text-4xl block px-2 pb-1">{msg.text}</span>
            )
          ) : msg.text && msg.type !== 'sticker' && (
            <span className={msg.type ? 'px-2 pb-1 block' : ''}>
              <FormattedText text={msg.text} searchTerm={searchQuery} />
            </span>
          )}
          {msg.text && typeof msg.text === 'string' && /https?:\/\/[^\s]+/i.test(msg.text) && (
            <div className={`mt-2 p-2 rounded-2xl border text-[11px] ${isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-slate-50 border-black/5 text-slate-600'}`}>
              <div className="font-bold uppercase tracking-widest text-[9px] opacity-70 mb-1">Link Preview</div>
              <div className="break-all line-clamp-2">{msg.text.match(/https?:\/\/[^\s]+/i)?.[0]}</div>
            </div>
          )}
          <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-bold tracking-wide opacity-70 ${msg.type ? 'px-2' : ''}`}>
            {msg.silent && <BellOff size={10} className="mr-0.5 opacity-60" />}
            {fuzzTime(msg.time, msg.id)}
            {isMe && (
              !deliveryReceipts ? <Check size={12} strokeWidth={2.5} />
              : msg.status === 'sent' ? <Check size={12} strokeWidth={2.5} />
              : msg.status === 'delivered' ? <CheckCheck size={12} strokeWidth={2.5} />
              : readReceipts ? <CheckCheck size={12} strokeWidth={2.5} className={isDark ? 'text-blue-400' : 'text-blue-500'} />
              : <CheckCheck size={12} strokeWidth={2.5} />
            )}
          </div>
          <div className={`mt-2 flex items-center gap-2 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>
            <button onClick={() => onReply?.(msg)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full transition-colors ${
                isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 hover:bg-black/5'
              }`}>Reply</button>
            <button onClick={() => onToggleSavedMessage?.(chat, msg)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full transition-colors flex items-center gap-1 ${
                isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 hover:bg-black/5'
              }`}>
              <Bookmark size={10} />
              {chatSavedMessages.some((s: any) => s.messageId === msg.id) ? 'Saved' : 'Save'}
            </button>
            <button onClick={() => togglePinMessage(msg)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full transition-colors flex items-center gap-1 ${
                isPinned(msg.id) ? (isDark ? 'text-orange-400 bg-orange-500/10' : 'text-orange-600 bg-orange-500/10')
                : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 hover:bg-black/5'
              }`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill={isPinned(msg.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              {isPinned(msg.id) ? 'Pinned' : 'Pin'}
            </button>
          </div>
          {chat.isChannel && (
            <div
              onClick={() => { setActivePostId(msg.id); setShowComments(true); }}
              className={`flex items-center gap-1 mt-2 -mb-1 px-1 py-1 rounded-lg cursor-pointer ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-black/5 text-slate-500'} transition-colors w-max`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span className="text-[11px] font-medium tracking-wide">
                {msg.id === 402 ? '45 replies' : 'Leave a comment'}
              </span>
            </div>
          )}
        </div>
      </div>
      {renderReactions()}
      {renderReplyThread()}
    </div>
  );
});
