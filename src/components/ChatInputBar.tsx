import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Clock, Smile, BellOff, ChevronRight, Mic, X } from "lucide-react";
import { LiveVoiceRecorder } from "./LiveVoiceRecorder";
import { StickerPicker } from "./StickerPicker";
import { encodeMorse } from "./MorseDecoder";

interface ChatInputBarProps {
  isDark: boolean;
  theme: 'light' | 'dark';
  activeChat: any;
  messageText: string;
  onMessageTextChange: (text: string) => void;
  onSend: () => void;
  onSendVoice: (url: string, dur: string) => void;
  onSendSticker: (sticker: string) => void;
  isRecordingVoice: boolean;
  setIsRecordingVoice: (v: boolean) => void;
  voiceNoteError: string;
  setVoiceNoteError: (v: string) => void;
  showSchedulePopup: boolean;
  setShowSchedulePopup: (v: boolean) => void;
  scheduleDateTime: string;
  setScheduleDateTime: (v: string) => void;
  showStickerPicker: boolean;
  setShowStickerPicker: (v: boolean) => void;
  replyTarget: any;
  setReplyTarget: (v: any) => void;
  silentMode: boolean;
  setSilentMode: (v: boolean) => void;
  morseMode: boolean;
  setMorseMode: (v: boolean) => void;
  onAttachImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMuteToggle: () => void;
  t: (key: string, vars?: any) => string;
}

