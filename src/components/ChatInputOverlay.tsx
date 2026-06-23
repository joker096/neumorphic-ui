import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BellOff, ChevronRight, Clock, Mic, Plus, Search, Smile, X } from "lucide-react";
import { LiveVoiceRecorder } from "./LiveVoiceRecorder";
import { useI18n } from "../lib/i18n";
import { encodeMorse } from "./MorseDecoder";
import {
  getICQEmojiPath,
  getICQStickerSrc,
  ICQ_EMOJI_MAP,
  CAVEMAN_STICKERS,
  RACOON_STICKERS,
} from "../lib/icqEmojis";

const STICKER_PACKS = [
  { id: 'default', name: 'Default', stickers: ['👍', '❤️', '😂', '🔥', '😢', '🎉', '👋', '💀', '👑', '🔻', '😎', '🥳'] },
  { id: 'animals', name: 'Animals', stickers: ['🐱', '🐶', '🐾', '🦋', '🐮', '🐸'] },
  { id: 'nature', name: 'Nature', stickers: ['🌸', '🌿', '🌺', '🍃', '🌻', '🍀'] },
  { id: 'food', name: 'Food', stickers: ['🍕', '🍔', '🍱', '🍷', '☕', '🍯'] },
  { id: 'caveman', name: 'Caveman', stickers: CAVEMAN_STICKERS.map(sticker => `caveman:${sticker.id}`) },
  { id: 'raccoon', name: 'Raccoon', stickers: RACOON_STICKERS.map(sticker => `raccoon:${sticker.id}`) },
];
const STICKER_EMOJI = ['😀', '😂', '🤣', '🤔', '😍', '😎', '🤖', '🥺', '😱', '🤯', '🫡', '🥳'];

interface ChatInputOverlayProps {
  theme: "light" | "dark";
  activeChat: any;
  messageText: string;
  setMessageText: (text: string) => void;
  scheduleDateTime: string;
  showSchedulePopup: boolean;
  setShowSchedulePopup: (show: boolean) => void;
  setScheduleDateTime: (value: string) => void;
  isRecordingVoice: boolean;
  setIsRecordingVoice: (value: boolean) => void;
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
  setActiveChat: (chat: any) => void;
  setVoiceNoteError: (message: string) => void;
  setSilentMode: (enabled: boolean) => void;
  setMorseMode: (enabled: boolean) => void;
  handleSendMessage: () => void;
  sendVoiceMessage: (audioUrl: string, durationStr: string) => void;
  sendStickerMessage: (sticker: string) => void;
  onScheduleChange: (value: string) => void;
  onToggleMute: () => void;
  onAttachImage: (message: any) => void;
  onToggleSchedulePopup: () => void;
  onToggleSilent: () => void;
  onToggleMorse: () => void;
  onHoldRecord: () => void;
  onReRecord: () => void;
  onPermissionDenied: (message: string) => void;
  onSendVoice: (url: string, duration: string) => void;
  onToggleStickerPicker: () => void;
  onSendSticker: (sticker: string) => void;
  isDark: boolean;
}

