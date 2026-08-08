/**
 * Message input area component (textarea, send button, voice recording, schedule, etc.)
 * Extracted from ChatPreviewLayer.tsx
 */
import React, { useState, useRef } from "react";
import { Clock, X, Smile, Mic, ChevronRight } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { LiveVoiceRecorder } from "../LiveVoiceRecorder";
import { StickerPicker } from "../chat/StickerPicker";
import { encodeMorse } from "../MorseDecoder";
import { FormattedText } from "./FormattedText";
import { useTheme } from "../../contexts/ThemeContext";

export interface ReplyTarget {
  id: number;
  sender: string;
  text: string;
  type?: string;
  duration?: string;
}

export interface MessageInputAreaProps {
  isChannel: boolean;
  chat: any;
  eMsgText: string;
  setMsgTextFn: (v: string) => void;
  eMorseMode: boolean;
  setMorseModeFn2: (v: boolean) => void;
  eSilentMode: boolean;
  setSilentModeFn2: (v: boolean) => void;
  eShowStickerPicker: boolean;
  setShowStickerPickerFn2: (v: boolean) => void;
  eIsRecordingVoice: boolean;
  setIsRecordingVoiceFn2: (v: boolean) => void;
  eVoiceNoteError: string;
  setVoiceNoteErrFn2: (v: string) => void;
  eScheduleDateTime: string;
  setScheduleDtFn2: (v: string) => void;
  eShowSchedulePopup: boolean;
  setShowSchedulePopupFn2: (v: boolean) => void;
  eReplyTarget: ReplyTarget | null;
  setReplyTargetFn2: (t: ReplyTarget | null) => void;
  sendMessage: () => void;
  sendStickerMessage?: (sticker: string) => void;
  sendVoiceMessage?: (url: string, duration: string) => void;
  onToggleMute?: () => void;
  onAttachImage?: (message: any) => void;
  handleImageAttach?: (e: React.ChangeEvent<HTMLInputElement>, chatData: any, onUpdChat: ((c: any) => void) | undefined, silent: boolean) => void;
  handleSendMessage?: () => void;
  eSilentModeForImage?: boolean;
  setChats?: (updater: any[] | ((prev: any[]) => any[])) => void;
}

