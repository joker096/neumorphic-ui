import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { BellOff, ChevronLeft, ChevronRight, Clock, Mic, Plus, Smile, X } from "lucide-react";
import { LiveVoiceRecorder } from "./LiveVoiceRecorder";
import { useI18n } from "../../lib/i18n";
import { encodeMorse } from "./MorseDecoder";
import { StickerPicker } from "../chat/StickerPicker";

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
}

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
}: ChatInputOverlayProps) => {
  const { t } = useI18n();

  return (
    <div className="absolute bottom-0 left-0 right-0 md:static md:bottom-auto md:left-auto md:right-auto md:rounded-b-[48px] md:border-none md:bg-transparent md:shadow-none md:z-0 z-60 chat-input-overlay" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="p-3 flex flex-col gap-2">
      <AnimatePresence>
        {showSchedulePopup && !activeChat.isChannel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full p-4 rounded-md flex flex-col gap-3 neu-card"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">{t('chat.scheduleSend')}</span>
              <X size={16} className="cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]" onClick={() => { setShowSchedulePopup(false); setScheduleDateTime(""); }} />
            </div>
           <input
              type="datetime-local"
              value={scheduleDateTime}
              onChange={(e) => setScheduleDateTime(e.target.value)}
              className="w-full outline-none text-sm p-2 rounded-lg neu-inset-field"
            />
           <div className="flex gap-2">
              <button onClick={() => { setScheduleDateTime(''); setShowSchedulePopup(false); }} className="flex-1 py-2 text-xs font-bold rounded-lg transition-colors bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">{t('common.cancel')}</button>
              <button onClick={() => setShowSchedulePopup(false)} disabled={!scheduleDateTime} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${!scheduleDateTime ? "opacity-50 cursor-not-allowed" : ""} bg-[var(--accent-soft)] text-[var(--accent)]`}>{t('chat.setTime')}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeChat.isChannel ? (
        <div className="w-full py-2.5 rounded-md flex items-center justify-center cursor-pointer transition-colors font-medium text-sm tracking-wide neu-button" onClick={() => {
          setActiveChat({ ...activeChat, isMuted: !activeChat.isMuted });
          setChannels(prev => prev.map(c => c.id === activeChat.id ? { ...c, isMuted: !activeChat.isMuted } : c) as any);
        }}>
          {activeChat.isMuted ? t('chat.filters.unmuteChannel') : t('chat.filters.muteChannel')}
        </div>
      ) : isRecordingVoice ? (
        <LiveVoiceRecorder
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
            <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 relative z-0 neu-button"><Plus size={18} /></div>
          </div>

          <div title={t('chat.scheduleMessage')} onClick={() => setShowSchedulePopup(!showSchedulePopup)} className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${scheduleDateTime ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'} active:scale-95`}>
            <Clock size={18} />
          </div>

           <div title={t('stickers.title')} onClick={() => setShowStickerPicker(!showStickerPicker)} className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${showStickerPicker ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'} active:scale-95`}>
              <Smile size={16} />
          </div>

          <div className="flex-1 min-w-0 h-12 rounded-full px-4 flex items-center relative neu-inset-field">
            <input type="text" value={messageText} onChange={e => { setMessageText(e.target.value); if (activeChat) setDraftTextByChat(prev => ({ ...prev, [String(activeChat.id)]: e.target.value })); }} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={morseMode ? t('chat.morsePlaceholder') : t('chat.messagePlaceholder')} className={`w-full bg-transparent border-none outline-none text-[14px] neu-input ${morseMode ? "font-mono text-amber-500" : ""}`} />
            <div className="absolute right-2 flex items-center gap-1">
              <div title={t('chat.silentMessage')} onClick={() => setSilentMode(!silentMode)} className={`px-2 py-1.5 rounded-full flex items-center justify-center cursor-pointer transition-colors ${silentMode ? 'text-blue-500' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                <BellOff size={14} />
              </div>
              <div title={t('chat.toggleMorseEncoder')} onClick={() => setMorseMode(!morseMode)} className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold cursor-pointer transition-colors ${morseMode ? 'bg-amber-500 text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>M</div>
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
            className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 active:scale-95 select-none ${scheduleDateTime && messageText ? 'bg-blue-500 text-white shadow-md' : messageText ? 'bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-[var(--accent-soft)] text-[var(--accent)]'}`}
          >
            {messageText ? (scheduleDateTime ? <Clock size={18} /> : <ChevronRight size={20} />) : <Mic size={20} />}
          </div>
          {replyTarget && (
            <div className="mt-1 px-3 py-2 rounded-md border-l-2 flex items-start justify-between gap-2 bg-[var(--bg-secondary)]/80 border-orange-400/60 text-[var(--text-primary)]">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold opacity-70">
                  <ChevronLeft size={10} />
                  {t('chat.replyingTo')} {replyTarget.sender === "me" ? t('chat.yourMessage') : replyTarget.sender}
                </div>
                <div className="text-[12px] truncate mt-0.5">{replyTarget.text || (replyTarget.type === "audio" ? `${t('chat.voiceNote')} ${replyTarget.duration || ""}` : replyTarget.type === "image" ? t('chat.photoAttachment') : t('chat.attachment'))}</div>
              </div>
              <button onClick={() => setReplyTarget(null)} className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-90 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10">
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      )}
      {voiceNoteError && (
        <div className="text-[11px] px-3 py-2 rounded-md bg-red-500/10 text-red-300 border border-red-500/20">
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
    </div>
  );
};