const StickerPicker = ({ theme, onSelect, onClose }: { theme: 'light' | 'dark'; onSelect: (emoji: string) => void; onClose: () => void }) => {
  const { t } = useI18n();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  
  const allPacks = [
    { id: 'icq', name: t('stickers.icq'), stickers: ICQ_EMOJI_MAP.map(e => e.id) },
    ...STICKER_PACKS.filter(p => ['caveman', 'raccoon'].includes(p.id)),
    { id: 'emoji', name: t('stickers.emoji'), stickers: STICKER_EMOJI },
  ];
  const filteredPacks = activeTab === 'all' ? allPacks : allPacks.filter(p => p.id === activeTab);
  const visiblePacks = search ? filteredPacks.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : filteredPacks;
  
  return (
    <div className="w-full max-w-full flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        {[{ id: 'all', label: t('stickers.all') }, { id: 'icq', label: t('stickers.icq') }, { id: 'caveman', label: t('stickers.caveman') }, { id: 'raccoon', label: t('stickers.raccoon') }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors shrink-0 ${activeTab === tab.id ? (isDark ? 'bg-orange-500 text-white' : 'bg-orange-500 text-white') : (isDark ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-slate-500')}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="relative">
        <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('stickers.searchPlaceholder')}
          className={`w-full pl-7 pr-4 py-2 rounded-xl text-[12px] outline-none ${isDark ? 'bg-white/5 text-white' : 'bg-black/5 text-slate-800'}`}
        />
      </div>
      
      <div className={`flex flex-col gap-2 max-h-[200px] overflow-y-auto ${isDark ? 'scrollbar-dark' : 'scrollbar-light'}`}>
        {visiblePacks.map(pack => (
          <div key={pack.id} className="flex flex-col gap-1">
            <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{pack.name}</div>
            <div className="flex gap-1 flex-wrap">
              {pack.stickers.map((st, idx) => {
                const stickerSrc = pack.id === 'icq' ? getICQEmojiPath(st, theme) : getICQStickerSrc(st, theme);
                return (
                <button
                  key={`${pack.id}-${idx}`}
                  onClick={() => { onSelect(pack.id === 'icq' ? `icq:${st}` : st); onClose(); }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl hover:scale-110 transition-transform ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                >
                  {stickerSrc ? (
                    <img src={stickerSrc} alt={st} className="w-7 h-7 object-contain" />
                  ) : (
                    st
                  )}
                </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChatInputOverlay = ({
  theme,
  activeChat,
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
  setActiveChat,
  setVoiceNoteError,
  setSilentMode,
  setMorseMode,
  handleSendMessage,
  sendVoiceMessage,
  sendStickerMessage,
  onScheduleChange,
  onToggleMute,
  onAttachImage,
  onToggleSchedulePopup,
  onToggleSilent,
  onToggleMorse,
  onHoldRecord,
  onReRecord,
  onPermissionDenied,
  onSendVoice,
  onToggleStickerPicker,
  onSendSticker,
  isDark,
}: ChatInputOverlayProps) => {
  const { t } = useI18n();

  return (
    <div className={`absolute bottom-4 left-4 right-4 rounded-3xl p-3 flex flex-col gap-2 z-50 ${isDark ? "bg-[#1a1d24]/90 border border-white/10 backdrop-blur-xl" : "bg-white/90 border border-black/10 backdrop-blur-xl shadow-xl"}`}>
                      <AnimatePresence>
                      {showSchedulePopup && !activeChat.isChannel && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className={`w-full p-4 rounded-2xl flex flex-col gap-3 ${isDark ? "bg-[#13151b] border border-white/5" : "bg-white border border-black/5 shadow-sm"}`}
                        >
                           <div className="flex justify-between items-center">
                             <span className="text-xs font-bold uppercase tracking-widest text-orange-500">{t('chat.scheduleSend')}</span>
                             <X size={16} className={`cursor-pointer ${isDark ? "text-gray-400 hover:text-white" : "text-slate-400 hover:text-slate-800"}`} onClick={() => { setShowSchedulePopup(false); setScheduleDateTime(""); }} />
                           </div>
                           <input 
                              type="datetime-local" 
                              value={scheduleDateTime}
                              onChange={(e) => setScheduleDateTime(e.target.value)}
                              className={`w-full outline-none text-sm p-2 rounded-lg ${isDark ? "bg-[#1a1d24] text-white color-scheme-dark" : "bg-slate-50 text-slate-800"}`}
                           />
                           <div className="flex gap-2">
                             <button onClick={() => { setScheduleDateTime(''); setShowSchedulePopup(false); }} className={`flex-1 py-2 text-xs font-bold rounded-lg ${isDark ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-black/5 text-slate-500 hover:bg-black/10"}`}>{t('common.cancel')}</button>
                             <button onClick={() => setShowSchedulePopup(false)} disabled={!scheduleDateTime} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${!scheduleDateTime ? "opacity-50 cursor-not-allowed" : ""} ${isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"}`}>{t('chat.setTime')}</button>
                           </div>
                        </motion.div>
                      )}
                      </AnimatePresence>
                      
                      {activeChat.isChannel ? (
                        <div className={`w-full py-2.5 rounded-2xl flex items-center justify-center cursor-pointer transition-colors font-medium text-sm tracking-wide ${isDark ? "bg-[#13151b] hover:bg-[#20242e] text-orange-400 border border-white/5" : "bg-white hover:bg-slate-50 text-orange-600 border border-black/5 shadow-sm"}`} onClick={() => {
                           setActiveChat({ ...activeChat, isMuted: !activeChat.isMuted });
                           setChannels(prev => prev.map(c => c.id === activeChat.id ? { ...c, isMuted: !activeChat.isMuted } : c) as any);
                        }}>
                           {activeChat.isMuted ? t('chat.filters.unmuteChannel') : t('chat.filters.muteChannel')}
                        </div>
                      ) : isRecordingVoice ? (
<LiveVoiceRecorder 
                             isDark={isDark} 
                             onCancel={() => setIsRecordingVoice(false)}
                              onReRecord={() => { setIsRecordingVoice(true); }}
                             onPermissionDenied={(message) => {
                               setIsRecordingVoice(false);
                               setVoiceNoteError(message);
                             }}
                             holdToRecord
                             onSend={(url, dur) => {
                                setIsRecordingVoice(false);
                                sendVoiceMessage(url, dur);
                                setVoiceNoteError("");
                             }}
                           />
                      ) : (
                        <div className="flex items-center gap-3 w-full">
                         <div title={t('chat.attachFile')} className="relative group">
                              <input 
                                 type="file" 
                                 accept="image/*"
                                 className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                 onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                       const url = URL.createObjectURL(e.target.files[0]);
                                       const newMessage = { id: Date.now(), sender: "me", text: "", type: "image", attachment: url, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: "sent", silent: silentMode };
                                       setChats(prevChats => prevChats.map(c => c.id === activeChat.id ? { ...c, history: [...(c.history || []), newMessage] } : c));
                                       setActiveChat((prev: any) => ({ ...prev, history: [...(prev.history || []), newMessage] }));
                                    }
                                    e.target.value = '';
                                 }}
                              />
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 relative z-0 ${isDark ? "bg-[#13151b] text-gray-400 group-hover:text-white group-hover:bg-white/5" : "bg-[#f4f7f9] text-slate-500 group-hover:text-slate-800 group-hover:bg-slate-200"}`}><Plus size={20} /></div>
                           </div>
                           
                           <div title={t('chat.scheduleMessage')} onClick={() => setShowSchedulePopup(!showSchedulePopup)} className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${scheduleDateTime ? (isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600") : (isDark ? "bg-[#13151b] text-gray-400 hover:text-white hover:bg-white/5" : "bg-[#f4f7f9] text-slate-500 hover:text-slate-800 hover:bg-slate-200")} active:scale-95`}>
                              <Clock size={18} />
                           </div>
                           
                           <div title={t('stickers.title')} onClick={() => setShowStickerPicker(!showStickerPicker)} className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${showStickerPicker ? (isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600") : (isDark ? "bg-[#13151b] text-gray-400 hover:text-white hover:bg-white/5" : "bg-[#f4f7f9] text-slate-500 hover:text-slate-800 hover:bg-slate-200")} active:scale-95`}>
                              <Smile size={18} />
                           </div>
                      
                          <div className={`flex-1 min-w-0 h-12 rounded-full px-4 flex items-center relative ${isDark ? "bg-[#13151b] border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]" : "bg-[#f4f7f9] border border-black/5 shadow-[inset_2px_2px_4px_rgba(165,175,190,0.2)]"}`}>
                            <input type="text" value={messageText} onChange={e => { setMessageText(e.target.value); if (activeChat) setDraftTextByChat(prev => ({ ...prev, [String(activeChat.id)]: e.target.value })); }} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={morseMode ? t('chat.morsePlaceholder') : t('chat.messagePlaceholder')} className={`w-full bg-transparent border-none outline-none text-[14px] ${isDark ? "text-white placeholder:text-gray-500" : "text-slate-700 placeholder:text-slate-400"} ${morseMode ? "font-mono text-amber-500" : ""}`} />
                            <div className="absolute right-2 flex items-center gap-1">
                               <div title={t('chat.silentMessage')} onClick={() => setSilentMode(!silentMode)} className={`px-2 py-1.5 rounded-full flex items-center justify-center cursor-pointer transition-colors ${silentMode ? (isDark ? "text-blue-400" : "text-blue-500") : (isDark ? "text-gray-600 hover:text-gray-400" : "text-slate-400 hover:text-slate-600")}`}>
                                 <BellOff size={14} />
                               </div>
                               <div title={t('chat.toggleMorseEncoder')} onClick={() => setMorseMode(!morseMode)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${morseMode ? (isDark ? "bg-amber-500/20 text-amber-500" : "bg-amber-100 text-amber-700") : (isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/5 text-slate-400")}`}>●●● ─</div>
                            </div>
                          </div>
                          
                          <div
                            title={messageText ? (scheduleDateTime ? t('chat.scheduleSend') : t('chat.sendMessage')) : t('chat.holdToRecordVoiceNote')}
                            onClick={() => messageText ? handleSendMessage() : undefined}
                            onPointerDown={() => {
                              if (!messageText) {
                                setVoiceNoteError("");
                                setIsRecordingVoice(true);
                              }
                            }}
                            onContextMenu={(e) => e.preventDefault()}
                            className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 active:scale-95 select-none ${scheduleDateTime && messageText ? (isDark ? "bg-blue-600 text-white shadow-md" : "bg-blue-500 text-white shadow-md") : (messageText ? (isDark ? "bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]" : "bg-gradient-to-tr from-orange-400 to-orange-300 text-orange-950 shadow-md") : (isDark ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"))}`}>
                            {messageText ? (scheduleDateTime ? <Clock size={18} /> : <ChevronRight size={20} />) : <Mic size={20} />}
                          </div>
                          {replyTarget && (
                            <div className={`mt-1 px-3 py-2 rounded-2xl border-l-2 flex items-start justify-between gap-2 ${isDark ? "bg-[#1a1d24]/80 border-orange-400/60 text-gray-300" : "bg-white/80 border-orange-500 text-slate-700"}`}>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold opacity-70">
                                  <ChevronRight size={10} className="rotate-180" />
                                  {t('chat.replyingTo')} {replyTarget.sender === "me" ? t('chat.yourMessage') : replyTarget.sender}
                                </div>
                                <div className="text-[12px] truncate mt-0.5">{replyTarget.text || (replyTarget.type === "audio" ? `${t('chat.voiceNote')} ${replyTarget.duration || ""}` : replyTarget.type === "image" ? t('chat.photoAttachment') : t('chat.attachment'))}</div>
                              </div>
                              <button onClick={() => setReplyTarget(null)} className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-90 ${isDark ? "text-gray-500 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-800 hover:bg-black/10"}`}>
                                <X size={14} strokeWidth={2} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {voiceNoteError && (
                        <div className={`text-[11px] px-3 py-2 rounded-2xl ${isDark ? "bg-red-500/10 text-red-300 border border-red-500/20" : "bg-red-50 text-red-600 border border-red-200"}`}>
                          {voiceNoteError}
                        </div>
                      )}
                     {morseMode && messageText && !activeChat.isChannel && (
                         <div className="px-5 pt-1 pb-1 font-mono text-[10.5px] text-amber-500/80 tracking-widest break-all">
                           {encodeMorse(messageText)}
                         </div>
                       )}
                       {showStickerPicker && (
                         <div className="animate-fade-in">
                           <StickerPicker theme={theme} onSelect={sendStickerMessage} onClose={() => setShowStickerPicker(false)} />
                         </div>
                       )}
                     </div>
  );
};