export const MessageInputArea: React.FC<MessageInputAreaProps> = ({
  isChannel,
  chat,
  eMsgText,
  setMsgTextFn,
  eMorseMode,
  setMorseModeFn2,
  eSilentMode,
  setSilentModeFn2,
  eShowStickerPicker,
  setShowStickerPickerFn2,
  eIsRecordingVoice,
  setIsRecordingVoiceFn2,
  eVoiceNoteError,
  setVoiceNoteErrFn2,
  eScheduleDateTime,
  setScheduleDtFn2,
  eShowSchedulePopup,
  setShowSchedulePopupFn2,
  eReplyTarget,
  setReplyTargetFn2,
  sendMessage,
  sendStickerMessage,
  sendVoiceMessage,
  onToggleMute,
  handleImageAttach,
  handleSendMessage,
  eSilentModeForImage,
  setChats,
}) => {
  const { t } = useI18n();
  const { isDark } = useTheme();

  if (isChannel) {
    return (
      <div className="px-4 pb-3 pt-1">
        <button
          onClick={() => {
            setChats && setChats((prev: any) => prev.map((c: any) => c.id === chat.id ? { ...c, isMuted: !chat.isMuted } : c));
            if (onToggleMute) onToggleMute();
          }}
          className="w-full py-3 rounded-md flex items-center justify-center cursor-pointer transition-colors font-medium text-sm tracking-wide bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-orange-600 border border-[var(--border-color)] shadow-sm"
        >
          {chat.isMuted ? t("chat.filters.unmuteChannel") : t("chat.filters.muteChannel")}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Schedule popup */}
      {eShowSchedulePopup && (
        <div className="mx-2 sm:mx-3 mb-2 p-2 sm:p-3 rounded-md flex flex-col gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500">{t("chat.scheduleSend")}</span>
            <X size={16} className="cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" onClick={() => setShowSchedulePopupFn2(false)} />
          </div>
          <input
            type="datetime-local"
            value={eScheduleDateTime}
            onChange={(e) => setScheduleDtFn2(e.target.value)}
            className="w-full outline-none text-sm p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)]/10"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setScheduleDtFn2("");
                setShowSchedulePopupFn2(false);
              }}
              className="flex-1 py-2 text-xs font-bold rounded-lg transition-colors bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/10"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={() => setShowSchedulePopupFn2(false)}
              disabled={!eScheduleDateTime}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!eScheduleDateTime ? "opacity-50 cursor-not-allowed" : ""} bg-[var(--accent-soft)] text-[var(--accent)]`}
            >
              {t("chat.setTime")}
            </button>
          </div>
        </div>
      )}

      {/* Voice recording */}
      {eIsRecordingVoice && (
        <div className="px-3 pb-2">
          <LiveVoiceRecorder
            onCancel={() => setIsRecordingVoiceFn2(false)}
            onReRecord={() => setIsRecordingVoiceFn2(true)}
            onPermissionDenied={(msg: string) => {
              setIsRecordingVoiceFn2(false);
              setVoiceNoteErrFn2(msg);
            }}
            onSend={(url: string, dur: string) => {
              setIsRecordingVoiceFn2(false);
              if (sendVoiceMessage) sendVoiceMessage(url, dur);
              else setVoiceNoteErrFn2("");
            }}
            holdToRecord
          />
        </div>
      )}

      {/* Input toolbar */}
      <div className="flex items-center gap-2 px-2 sm:px-3 pb-3 pt-1">
        {!eIsRecordingVoice && (
          <>
            {/* Image attachment */}
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer z-10 min-w-[44px] min-h-[44px]"
                onChange={(e) => {
                  handleImageAttach?.(e, chat, undefined, eSilentModeForImage || false);
                  e.target.value = "";
                }}
              />
              <div className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 relative z-0 bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">
                <Smile size={18} />
              </div>
            </div>

            {/* Schedule */}
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${eScheduleDateTime ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"}`}
              onClick={() => setShowSchedulePopupFn2(!eShowSchedulePopup)}
            >
              <Clock size={18} />
            </div>

            {/* Sticker picker */}
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${eShowStickerPicker ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"}`}
              onClick={() => setShowStickerPickerFn2(!eShowStickerPicker)}
            >
              <Smile size={18} />
            </div>
          </>
        )}

        {/* Text input */}
        <div className="flex-1 min-w-0 h-12 rounded-full px-4 flex items-center relative bg-[var(--bg-primary)] border-[var(--border-color)] shadow-[var(--shadow-neu-inset)]">
          <input
            type="text"
            value={eMsgText}
            onChange={(e) => setMsgTextFn(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={eMorseMode ? t("chat.morsePlaceholder") : t("chat.messagePlaceholder")}
            autoComplete="off"
            inputMode="text"
            className="w-full bg-transparent border-none outline-none text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
             style={eMorseMode ? { fontFamily: "monospace", color: "var(--player-progress-orange)", filter: "saturate(0.8)" } : {}}
          />
          <div className="absolute right-2 flex items-center gap-1">
            <div
              title={t("chat.silentMessage")}
              onClick={() => setSilentModeFn2(!eSilentMode)}
              className={`px-1.5 py-1 rounded-full flex items-center justify-center cursor-pointer transition-colors ${eSilentMode ? "text-blue-500" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"}`}
            >
              <Mic size={12} />
            </div>
            <div
              title={t("chat.toggleMorseEncoder")}
              onClick={() => setMorseModeFn2(!eMorseMode)}
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-mono font-bold cursor-pointer transition-colors ${eMorseMode ? "bg-amber-500 text-[var(--text-primary)]" : "hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"}`}
            >
              M
            </div>
          </div>
        </div>

        {/* Send button */}
        <div
          title={eMsgText ? (eScheduleDateTime ? t("chat.scheduleSend") : t("chat.sendMessage")) : t("chat.holdToRecordVoiceNote")}
          onClick={() => {
            if (eMsgText) sendMessage();
            else {
              setVoiceNoteErrFn2("");
              setIsRecordingVoiceFn2(true);
            }
          }}
          onPointerDown={() => {
            if (!eMsgText) {
              setVoiceNoteErrFn2("");
              setIsRecordingVoiceFn2(true);
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
          className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 active:scale-95 select-none ${eScheduleDateTime && eMsgText ? "bg-blue-500 text-[var(--text-primary)]" : eMsgText ? "bg-gradient-to-tr from-orange-500 to-orange-400 text-[var(--text-primary)]" : "bg-[var(--accent-soft)] text-[var(--accent)]"}`}
        >
          {eMsgText ? (eScheduleDateTime ? <Clock size={16} /> : <ChevronRight size={18} />) : <Mic size={18} />}
        </div>
      </div>

      {/* Reply target */}
      {eReplyTarget && (
        <div className="mx-2 sm:mx-3 mb-1 px-2 sm:px-3 py-2 rounded-md border-l-2 flex items-start justify-between gap-1.5 sm:gap-2 bg-[var(--bg-secondary)]/80 border-orange-500 text-[var(--text-primary)]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold opacity-70">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 15l-6-6-6 6" />
              </svg>
              {t("chat.replyingTo")} {eReplyTarget.sender === "me" ? t("chat.yourMessage") : eReplyTarget.sender}
            </div>
            <div className="text-[12px] truncate mt-0.5">
              {eReplyTarget.text ||
                (eReplyTarget.type === "audio" ? `${t("chat.voiceNote")} ${eReplyTarget.duration || ""}` : eReplyTarget.type === "image" ? t("chat.photoAttachment") : t("chat.attachment"))}
            </div>
          </div>
          <button
            onClick={() => setReplyTargetFn2(null)}
             className="mt-0.5 w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/10"
            aria-label="Remove reply"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Voice note error */}
      {eVoiceNoteError && (
        <div className="mx-3 text-[11px] px-3 py-2 rounded-md bg-red-500/10 text-red-300 border border-red-500/20">
          {eVoiceNoteError}
        </div>
      )}

      {/* Morse mode preview */}
      {eMorseMode && eMsgText && (
        <div className="mx-2 sm:mx-3 px-3 sm:px-5 pt-1 pb-1 font-mono text-[9.5px] sm:text-[10.5px] text-amber-500/80 tracking-widest break-all">
          {encodeMorse(eMsgText)}
        </div>
      )}

      {/* Sticker picker */}
      {eShowStickerPicker && (
        <div className="animate-fade-in">
          <StickerPicker
            theme={isDark ? 'dark' : 'light'}
            onSelect={(sticker: string) => {
              if (sendStickerMessage) sendStickerMessage(sticker);
              setShowStickerPickerFn2(false);
            }}
            onClose={() => setShowStickerPickerFn2(false)}
          />
        </div>
      )}
    </>
  );
};