export const ChatInputBar = ({
  isDark, theme, activeChat,
  messageText, onMessageTextChange, onSend, onSendVoice, onSendSticker,
  isRecordingVoice, setIsRecordingVoice,
  voiceNoteError, setVoiceNoteError,
  showSchedulePopup, setShowSchedulePopup,
  scheduleDateTime, setScheduleDateTime,
  showStickerPicker, setShowStickerPicker,
  replyTarget, setReplyTarget,
  silentMode, setSilentMode,
  morseMode, setMorseMode,
  onAttachImage, onMuteToggle,
  t,
}: ChatInputBarProps) => {
  const isChannel = activeChat?.isChannel;

  return (
    <div className={`absolute bottom-4 left-4 right-4 rounded-3xl p-3 flex flex-col gap-2 z-50 ${isDark ? "bg-[#1a1d24]/90 border border-white/10 backdrop-blur-xl" : "bg-white/90 border border-black/10 backdrop-blur-xl shadow-xl"}`}>
      {showSchedulePopup && !isChannel && (
        <SchedulePopupInline
          isDark={isDark}
          dateTime={scheduleDateTime}
          onDateTimeChange={setScheduleDateTime}
          onSet={() => setShowSchedulePopup(false)}
          onCancel={() => { setScheduleDateTime(''); setShowSchedulePopup(false); }}
          t={t}
        />
      )}

      {isChannel ? (
        <div onClick={onMuteToggle}
          className={`w-11 h-11 mx-auto rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${isDark
            ? "bg-[#13151b] hover:bg-[#20242e] text-orange-400 shadow-[0_4px_8px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/[0.02]"
            : "bg-[#eaeff4] hover:bg-white text-orange-600 shadow-[-2px_-2px_6px_rgba(255,255,255,0.9),_4px_4px_8px_rgba(165,175,190,0.4),_inset_1px_1px_2px_rgba(255,255,255,1)]"
          }`}
          title={activeChat?.isMuted ? t('chat.unmuteChannel') : t('chat.muteChannel')}
        >
          <BellOff size={20} />
        </div>
      ) : isRecordingVoice ? (
        <LiveVoiceRecorder
          isDark={isDark}
          onCancel={() => setIsRecordingVoice(false)}
          onReRecord={() => { setIsRecordingVoice(true); }}
          onPermissionDenied={(message: string) => {
            setIsRecordingVoice(false);
            setVoiceNoteError(message);
          }}
          holdToRecord
          onSend={(url: string, dur: string) => {
            setIsRecordingVoice(false);
            onSendVoice(url, dur);
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
              onChange={onAttachImage}
            />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 relative z-0 ${isDark ? "bg-[#13151b] text-gray-400 group-hover:text-white group-hover:bg-white/5" : "bg-[#f4f7f9] text-slate-500 group-hover:text-slate-800 group-hover:bg-slate-200"}`}><Plus size={20} /></div>
          </div>

          <div title={t('chat.scheduleMessage')} onClick={() => setShowSchedulePopup(!showSchedulePopup)} className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${scheduleDateTime ? (isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600") : (isDark ? "bg-[#13151b] text-gray-400 hover:text-white hover:bg-white/5" : "bg-[#f4f7f9] text-slate-500 hover:text-slate-800 hover:bg-slate-200")} active:scale-95`}>
            <Clock size={18} />
          </div>

          <div title={t('chat.stickers')} onClick={() => setShowStickerPicker(!showStickerPicker)} className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${showStickerPicker ? (isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600") : (isDark ? "bg-[#13151b] text-gray-400 hover:text-white hover:bg-white/5" : "bg-[#f4f7f9] text-slate-500 hover:text-slate-800 hover:bg-slate-200")} active:scale-95`}>
            <Smile size={18} />
          </div>

          <div className={`flex-1 min-w-0 h-12 rounded-full px-4 flex items-center relative ${isDark ? "bg-[#13151b] border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]" : "bg-[#f4f7f9] border border-black/5 shadow-[inset_2px_2px_4px_rgba(165,175,190,0.2)]"}`}>
            <input
              type="text"
              value={messageText}
              onChange={(e) => onMessageTextChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSend()}
              placeholder={morseMode ? t('chat.morsePlaceholder') : t('chat.messagePlaceholder')}
              className={`w-full bg-transparent border-none outline-none text-[14px] ${isDark ? "text-white placeholder:text-gray-500" : "text-slate-700 placeholder:text-slate-400"} ${morseMode ? "font-mono text-amber-500" : ""}`}
            />
            <div className="absolute right-2 flex items-center gap-1">
              <div title={t('chat.silentMessage')} onClick={() => setSilentMode(!silentMode)} className={`px-2 py-1.5 rounded-full flex items-center justify-center cursor-pointer transition-colors ${silentMode ? (isDark ? "text-blue-400" : "text-blue-500") : (isDark ? "text-gray-600 hover:text-gray-400" : "text-slate-400 hover:text-slate-600")}`}>
                <BellOff size={14} />
              </div>
              <div title={t('chat.toggleMorse')} onClick={() => setMorseMode(!morseMode)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${morseMode ? (isDark ? "bg-amber-500/20 text-amber-500" : "bg-amber-100 text-amber-700") : (isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/5 text-slate-400")}`}>●●● ─</div>
            </div>
          </div>

          <div
            title={messageText ? (scheduleDateTime ? t('chat.scheduleSend') : t('chat.sendMessage')) : t('chat.holdToRecord')}
            onClick={() => messageText ? onSend() : undefined}
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
        </div>
      )}

      {replyTarget && (
        <div className={`mt-1 px-3 py-2 rounded-2xl border-l-2 flex items-start justify-between gap-3 ${isDark ? "bg-white/5 border-orange-400 text-gray-300" : "bg-black/5 border-orange-500 text-slate-700"}`}>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest font-bold opacity-70">{t('chat.replyingTo')} {replyTarget.sender === "me" ? t('chat.replyingToYourself') : replyTarget.sender}</div>
            <div className="text-[12px] truncate">{replyTarget.text || (replyTarget.type === "audio" ? t('chat.voiceNote', { duration: replyTarget.duration || '' }) : replyTarget.type === "image" ? t('chat.photoAttachment') : t('chat.attachment'))}</div>
          </div>
          <button onClick={() => setReplyTarget(null)} className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}>{t('chat.cancel')}</button>
        </div>
      )}

      {voiceNoteError && (
        <div className={`text-[11px] px-3 py-2 rounded-2xl ${isDark ? "bg-red-500/10 text-red-300 border border-red-500/20" : "bg-red-50 text-red-600 border border-red-200"}`}>
          {voiceNoteError}
        </div>
      )}

      {morseMode && messageText && !isChannel && (
        <div className="px-5 pt-1 pb-1 font-mono text-[10.5px] text-amber-500/80 tracking-widest break-all">
          {encodeMorse(messageText)}
        </div>
      )}

      {showStickerPicker && (
        <div className="animate-fade-in">
          <StickerPicker theme={theme} onSelect={onSendSticker} onClose={() => setShowStickerPicker(false)} />
        </div>
      )}
    </div>
  );
};

const SchedulePopupInline = ({
  isDark, dateTime, onDateTimeChange, onSet, onCancel, t
}: {
  isDark: boolean;
  dateTime: string;
  onDateTimeChange: (v: string) => void;
  onSet: () => void;
  onCancel: () => void;
  t: (key: string, vars?: any) => string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    className={`w-full p-4 rounded-2xl flex flex-col gap-3 ${isDark ? "bg-[#13151b] border border-white/5" : "bg-white border border-black/5 shadow-sm"}`}
  >
    <div className="flex justify-between items-center">
      <span className="text-xs font-bold uppercase tracking-widest text-orange-500">{t('chat.scheduleSend')}</span>
      <X size={16} className={`cursor-pointer ${isDark ? "text-gray-400 hover:text-white" : "text-slate-400 hover:text-slate-800"}`} onClick={onCancel} />
    </div>
    <input
      type="datetime-local"
      value={dateTime}
      onChange={(e) => onDateTimeChange(e.target.value)}
      className={`w-full outline-none text-sm p-2 rounded-lg ${isDark ? "bg-[#1a1d24] text-white color-scheme-dark" : "bg-slate-50 text-slate-800"}`}
    />
    <div className="flex gap-2">
      <button onClick={onCancel} className={`flex-1 py-2 text-xs font-bold rounded-lg ${isDark ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-black/5 text-slate-500 hover:bg-black/10"}`}>{t('chat.cancel')}</button>
      <button onClick={onSet} disabled={!dateTime} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${!dateTime ? "opacity-50 cursor-not-allowed" : ""} ${isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"}`}>{t('chat.setTime')}</button>
    </div>
  </motion.div>
);
