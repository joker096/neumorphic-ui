import React from "react";
import { X, BellOff, Clock, ChevronRight, Mic, Smile, Plus } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { LiveVoiceRecorder } from "../LiveVoiceRecorder";
import { StickerPicker } from "../chat/StickerPicker";
import { encodeMorse } from "../MorseDecoder";

interface ChatInputAreaProps {
  isDark: boolean;
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
  eReplyTarget: any;
  setLocalReplyTarget: (v: any) => void;
  sendMessage: () => void;
  sendVoiceMessage?: (url: string, dur: string) => void;
  sendStickerMessage?: (sticker: string) => void;
  handleImageAttach: (e: React.ChangeEvent<HTMLInputElement>, chat: any, onUpdateChat: any, silent: boolean) => void;
  onUpdateChat?: (chat: any) => void;
  onAction?: (action: string) => void;
  setChannels?: (updater: any) => void;
  theme: "light" | "dark";
  t: (key: string, opts?: any) => string;
}

function ChatInputAreaImpl({
  isDark,
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
  setLocalReplyTarget,
  sendMessage,
  sendVoiceMessage,
  sendStickerMessage,
  handleImageAttach,
  onUpdateChat,
  onAction,
  setChannels,
  theme,
  t,
}: ChatInputAreaProps) {
  const { t: translate } = useI18n();
  const messagePlaceholder = eMorseMode ? t("chat.morsePlaceholder") : t("chat.messagePlaceholder");
  const inputStyle = eMorseMode
    ? { fontFamily: "monospace", color: isDark ? "#fbbf24" : "#d97706", filter: "saturate(0.8)" }
    : undefined;

  if (isChannel) {
    return (
      <div className="px-4 pb-3 pt-1">
        <button
          type="button"
          onClick={() => {
            setChannels?.((prev: any) => prev.map((c: any) => (c.id === chat.id ? { ...c, isMuted: !chat.isMuted } : c)));
            onAction?.("MUTE_TOGGLE");
          }}
          className={`w-full py-3 rounded-xl flex items-center justify-center cursor-pointer transition-colors font-medium text-sm tracking-wide ${
            isDark
              ? "bg-[var(--bg-secondary)] hover:bg-[#20242e] text-orange-400 border border-[var(--border-color)]"
              : "bg-white hover:bg-slate-50 text-orange-600 border border-[var(--border-color)] shadow-sm"
          }`}
        >
          {chat.isMuted ? t("chat.filters.unmuteChannel") : t("chat.filters.muteChannel")}
        </button>
      </div>
    );
  }

  return (
    <>
      {eShowSchedulePopup && (
        <div className={`mx-2 sm:mx-3 mb-2 p-2 sm:p-3 rounded-xl flex flex-col gap-2 ${
          isDark ? "bg-[var(--bg-secondary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)] shadow-sm"
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500">{t("chat.scheduleSend")}</span>
            <button
              type="button"
              className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center cursor-pointer ${
                isDark ? "text-gray-400 hover:text-[var(--text-primary)]" : "text-slate-400 hover:text-slate-800"
              }`}
              onClick={() => setShowSchedulePopupFn2(false)}
              aria-label={translate("common.close")}
            >
              <X size={16} />
            </button>
          </div>
          <input
            type="datetime-local"
            value={eScheduleDateTime}
            onChange={(e) => setScheduleDtFn2(e.target.value)}
            className={`w-full outline-none text-sm p-2 rounded-lg ${
              isDark ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]" : "bg-slate-50 text-slate-800"
            }`}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setScheduleDtFn2("");
                setShowSchedulePopupFn2(false);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg ${
                isDark ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-black/5 text-slate-500 hover:bg-black/10"
              }`}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={() => setShowSchedulePopupFn2(false)}
              disabled={!eScheduleDateTime}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                !eScheduleDateTime ? "opacity-50 cursor-not-allowed" : ""
              } ${isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"}`}
            >
              {t("chat.setTime")}
            </button>
          </div>
        </div>
      )}

      {eIsRecordingVoice ? (
        <div className="px-3 pb-2">
          <LiveVoiceRecorder
            isDark={isDark}
            onCancel={() => setIsRecordingVoiceFn2(false)}
            onReRecord={() => setIsRecordingVoiceFn2(true)}
            onPermissionDenied={(msg: string) => {
              setIsRecordingVoiceFn2(false);
              setVoiceNoteErrFn2(msg);
            }}
            onSend={(url, dur) => {
              setIsRecordingVoiceFn2(false);
              if (sendVoiceMessage) sendVoiceMessage(url, dur);
              else setVoiceNoteErrFn2("");
            }}
            holdToRecord
          />
        </div>
      ) : null}

      <div className="flex items-center gap-2 px-2 sm:px-3 pb-3 pt-1">
        {!eIsRecordingVoice && (
          <>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={(e) => {
                  handleImageAttach(e, chat, onUpdateChat, eSilentMode);
                  e.target.value = "";
                }}
                aria-label={t("chat.attachFile")}
              />
              <div className={`min-w-[44px] min-h-[44px] sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 relative z-0 ${
                isDark ? "bg-[var(--bg-secondary)] text-gray-400 hover:text-[var(--text-primary)] hover:bg-white/5" : "bg-[var(--bg-primary)] text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              }`}>
                <Plus size={16} />
              </div>
            </div>

            <button
              type="button"
              aria-label={t("chat.scheduleMessage")}
              className={`min-w-[44px] min-h-[44px] sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
                eScheduleDateTime
                  ? isDark
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-orange-100 text-orange-600"
                  : isDark
                    ? "bg-[var(--bg-secondary)] text-gray-400 hover:text-[var(--text-primary)] hover:bg-white/5"
                    : "bg-[var(--bg-primary)] text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              }`}
              onClick={() => setShowSchedulePopupFn2(!eShowSchedulePopup)}
            >
              <Clock size={16} />
            </button>

            <button
              type="button"
              aria-label={t("stickers.title")}
              className={`min-w-[44px] min-h-[44px] sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
                eShowStickerPicker
                  ? isDark
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-orange-100 text-orange-600"
                  : isDark
                    ? "bg-[var(--bg-secondary)] text-gray-400 hover:text-[var(--text-primary)] hover:bg-white/5"
                    : "bg-[var(--bg-primary)] text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              }`}
              onClick={() => setShowStickerPickerFn2(!eShowStickerPicker)}
            >
              <Smile size={16} />
            </button>
          </>
        )}

        <div className={`flex-1 min-w-0 h-11 sm:h-12 rounded-full px-2 sm:px-3 md:px-4 flex items-center relative ${
          isDark ? "bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]" : "bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-[inset_2px_2px_4px_rgba(165,175,190,0.2)]"
        }`}>
          <input
            type="text"
            value={eMsgText}
            onChange={(e) => setMsgTextFn(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={messagePlaceholder}
            autoComplete="off"
            inputMode="text"
            enterKeyHint="send"
            spellCheck={!eMorseMode}
            className={`w-full bg-transparent border-none outline-none text-[12px] sm:text-[13px] md:text-[14px] ${
              isDark ? "text-[var(--text-primary)] placeholder:text-gray-500" : "text-slate-700 placeholder:text-slate-400"
            }`}
            style={inputStyle}
          />
          <div className="absolute right-1 sm:right-2 flex items-center gap-1">
            <button
              type="button"
              title={t("chat.silentMessage")}
              aria-label={t("chat.silentMessage")}
              onClick={() => {
                setSilentModeFn2(!eSilentMode);
              }}
              className={`px-1.5 py-1 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                eSilentMode
                  ? isDark
                    ? "text-blue-400"
                    : "text-blue-500"
                  : isDark
                    ? "text-gray-600 hover:text-gray-400"
                    : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <BellOff size={12} />
            </button>
            <button
              type="button"
              title={t("chat.toggleMorseEncoder")}
              aria-label={t("chat.toggleMorseEncoder")}
              onClick={() => {
                setMorseModeFn2(!eMorseMode);
              }}
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                eMorseMode
                  ? "bg-amber-500 text-[var(--text-primary)]"
                  : isDark
                    ? "hover:bg-white/10 text-gray-400"
                    : "hover:bg-black/5 text-slate-400"
              }`}
            >
              M
            </button>
          </div>
        </div>

        <button
          type="button"
          title={eMsgText ? (eScheduleDateTime ? t("chat.scheduleSend") : t("chat.sendMessage")) : t("chat.holdToRecordVoiceNote")}
          aria-label={eMsgText ? (eScheduleDateTime ? t("chat.scheduleSend") : t("chat.sendMessage")) : t("chat.holdToRecordVoiceNote")}
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
          className={`min-w-[44px] min-h-[44px] sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 active:scale-95 select-none ${
            eScheduleDateTime && eMsgText
              ? isDark
                ? "bg-blue-600 text-[var(--text-primary)]"
                : "bg-blue-500 text-[var(--text-primary)]"
              : eMsgText
                ? isDark
                  ? "bg-gradient-to-tr from-orange-500 to-orange-400 text-[var(--text-primary)] shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                  : "bg-gradient-to-tr from-orange-400 to-orange-300 text-orange-950"
                : isDark
                  ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                  : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"
          }`}
        >
          {eMsgText ? (eScheduleDateTime ? <Clock size={16} /> : <ChevronRight size={18} />) : <Mic size={18} />}
        </button>
      </div>

      {eReplyTarget && (
        <div className={`mx-2 sm:mx-3 mb-1 px-2 sm:px-3 py-2 rounded-xl border-l-2 flex items-start justify-between gap-1.5 sm:gap-2 ${
          isDark ? "bg-[var(--bg-tertiary)]/80 border-orange-400/60 text-gray-300" : "bg-white/80 border-orange-500 text-slate-700"
        }`}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold opacity-70">
              <ChevronRight size={10} className="rotate-180" />
              {t("chat.replyingTo")} {eReplyTarget.sender === "me" ? t("chat.yourMessage") : eReplyTarget.sender}
            </div>
            <div className="text-[12px] truncate mt-0.5">
              {eReplyTarget.text ||
                (eReplyTarget.type === "audio"
                  ? `${t("chat.voiceNote")}${eReplyTarget.duration || ""}`
                  : eReplyTarget.type === "image"
                    ? t("chat.photoAttachment")
                    : t("chat.attachment"))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLocalReplyTarget(null)}
            className={`mt-0.5 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-90 ${
              isDark ? "text-gray-500 hover:text-[var(--text-primary)] hover:bg-white/10" : "text-slate-400 hover:text-slate-800 hover:bg-black/10"
            }`}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      )}

      {eVoiceNoteError && (
        <div className={`mx-1 sm:mx-2 md:mx-3 text-[11px] px-2 sm:px-3 py-2 rounded-xl ${
          isDark ? "bg-red-500/10 text-red-300 border border-red-500/20" : "bg-red-50 text-red-600 border border-red-200"
        }`}>
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
          <StickerPicker
            theme={theme}
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
}

export const ChatInputArea = React.memo(ChatInputAreaImpl);




